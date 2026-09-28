import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Like from "@/models/Like";
import Comment from "@/models/Comment";
import BlogView from "@/models/BlogView";
import { denied, requirePermission, requireUser } from "@/lib/authz";
import { withOptionalTransaction } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { canPerformAction } from "@/lib/permissions";
import { PUBLIC_AUTHOR_FIELDS, canViewPost, resolveUpdateStatus } from "@/lib/public-posts";
import { isStoredImageUrl } from "@/lib/urls";
import { blogWriteSchema } from "@/lib/validation";

function invalidId() {
  return jsonError("Invalid blog ID", 400);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();

    const actor = await requireUser();
    const viewer = denied(actor) ? null : actor;

    await connectDB();

    const blog = await Blog.findById(id)
      .populate("authorId", PUBLIC_AUTHOR_FIELDS)
      .populate("approvedBy", "name profile.fullName")
      .lean();

    if (!blog || !canViewPost(blog, viewer)) {
      return jsonError("Blog not found", 404);
    }

    return NextResponse.json({ blog });
  } catch (error) {
    return serverError("Error fetching blog:", error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("editOwnBlog", { verified: true });
    if (denied(actor)) return actor;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();

    await connectDB();

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) return jsonError("Blog not found", 404);

    const canEdit =
      canPerformAction(actor.role, "editOwnBlog", existingBlog.createdBy.toString(), actor.id) ||
      canPerformAction(actor.role, "editAnyBlog");
    if (!canEdit) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = blogWriteSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400);

    const { title, description, content, author_name, blog_image, publish_date } = parsed.data;
    if (blog_image && !isStoredImageUrl(blog_image)) {
      return jsonError("Image must be an uploaded file", 400);
    }

    const statusUpdate = resolveUpdateStatus(actor.role, body.status);

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(content && { content }),
        ...(author_name && { author_name }),
        ...(blog_image && { blog_image }),
        ...(publish_date && { publish_date }),
        ...(statusUpdate
          ? {
              status: statusUpdate.status,
              isApproved: statusUpdate.isApproved,
              ...(statusUpdate.isApproved ? { approvedBy: actor.id, approvedAt: new Date() } : {}),
            }
          : {}),
      },
      { returnDocument: "after", runValidators: true }
    );

    return NextResponse.json({
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    return serverError("Error updating blog:", error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermission("deleteOwnBlog", { verified: true });
    if (denied(actor)) return actor;

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();

    await connectDB();

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) return jsonError("Blog not found", 404);

    const canDelete =
      canPerformAction(actor.role, "deleteOwnBlog", existingBlog.createdBy.toString(), actor.id) ||
      canPerformAction(actor.role, "deleteAnyBlog");
    if (!canDelete) return jsonError("Forbidden", 403);

    await withOptionalTransaction(async (session) => {
      await Like.deleteMany({ blogId: id }, { session: session ?? undefined });
      await Comment.deleteMany({ blogId: id }, { session: session ?? undefined });
      await BlogView.deleteMany({ blogId: id }, { session: session ?? undefined });
      await Blog.findByIdAndDelete(id, { session: session ?? undefined });
    });

    return NextResponse.json({
      message: "Blog and associated likes deleted successfully",
    });
  } catch (error) {
    return serverError("Error deleting blog:", error);
  }
}
