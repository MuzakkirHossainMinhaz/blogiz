import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// POST /api/admin/comments/[commentId]/approve - Approve a comment
export async function POST(
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

    const userRole = (session.user as any).role;
    if (!hasPermission(userRole, "approveComment")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
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

    // Approve comment
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { isApproved: true },
      { new: true }
    ).populate("userId", "profile.fullName profile.avatar name");

    return NextResponse.json({
      message: "Comment approved successfully",
      comment: updatedComment,
    });
  } catch (error: any) {
    console.error("Error approving comment:", error);
    return NextResponse.json(
      { error: "Failed to approve comment", message: error.message },
      { status: 500 }
    );
  }
}
