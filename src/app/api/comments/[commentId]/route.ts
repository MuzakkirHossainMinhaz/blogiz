import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Blog from "@/models/Blog";
import ModerationAction from "@/models/ModerationAction";
import { denied, requireUser } from "@/lib/authz";
import { syncCommentCount } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { canPerformAction, hasPermission } from "@/lib/permissions";

async function canModerateComment(
  actor: { id: string; role: Parameters<typeof hasPermission>[0] },
  comment: { userId: { toString(): string }; blogId: { toString(): string } }
) {
  if (canPerformAction(actor.role, "deleteAnyComment")) return true;
  if (canPerformAction(actor.role, "deleteOwnComment", comment.userId.toString(), actor.id)) return true;
  if (hasPermission(actor.role, "moderateOwnBlogComments")) {
    const blog = await Blog.findById(comment.blogId).select("authorId").lean();
    return Boolean(blog && blog.authorId.toString() === actor.id);
  }
  return false;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const { commentId } = await params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) return jsonError("Comment not found", 404);

    await connectDB();
    const comment = await Comment.findById(commentId);
    if (!comment) return jsonError("Comment not found", 404);

    const body = await request.json().catch(() => null);
    const action = typeof body?.action === "string" ? body.action : "";

    if (action === "hide" || action === "unhide") {
      const allowed = await canModerateComment(actor, comment);
      if (!allowed) return jsonError("You don't have permission to moderate this comment", 403);

      comment.isVisible = action === "unhide";
      await comment.save();
      await syncCommentCount(comment.blogId);

      if (action === "hide" && hasPermission(actor.role, "deleteAnyComment")) {
        await ModerationAction.create({
          actorId: actor.id,
          subjectCommentId: commentId,
          subjectBlogId: comment.blogId,
          action: "hide_comment",
        });
      }

      return NextResponse.json({
        message: action === "hide" ? "Comment hidden" : "Comment restored",
        comment,
      });
    }

    const canEdit =
      canPerformAction(actor.role, "editOwnComment", comment.userId.toString(), actor.id) ||
      canPerformAction(actor.role, "editAnyComment");
    if (!canEdit) return jsonError("You don't have permission to edit this comment", 403);

    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 1000) return jsonError("Content is required", 400);

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content, isEdited: true, editedAt: new Date() },
      { returnDocument: "after" }
    ).populate("userId", "profile.fullName profile.avatar name");

    return NextResponse.json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    return serverError("Error updating comment:", error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const { commentId } = await params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) return jsonError("Comment not found", 404);

    await connectDB();
    const comment = await Comment.findById(commentId);
    if (!comment) return jsonError("Comment not found", 404);

    const allowed = await canModerateComment(actor, comment);
    if (!allowed) return jsonError("You don't have permission to delete this comment", 403);

    const blogId = comment.blogId;
    await Comment.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] });
    await syncCommentCount(blogId);

    if (hasPermission(actor.role, "deleteAnyComment") && comment.userId.toString() !== actor.id) {
      await ModerationAction.create({
        actorId: actor.id,
        subjectCommentId: commentId,
        subjectBlogId: blogId,
        action: "delete_comment",
      });
    }

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    return serverError("Error deleting comment:", error);
  }
}
