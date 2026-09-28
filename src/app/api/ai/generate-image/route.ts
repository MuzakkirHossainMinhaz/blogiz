import { NextRequest, NextResponse } from "next/server";
import { imageDailyQuota } from "@/lib/ai-provider";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { huggingFaceAI } from "@/lib/huggingface";
import { jsonError, serverError } from "@/lib/http";
import { rateLimit, RateLimitUnavailable } from "@/lib/rate-limit";

async function generate(actorId: string, prompt: string) {
  const quota = imageDailyQuota();
  if (!quota) return jsonError("Image generation is disabled until a quota is configured", 503);

  const day = new Date().toISOString().slice(0, 10);
  const attempt = await rateLimit(`image:${actorId}:${day}`, quota, 24 * 60 * 60 * 1000);
  if (!attempt.ok) return jsonError("Too many requests", 429);

  const imageData = await huggingFaceAI.generateImage(prompt);
  if (!imageData) return jsonError("Failed to generate image", 502);
  const image = imageData.startsWith("data:image") ? imageData : `data:image/png;base64,${imageData}`;
  return NextResponse.json({ image, prompt });
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim().slice(0, 500) : "";
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
    const finalPrompt = prompt || (title ? `Blog cover: ${title}` : "");
    if (!finalPrompt) return jsonError("Prompt or title is required", 400);

    return await generate(actor.id, finalPrompt);
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    return serverError("Image generation failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireAiUser();
    if (denied(actor)) return actor;

    const title = new URL(request.url).searchParams.get("title")?.trim().slice(0, 200) || "";
    if (!title) return jsonError("Title is required", 400);
    return await generate(actor.id, `Blog cover: ${title}`);
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    return serverError("Blog cover generation failed:", error);
  }
}
