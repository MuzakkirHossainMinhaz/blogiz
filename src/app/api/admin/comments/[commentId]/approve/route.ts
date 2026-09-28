import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { denied, requirePermission } from "@/lib/authz";
import { syncCommentCount } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const actor = await requirePermission("approveComment", { verified: true });
    if (denied(actor)) return actor;

    const { commentId } = await params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) return jsonError("Comment not found", 404);

    await connectDB();
    const comment = await Comment.findById(commentId);
    if (!comment) return jsonError("Comment not found", 404);

    const updatedComment = await Comment.findByIdAndUpdate(commentId, { isApproved: true }, { returnDocument: "after" }).populate(
      "userId",
      "profile.fullName profile.avatar name"
    );
    await syncCommentCount(comment.blogId);

    return NextResponse.json({
      message: "Comment approved successfully",
      comment: updatedComment,
    });
  } catch (error) {
    return serverError("Error approving comment:", error);
  }
}
