import { NextRequest, NextResponse } from "next/server";
import { huggingFaceConfigured } from "@/lib/ai-provider";
import { denied, requirePermission } from "@/lib/authz";
import { huggingFaceAI } from "@/lib/huggingface";
import { jsonError, serverError } from "@/lib/http";
import { rateLimit, RateLimitUnavailable } from "@/lib/rate-limit";
import { BLOG_CONTENT_MAX } from "@/lib/validation";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 20;

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("createBlog", { verified: true });
    if (denied(actor)) return actor;

    if (!huggingFaceConfigured()) {
      return jsonError("Writing assistant is unavailable", 503);
    }

    try {
      const attempt = await rateLimit(`ai:optimize:${actor.id}`, LIMIT, WINDOW_MS);
      if (!attempt.ok) return jsonError("Too many requests", 429);
    } catch (error) {
      if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
      throw error;
    }

    const body = await request.json().catch(() => null);
    const field = body?.field === "title" || body?.field === "content" ? body.field : null;
    if (!field) return jsonError('field must be "title" or "content"', 400);

    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
    const content =
      typeof body?.content === "string" ? body.content.trim().slice(0, BLOG_CONTENT_MAX) : "";

    const source = field === "title" ? title : content;
    if (!source) {
      return jsonError(field === "title" ? "Title is required" : "Content is required", 400);
    }

    const optimized = await huggingFaceAI.improveWriting(source);
    if (!optimized) return jsonError("Writing assistant is unavailable", 502);

    return NextResponse.json({ optimized });
  } catch (error) {
    return serverError("Writing optimization failed:", error);
  }
}
