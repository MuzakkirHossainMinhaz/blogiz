import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

// POST /api/admin/blogs/[blogId]/approve - Approve a blog
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
    if (!hasPermission(userRole, "approveBlog")) {
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

    const adminId = (session.user as any).id;

    // Approve blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        status: "published",
        isApproved: true,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectionReason: "",
      },
      { new: true }
    ).populate("approvedBy", "name profile.fullName");

    return NextResponse.json({
      message: "Blog approved successfully",
      blog: updatedBlog,
    });
  } catch (error: any) {
    console.error("Error approving blog:", error);
    return NextResponse.json(
      { error: "Failed to approve blog", message: error.message },
      { status: 500 }
    );
  }
}
