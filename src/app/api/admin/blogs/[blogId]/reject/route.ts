import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// POST /api/admin/blogs/[blogId]/reject - Reject a blog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
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
    if (!hasPermission(userRole, "rejectBlog")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    await connectDB();
    const { blogId } = await params;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rejectionReason } = body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const adminId = (session.user as any).id;

    // Reject blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        status: "rejected",
        isApproved: false,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: rejectionReason.trim(),
      },
      { new: true }
    ).populate("approvedBy", "name profile.fullName");

    return NextResponse.json({
      message: "Blog rejected successfully",
      blog: updatedBlog,
    });
  } catch (error: any) {
    console.error("Error rejecting blog:", error);
    return NextResponse.json(
      { error: "Failed to reject blog", message: error.message },
      { status: 500 }
    );
  }
}
