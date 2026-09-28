import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;

    const { commentId } = await params;
    if (!mongoose.Types.ObjectId.isValid(commentId)) return jsonError("Comment not found", 404);

    await connectDB();
    const userId = new mongoose.Types.ObjectId(actor.id);

    const removed = await Comment.findOneAndUpdate(
      { _id: commentId, likes: userId },
      { $pull: { likes: userId } },
      { returnDocument: "after" }
    );
    if (removed) {
      return NextResponse.json({ liked: false, likesCount: removed.likes.length });
    }

    const added = await Comment.findOneAndUpdate(
      { _id: commentId, likes: { $ne: userId } },
      { $addToSet: { likes: userId } },
      { returnDocument: "after" }
    );
    if (!added) return jsonError("Comment not found", 404);

    return NextResponse.json({ liked: true, likesCount: added.likes.length });
  } catch (error) {
    return serverError("Error toggling comment like:", error);
  }
}
