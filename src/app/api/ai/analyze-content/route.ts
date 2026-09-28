import { NextRequest, NextResponse } from "next/server";
import { huggingFaceConfigured } from "@/lib/ai-provider";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { huggingFaceAI } from "@/lib/huggingface";
import { jsonError, serverError } from "@/lib/http";
import { BLOG_CONTENT_MAX } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;
    if (!huggingFaceConfigured()) return jsonError("Writing assistant is unavailable", 503);

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
    return serverError("Content analysis failed:", error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;
    if (!huggingFaceConfigured()) return jsonError("Writing assistant is unavailable", 503);

    const body = await request.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.slice(0, 8000) : "";
    if (!text) return jsonError("Text is required", 400);

    const improved = await huggingFaceAI.improveWriting(text);
    if (!improved || improved === text) return jsonError("Writing assistant is unavailable", 502);
    return NextResponse.json({ original: text, improved });
  } catch (error) {
    return serverError("Writing improvement failed:", error);
  }
}
