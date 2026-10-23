import { geminiAI, GeminiError, geminiConfigured } from "@/lib/gemini";
import { PollinationsError } from "@/lib/pollinations";

export { geminiConfigured };

/** True when text polish / analysis can call Gemini. */
export function textAiConfigured(): boolean {
  return geminiConfigured();
}

export function textAiUnavailableMessage(): string {
  return "Writing assistant is unavailable. Set GEMINI_API_KEY from Google AI Studio (https://aistudio.google.com/apikey).";
}

function cloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

/**
 * Cover AI: Gemini crafts the image prompt, Pollinations generates (no key), Cloudinary stores.
 * Requires GEMINI_API_KEY and Cloudinary.
 */
export function imageGenerationConfigured(): boolean {
  return geminiConfigured() && cloudinaryConfigured();
}

export function imageUnavailableMessage(): string {
  if (!geminiConfigured()) {
    return "Cover generation needs GEMINI_API_KEY (Google AI Studio) to craft the image prompt, plus Cloudinary to store the result—or upload a cover.";
  }
  return "Cover generation needs Cloudinary. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET, or upload a cover.";
}

type TextAiClient = {
  improveWriting(text: string, field?: "title" | "content"): Promise<string>;
  generateTags(content: string): Promise<string[]>;
  generateSEOMetadata(
    title: string,
    content: string
  ): Promise<{ metaDescription: string; keywords: string[] }>;
  generateBlogSummary(content: string): Promise<string>;
  analyzeSentiment(text: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
  }>;
};

/** Active text AI client (Gemini). */
export function getAiClient(): TextAiClient {
  return geminiAI;
}

/**
 * Map provider failures to a client-safe message + HTTP status.
 * Keeps Redis / config errors specific instead of a generic 500.
 */
export function mapAiHttpError(error: unknown): { message: string; status: number } | null {
  if (!error || typeof error !== "object") return null;
  const name = (error as { name?: unknown }).name;
  const message = (error as { message?: unknown }).message;
  const status = (error as { status?: unknown }).status;

  const isProviderError =
    error instanceof GeminiError ||
    error instanceof PollinationsError ||
    name === "GeminiError" ||
    name === "PollinationsError";
  if (!isProviderError || typeof message !== "string") {
    return null;
  }

  const code = Number.isInteger(status) ? (status as number) : 502;
  if (code === 401 || code === 403) return { message, status: 502 };
  if (code === 429) return { message, status: 429 };
  if (code === 503 || code === 529) return { message, status: 503 };
  if (code >= 400 && code < 600) return { message, status: code === 500 ? 502 : code };
  return { message, status: 502 };
}
