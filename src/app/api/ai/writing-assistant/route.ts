import { NextRequest, NextResponse } from "next/server";
import { huggingFaceConfigured } from "@/lib/ai-provider";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { huggingFaceAI } from "@/lib/huggingface";
import { jsonError, serverError } from "@/lib/http";

function unavailable() {
  return jsonError("Writing assistant is unavailable", 503);
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;
    if (!huggingFaceConfigured()) return unavailable();

    const body = await request.json().catch(() => null);
    const topic = typeof body?.topic === "string" ? body.topic.trim().slice(0, 300) : "";
    if (!topic) return jsonError("Topic is required", 400);

    const titles = await huggingFaceAI.generateBlogTitle(topic);
    if (!titles.length) return jsonError("Writing assistant is unavailable", 502);
    return NextResponse.json({ titles: titles.slice(0, 5) });
  } catch (error) {
    console.error("Title generation failed:", error);
    return jsonError("Writing assistant is unavailable", 502);
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;
    if (!huggingFaceConfigured()) return unavailable();

    const topic = new URL(request.url).searchParams.get("topic")?.trim().slice(0, 300) || "";
    if (!topic) return jsonError("Topic is required", 400);

    const outline = await huggingFaceAI.generateBlogOutline(topic);
    if (!outline.length) return jsonError("Writing assistant is unavailable", 502);
    return NextResponse.json({ outline });
  } catch (error) {
    return serverError("Outline generation failed:", error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;
    if (!huggingFaceConfigured()) return unavailable();

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === "string" ? body.content.slice(0, 8000) : "";
    if (!content) return jsonError("Content is required", 400);

    const continuation = await huggingFaceAI.continueWriting(content);
    if (!continuation) return jsonError("Writing assistant is unavailable", 502);
    return NextResponse.json({ continuation });
  } catch (error) {
    return serverError("Continue writing failed:", error);
  }
}
