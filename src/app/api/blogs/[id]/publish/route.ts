import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { invalidateBlogCaches } from "@/lib/cache-invalidation";
import { connectDB } from "@/lib/mongodb";
import Blog from "@/models/Blog";
import { denied, requireUser } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { canPerformAction } from "@/lib/permissions";
import { resolvePublishStatus } from "@/lib/public-posts";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser();
    if (denied(actor)) return actor;
    if (!actor.emailVerified) return jsonError("Verify your email before continuing", 403);

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return jsonError("Invalid blog ID", 400);
    }

    await connectDB();

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) return jsonError("Blog not found", 404);

    const canPublish =
      canPerformAction(actor.role, "editOwnBlog", existingBlog.authorId.toString(), actor.id) ||
      canPerformAction(actor.role, "editAnyBlog");
    if (!canPublish) return jsonError("Forbidden", 403);

    const next = resolvePublishStatus();
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        status: next.status,
        publishedAt: existingBlog.publishedAt || new Date(),
      },
      { returnDocument: "after" }
    );

    await invalidateBlogCaches({
      blogId: id,
      authorId: existingBlog.authorId.toString(),
    });

    return NextResponse.json({
      message: next.message,
      blog: updatedBlog,
    });
  } catch (error) {
    return serverError("Error publishing blog:", error);
  }
}
