import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import Reaction from "@/models/Reaction";
import Comment from "@/models/Comment";
import BlogView from "@/models/BlogView";
import ModerationAction from "@/models/ModerationAction";
import { denied, requirePermission, requireUser } from "@/lib/authz";
import { withOptionalTransaction } from "@/lib/engagement";
import { jsonError, serverError } from "@/lib/http";
import { canPerformAction } from "@/lib/permissions";
import { PUBLIC_AUTHOR_FIELDS, canViewPost, isBlogStatus } from "@/lib/public-posts";
import { deleteStoredImage } from "@/lib/object-storage";
import { UploadError } from "@/lib/uploads";
import { isStoredImageUrl } from "@/lib/urls";
import { authorProfileId } from "@/lib/utils";
import { blogWriteSchema } from "@/lib/validation";

function invalidId() {
  return jsonError("Invalid blog ID", 400);
}

function ownerId(blog: { authorId: unknown; createdBy?: unknown }) {
  return authorProfileId(blog.authorId) ?? authorProfileId(blog.createdBy) ?? "";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return invalidId();

    const actor = await requireUser();
    const viewer = denied(actor) ? null : actor;

    await connectDB();

    const blog = await Blog.findById(id).populate("authorId", PUBLIC_AUTHOR_FIELDS).lean();

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
      canPerformAction(actor.role, "editOwnBlog", ownerId(existingBlog), actor.id) ||
      canPerformAction(actor.role, "editAnyBlog");
    if (!canEdit) return jsonError("Forbidden", 403);

    const body = await request.json();
    const parsed = blogWriteSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400);

    const { title, description, content, authorName, thumbnail, thumbnailPublicId, thumbnailSource, tags } =
      parsed.data;
    let nextImage: string | undefined;
    if (thumbnail !== undefined) {
      nextImage = thumbnail.trim();
      if (nextImage && !isStoredImageUrl(nextImage)) {
        return jsonError("Image must be an uploaded file", 400);
      }
      if (existingBlog.thumbnail && existingBlog.thumbnail !== nextImage) {
        await deleteStoredImage(existingBlog.thumbnail);
      }
    }

    const updates: Record<string, unknown> = {
      ...(title && { title }),
      ...(description && { description }),
      ...(content && { content }),
      ...(authorName && { authorName }),
      ...(nextImage !== undefined && { thumbnail: nextImage }),
      ...(thumbnailPublicId !== undefined && { thumbnailPublicId }),
      ...(thumbnailSource && { thumbnailSource }),
      ...(tags && { tags }),
    };

    if (content) {
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      updates.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    if (isBlogStatus(body.status)) {
      updates.status = body.status;
      if (body.status === "published") {
        updates.publishedAt = existingBlog.publishedAt || new Date();
      }
      if (
        body.status === "draft" &&
        existingBlog.status === "published" &&
        canPerformAction(actor.role, "editAnyBlog")
      ) {
        await ModerationAction.create({
          actorId: actor.id,
          subjectBlogId: id,
          action: "unpublish_blog",
        });
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updates, {
      returnDocument: "after",
      runValidators: true,
    });

    return NextResponse.json({
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
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
      canPerformAction(actor.role, "deleteOwnBlog", ownerId(existingBlog), actor.id) ||
      canPerformAction(actor.role, "deleteAnyBlog");
    if (!canDelete) return jsonError("Forbidden", 403);

    if (existingBlog.thumbnail) {
      await deleteStoredImage(existingBlog.thumbnail);
    }

    const isAdminDelete = canPerformAction(actor.role, "deleteAnyBlog") && ownerId(existingBlog) !== actor.id;

    await withOptionalTransaction(async (session) => {
      await Reaction.deleteMany({ blogId: id }, { session: session ?? undefined });
      await Comment.deleteMany({ blogId: id }, { session: session ?? undefined });
      await BlogView.deleteMany({ blogId: id }, { session: session ?? undefined });
      await Blog.findByIdAndDelete(id, { session: session ?? undefined });
      if (isAdminDelete) {
        await ModerationAction.create(
          [
            {
              actorId: actor.id,
              subjectBlogId: id,
              action: "delete_blog",
            },
          ],
          { session: session ?? undefined }
        );
      }
    });

    return NextResponse.json({
      message: "Blog and associated reactions deleted successfully",
    });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    return serverError("Error deleting blog:", error);
  }
}
