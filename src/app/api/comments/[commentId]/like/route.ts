import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { auth } from "@/lib/auth";

// POST /api/comments/[commentId]/like - Toggle like on a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please login to like comments" },
        { status: 401 }
      );
    }

    await connectDB();
    const { commentId } = await params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const userId = (session.user as any).id;
    const userIdObj = userId;

    // Check if user already liked this comment
    const likeIndex = comment.likes.indexOf(userIdObj);
    const isLiked = likeIndex > -1;

    if (isLiked) {
      // Remove like
      comment.likes.splice(likeIndex, 1);
    } else {
      // Add like
      comment.likes.push(userIdObj);
    }

    await comment.save();

    return NextResponse.json({
      liked: !isLiked,
      likesCount: comment.likes.length,
    });
  } catch (error: any) {
    console.error("Error toggling comment like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like", message: error.message },
      { status: 500 }
    );
  }
}
