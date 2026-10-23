import { NextRequest, NextResponse } from "next/server";
import {
  getAiClient,
  mapAiHttpError,
  textAiConfigured,
  textAiUnavailableMessage,
} from "@/lib/ai-provider";
import { enforceAiRateLimit } from "@/lib/ai-rate-limit";
import { denied, requirePermission } from "@/lib/authz";
import { jsonError, serverError } from "@/lib/http";
import { RateLimitUnavailable } from "@/lib/rate-limit";
import { BLOG_CONTENT_MAX } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("createBlog", { verified: true });
    if (denied(actor)) return actor;

    if (!textAiConfigured()) {
      return jsonError(textAiUnavailableMessage(), 503);
    }

    const limited = await enforceAiRateLimit(request, actor.id);
    if (limited) return limited;

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

    const optimized = await getAiClient().improveWriting(source, field);
    if (!optimized) return jsonError("Writing assistant returned an empty suggestion", 502);

    return NextResponse.json({ optimized });
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    const mapped = mapAiHttpError(error);
    if (mapped) return jsonError(mapped.message, mapped.status);
    return serverError("Writing optimization failed:", error);
  }
}
