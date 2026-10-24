import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import {
  imageGenerationConfigured,
  imageUnavailableMessage,
  mapAiHttpError,
} from "@/lib/ai-provider";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { geminiAI } from "@/lib/gemini";
import { jsonError, serverError } from "@/lib/http";
import { connectDB } from "@/lib/mongodb";
import { canPerformAction, type UserRole } from "@/lib/permissions";
import { buildPollinationsImageUrl, PollinationsError } from "@/lib/pollinations";
import { RateLimitUnavailable } from "@/lib/rate-limit";
import { authorProfileId } from "@/lib/utils";
import Blog from "@/models/Blog";

const CONTENT_EXCERPT_MAX = 2000;

function ownerId(blog: { authorId: unknown; createdBy?: unknown }) {
  return authorProfileId(blog.authorId) ?? authorProfileId(blog.createdBy) ?? "";
}

async function assertBlogAccess(blogId: string, actorId: string, actorRole: UserRole) {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    return jsonError("blogId is required", 400);
  }

  await connectDB();
  const blog = await Blog.findById(blogId);
  if (!blog) return jsonError("Blog not found", 404);

  const canEdit =
    canPerformAction(actorRole, "editOwnBlog", ownerId(blog), actorId) ||
    canPerformAction(actorRole, "editAnyBlog");
  if (!canEdit) return jsonError("Forbidden", 403);

  return blog;
}

async function generate(input: {
  blogId: string;
  direction?: string;
  title: string;
  description?: string;
  content?: string;
}) {
  if (!imageGenerationConfigured()) {
    return jsonError(imageUnavailableMessage(), 503);
  }

  const title = input.title.trim();
  if (!title) return jsonError("Title is required", 400);

  try {
    const crafted = await geminiAI.craftCoverImagePrompt({
      title,
      description: input.description,
      content: input.content,
      direction: input.direction,
    });

    // Persist the Pollinations URL string only — no fetch/re-upload. Seed = Mongo `_id`.
    const pollinationsUrl = buildPollinationsImageUrl(crafted, input.blogId);
    return NextResponse.json({ url: pollinationsUrl, prompt: crafted });
  } catch (error) {
    if (error instanceof PollinationsError) {
      return jsonError(
        error.message,
        error.status === 400 ? 400 : error.status === 429 ? 429 : error.status === 503 ? 503 : 502
      );
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiUser(request);
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const blogId = typeof body?.blogId === "string" ? body.blogId.trim() : "";
    if (!blogId) return jsonError("blogId is required", 400);

    const access = await assertBlogAccess(blogId, actor.id, actor.role);
    if (access instanceof NextResponse) return access;

    const direction =
      typeof body?.prompt === "string" ? body.prompt.trim().slice(0, 500) : "";
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
    const description =
      typeof body?.description === "string"
        ? body.description.trim().slice(0, 500)
        : typeof body?.summary === "string"
          ? body.summary.trim().slice(0, 500)
          : "";
    const content =
      typeof body?.content === "string" ? body.content.trim().slice(0, CONTENT_EXCERPT_MAX) : "";

    if (!title) return jsonError("Title is required", 400);

    return await generate({
      blogId,
      title,
      description: description || undefined,
      content: content || undefined,
      direction: direction || undefined,
    });
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    const mapped = mapAiHttpError(error);
    if (mapped) return jsonError(mapped.message, mapped.status);
    return serverError("Image generation failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAiUser(request);
    if (denied(actor)) return actor;

    const params = new URL(request.url).searchParams;
    const blogId = params.get("blogId")?.trim() || "";
    if (!blogId) return jsonError("blogId is required", 400);

    const access = await assertBlogAccess(blogId, actor.id, actor.role);
    if (access instanceof NextResponse) return access;

    const title = params.get("title")?.trim().slice(0, 200) || "";
    if (!title) return jsonError("Title is required", 400);
    return await generate({ blogId, title });
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    const mapped = mapAiHttpError(error);
    if (mapped) return jsonError(mapped.message, mapped.status);
    return serverError("Blog cover generation failed:", error);
  }
}
