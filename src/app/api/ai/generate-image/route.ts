import { NextRequest, NextResponse } from "next/server";
import {
  imageGenerationConfigured,
  imageUnavailableMessage,
  mapAiHttpError,
} from "@/lib/ai-provider";
import { denied } from "@/lib/authz";
import { requireAiUser } from "@/lib/ai-guard";
import { jsonError, serverError } from "@/lib/http";
import { saveImage } from "@/lib/object-storage";
import {
  buildPollinationsImageUrl,
  composeCoverPrompt,
  fetchPollinationsImage,
  PollinationsError,
} from "@/lib/pollinations";
import { RateLimitUnavailable } from "@/lib/rate-limit";
import { UploadError } from "@/lib/uploads";

async function generate(input: {
  prompt?: string;
  title?: string;
  summary?: string;
}) {
  if (!imageGenerationConfigured()) {
    return jsonError(imageUnavailableMessage(), 503);
  }

  const finalPrompt = composeCoverPrompt(input);
  if (!finalPrompt) return jsonError("Prompt or title is required", 400);

  try {
    const pollinationsUrl = buildPollinationsImageUrl({
      prompt: finalPrompt,
    });
    const bytes = await fetchPollinationsImage(pollinationsUrl);
    const stored = await saveImage(bytes, { kind: "covers" });
    return NextResponse.json({ url: stored.url, prompt: finalPrompt });
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 400);
    if (error instanceof PollinationsError) {
      return jsonError(error.message, error.status === 400 ? 400 : error.status === 429 ? 429 : error.status === 503 ? 503 : 502);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAiUser(request);
    if (denied(actor)) return actor;

    const body = await request.json().catch(() => null);
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim().slice(0, 500) : "";
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 200) : "";
    const summary =
      typeof body?.description === "string"
        ? body.description.trim().slice(0, 500)
        : typeof body?.summary === "string"
          ? body.summary.trim().slice(0, 500)
          : "";

    return await generate({ prompt: prompt || undefined, title: title || undefined, summary: summary || undefined });
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

    const title = new URL(request.url).searchParams.get("title")?.trim().slice(0, 200) || "";
    if (!title) return jsonError("Title is required", 400);
    return await generate({ title });
  } catch (error) {
    if (error instanceof RateLimitUnavailable) return jsonError(error.message, 503);
    const mapped = mapAiHttpError(error);
    if (mapped) return jsonError(mapped.message, mapped.status);
    return serverError("Blog cover generation failed:", error);
  }
}
