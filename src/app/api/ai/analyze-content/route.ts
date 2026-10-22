import { NextRequest, NextResponse } from "next/server";
import { huggingFaceConfigured, mapHuggingFaceHttpError } from "@/lib/ai-provider";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { huggingFaceAI } from "@/lib/huggingface";
import { jsonError, serverError } from "@/lib/http";
import { RateLimitUnavailable } from "@/lib/rate-limit";
import { BLOG_CONTENT_MAX } from "@/lib/validation";

function unavailableMessage() {
  return "Writing assistant is unavailable. Set HUGGINGFACE_API_KEY (or HF_TOKEN) to enable it.";
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;
    if (!huggingFaceConfigured()) return jsonError(unavailableMessage(), 503);

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.slice(0, BLOG_CONTENT_MAX) : "";
    const title = typeof body?.title === "string" ? body.title.slice(0, 200) : "";
    if (!content) return jsonError("Content is required", 400);

    const [tags, seo, summary, sentiment] = await Promise.all([
      huggingFaceAI.generateTags(content),
      huggingFaceAI.generateSEOMetadata(title, content),
      huggingFaceAI.generateBlogSummary(content),
      huggingFaceAI.analyzeSentiment(content),
    ]);

    return NextResponse.json({
      analysis: {
        tags,
        seo,
        summary,
        sentiment,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        readingTime: Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)),
      },
    });
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    const mapped = mapHuggingFaceHttpError(error);
    if (mapped) return jsonError(mapped.message, mapped.status);
    return serverError("Content analysis failed:", error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;
    if (!huggingFaceConfigured()) return jsonError(unavailableMessage(), 503);

    const body = await request.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.slice(0, 8000) : "";
    if (!text) return jsonError("Text is required", 400);

    const improved = await huggingFaceAI.improveWriting(text);
    if (!improved) return jsonError("Writing assistant returned an empty suggestion", 502);
    return NextResponse.json({ original: text, improved });
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    const mapped = mapHuggingFaceHttpError(error);
    if (mapped) return jsonError(mapped.message, mapped.status);
    return serverError("Writing improvement failed:", error);
  }
}
