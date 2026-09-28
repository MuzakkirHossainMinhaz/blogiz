import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requirePermission } from "@/lib/authz";
import { serverError } from "@/lib/http";

// POST /api/admin/blogs/[blogId]/reject - Reject a blog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const actor = await requirePermission("rejectBlog", { verified: true });
    if (denied(actor)) return actor;

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

    const adminId = actor.id;

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
      { returnDocument: "after" }
    ).populate("approvedBy", "name profile.fullName");

    return NextResponse.json({
      message: "Blog rejected successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    return serverError("Error rejecting blog:", error);
  }
}
