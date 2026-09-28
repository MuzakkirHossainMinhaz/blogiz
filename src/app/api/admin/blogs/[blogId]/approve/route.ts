import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requirePermission } from "@/lib/authz";
import { serverError } from "@/lib/http";

// POST /api/admin/blogs/[blogId]/approve - Approve a blog
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }
) {
  try {
    const actor = await requirePermission("approveBlog", { verified: true });
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

    const adminId = actor.id;

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
      { returnDocument: "after" }
    ).populate("approvedBy", "name profile.fullName");

    return NextResponse.json({
      message: "Blog approved successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    return serverError("Error approving blog:", error);
  }
}
