import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { denied, requireUser } from "@/lib/authz";
import { syncCommentCount } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { canPerformAction, hasPermission } from "@/lib/permissions";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const { commentId } = await params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) return jsonError("Comment not found", 404);

    await connectDB();
    const comment = await Comment.findById(commentId);
    if (!comment) return jsonError("Comment not found", 404);

    const canEdit =
      canPerformAction(actor.role, "editOwnComment", comment.userId.toString(), actor.id) ||
      canPerformAction(actor.role, "editAnyComment");
    if (!canEdit) return jsonError("You don't have permission to edit this comment", 403);

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content || content.length > 1000) return jsonError("Content is required", 400);

    const isApproved = hasPermission(actor.role, "approveComment");
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content, isEdited: true, editedAt: new Date(), isApproved },
      { returnDocument: "after" }
    ).populate("userId", "profile.fullName profile.avatar name");

    await syncCommentCount(comment.blogId);

    return NextResponse.json({
      message: isApproved ? "Comment updated successfully" : "Comment submitted for approval",
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

    const canDelete =
      canPerformAction(actor.role, "deleteOwnComment", comment.userId.toString(), actor.id) ||
      canPerformAction(actor.role, "deleteAnyComment");
    if (!canDelete) return jsonError("You don't have permission to delete this comment", 403);

    const blogId = comment.blogId;
    await Comment.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] });
    await syncCommentCount(blogId);

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    return serverError("Error deleting comment:", error);
  }
}
