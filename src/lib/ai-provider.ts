import { huggingFaceAI } from "@/lib/huggingface";
import { ollamaAI } from "@/lib/ollama";

export type AiProviderName = "ollama" | "huggingface" | "off";

/**
 * Resolve the active AI backend.
 * Default for this practice project is local Ollama (free). Set AI_PROVIDER=huggingface
 * only when you intentionally want paid Inference Providers.
 */
export function resolveAiProvider(): AiProviderName {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (!raw || raw === "ollama") return "ollama";
  if (raw === "huggingface" || raw === "hf") return "huggingface";
  if (raw === "off" || raw === "none" || raw === "disabled") return "off";
  return "ollama";
}

export function huggingFaceConfigured(): boolean {
  return Boolean(
    process.env.HUGGINGFACE_API_KEY?.trim() || process.env.HF_TOKEN?.trim()
  );
}

/** True when text polish / analysis should attempt the configured provider. */
export function textAiConfigured(): boolean {
  const provider = resolveAiProvider();
  if (provider === "off") return false;
  if (provider === "ollama") return true;
  return huggingFaceConfigured();
}

export function textAiUnavailableMessage(): string {
  const provider = resolveAiProvider();
  if (provider === "off") {
    return "Writing assistant is turned off. Set AI_PROVIDER=ollama (recommended, free) or AI_PROVIDER=huggingface.";
  }
  if (provider === "huggingface") {
    return "Writing assistant is unavailable. Set HUGGINGFACE_API_KEY (or HF_TOKEN) to enable Hugging Face, or switch to AI_PROVIDER=ollama for free local AI.";
  }
  return "Writing assistant could not reach Ollama. Start Ollama, pull the model in OLLAMA_TEXT_MODEL, and check OLLAMA_BASE_URL.";
}

/** Image generation stays off until an operator sets a positive daily quota (HF only). */
export function imageDailyQuota(): number | null {
  if (!huggingFaceConfigured()) return null;
  const raw = process.env.HF_IMAGE_DAILY_QUOTA?.trim();
  if (!raw || !/^[0-9]+$/.test(raw)) return null;
  const quota = Number(raw);
  if (!Number.isSafeInteger(quota) || quota < 1) return null;
  return quota;
}

/**
 * Cover AI is only available via Hugging Face (paid Inference Providers).
 * Local Ollama has no clean free text-to-image path for Blogiz.
 */
export function imageGenerationConfigured(): boolean {
  return resolveAiProvider() === "huggingface" && imageDailyQuota() !== null;
}

export function imageUnavailableMessage(): string {
  if (resolveAiProvider() === "ollama") {
    return "Cover AI generation is not available with local Ollama. Upload a cover, or set AI_PROVIDER=huggingface with HUGGINGFACE_API_KEY and a positive HF_IMAGE_DAILY_QUOTA (paid credits).";
  }
  if (resolveAiProvider() === "off") {
    return "Image generation is turned off. Set AI_PROVIDER=huggingface with HUGGINGFACE_API_KEY and HF_IMAGE_DAILY_QUOTA, or upload a cover.";
  }
  return "Image generation is disabled until HUGGINGFACE_API_KEY and a positive HF_IMAGE_DAILY_QUOTA are set";
}

type TextAiClient = {
  improveWriting(text: string): Promise<string>;
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
  generateImage(prompt: string, style?: string): Promise<string>;
};

/** Active text/image AI client for the configured provider. */
export function getAiClient(): TextAiClient {
  const provider = resolveAiProvider();
  if (provider === "huggingface") return huggingFaceAI;
  return ollamaAI;
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

  if (
    (name !== "HuggingFaceError" && name !== "OllamaError") ||
    typeof message !== "string"
  ) {
    return null;
  }

  const code = Number.isInteger(status) ? (status as number) : 502;
  if (code === 401 || code === 403) return { message, status: 502 };
  if (code === 429) return { message, status: 429 };
  if (code === 503 || code === 529) return { message, status: 503 };
  if (code >= 400 && code < 600) return { message, status: code === 500 ? 502 : code };
  return { message, status: 502 };
}

/** @deprecated Prefer mapAiHttpError — kept for older call sites/tests. */
export function mapHuggingFaceHttpError(
  error: unknown
): { message: string; status: number } | null {
  return mapAiHttpError(error);
}
