import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";
import { canPerformAction } from "@/lib/permissions";

// PUT /api/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
    const userRole = (session.user as any).role;

    // Check if user can edit this comment
    const canEdit = canPerformAction(
      userRole,
      "editOwnComment",
      comment.userId.toString(),
      userId
    ) || canPerformAction(userRole, "editAnyComment");

    if (!canEdit) {
      return NextResponse.json(
        { error: "You don't have permission to edit this comment" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Update comment
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        content: content.trim(),
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true }
    ).populate("userId", "profile.fullName profile.avatar name");

    return NextResponse.json({
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error: any) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment", message: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
    const userRole = (session.user as any).role;

    // Check if user can delete this comment
    const canDelete = canPerformAction(
      userRole,
      "deleteOwnComment",
      comment.userId.toString(),
      userId
    ) || canPerformAction(userRole, "deleteAnyComment");

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to delete this comment" },
        { status: 403 }
      );
    }

    // Delete comment and its replies
    await Comment.deleteMany({ 
      $or: [
        { _id: commentId },
        { parentId: commentId }
      ]
    });

    // Update blog comment count
    const deletedCount = await Comment.countDocuments({ 
      blogId: comment.blogId,
      parentId: null,
      isApproved: true 
    });
    
    await Blog.findByIdAndUpdate(comment.blogId, {
      total_comments: deletedCount,
    });

    return NextResponse.json({
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment", message: error.message },
      { status: 500 }
    );
  }
}
