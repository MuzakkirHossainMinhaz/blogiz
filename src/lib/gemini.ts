/**
 * Google Gemini (AI Studio) client for writing polish and content analysis.
 * Model: gemini-2.5-flash via the official @google/genai SDK.
 */

import { ApiError, GoogleGenAI } from "@google/genai";

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";

export class GeminiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.code = code;
  }
}

export function readGeminiApiKey(): string {
  return process.env.GEMINI_API_KEY?.trim() || "";
}

export function geminiConfigured(): boolean {
  return Boolean(readGeminiApiKey());
}

function stripWrappingQuotes(text: string): string {
  const trimmed = text.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  if (trimmed.startsWith("```")) {
    return trimmed
      .replace(/^```(?:\w+)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
  }
  return trimmed;
}

function mapApiError(error: unknown): never {
  if (error instanceof GeminiError) throw error;

  if (error instanceof ApiError) {
    const status = Number.isInteger(error.status) ? error.status : 502;
    const detail = typeof error.message === "string" ? error.message.trim() : "";
    if (status === 401 || status === 403) {
      throw new GeminiError(
        "Gemini credentials are invalid or missing. Check GEMINI_API_KEY in Google AI Studio.",
        status
      );
    }
    if (status === 429) {
      throw new GeminiError("Gemini rate limit reached. Try again shortly.", 429);
    }
    if (status === 503 || status === 529) {
      throw new GeminiError("Writing assistant is warming up. Try again in a moment.", status);
    }
    throw new GeminiError(
      detail || `Gemini request failed (${status})`,
      status >= 400 && status < 600 ? status : 502
    );
  }

  if (error instanceof Error && error.message.trim()) {
    throw new GeminiError(error.message.trim().slice(0, 280), 502);
  }
  throw new GeminiError("Gemini request failed", 502);
}

function requireClient(): GoogleGenAI {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    throw new GeminiError(
      "Writing assistant is unavailable. Set GEMINI_API_KEY from Google AI Studio.",
      503,
      "not_configured"
    );
  }
  return new GoogleGenAI({ apiKey });
}

/** Max length for Pollinations URL prompts after Gemini craft. */
export const COVER_IMAGE_PROMPT_MAX = 800;

export const COVER_IMAGE_PROMPT_SYSTEM = [
  "You write one vivid English image-generation prompt for a 1200×630 blog thumbnail.",
  "Include subject, composition, style, mood, and lighting.",
  "Do not include any text, logos, watermarks, or typography in the image.",
  "Return plain prompt text only—no quotes, labels, markdown, or commentary.",
].join(" ");

export type CraftCoverImagePromptInput = {
  title: string;
  description?: string;
  content?: string;
  /** Author creative direction — enrich; never use as the final Pollinations string as-is. */
  direction?: string;
};

/** Build the user message Gemini sees when crafting a cover image prompt. */
export function buildCoverImagePromptUserMessage(input: CraftCoverImagePromptInput): string {
  const title = input.title.trim();
  const lines = [`Title: ${title}`];
  const description = input.description?.trim();
  if (description) lines.push(`Description: ${description.slice(0, 500)}`);
  const content = input.content?.trim();
  if (content) lines.push(`Content excerpt: ${content.slice(0, 2000)}`);
  const direction = input.direction?.trim();
  if (direction) {
    lines.push(
      `Creative direction from the author (treat as guidance to enrich, not the final prompt): ${direction.slice(0, 500)}`
    );
  }
  return lines.join("\n");
}

export function clampCoverImagePrompt(text: string): string {
  const cleaned = stripWrappingQuotes(text).replace(/\s+/g, " ").trim();
  if (cleaned.length <= COVER_IMAGE_PROMPT_MAX) return cleaned;
  return cleaned.slice(0, COVER_IMAGE_PROMPT_MAX).trim();
}

async function generateText(
  system: string,
  user: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const ai = requireClient();
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        maxOutputTokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.4,
      },
    });
    const text = typeof response.text === "string" ? response.text : "";
    if (!text.trim()) {
      throw new GeminiError("Writing assistant returned an empty response", 502);
    }
    return stripWrappingQuotes(text);
  } catch (error) {
    mapApiError(error);
  }
}

class GeminiAI {
  /**
   * Voice-preserving polish for titles and body copy.
   * `field` tunes SEO/length guidance without changing the author’s meaning.
   */
  async improveWriting(text: string, field?: "title" | "content"): Promise<string> {
    const fieldHint =
      field === "title"
        ? " This is a blog title: keep it concise (ideally under ~70 characters), clear, and lightly SEO-friendly without clickbait."
        : field === "content"
          ? " This is blog body content (often Markdown): preserve structure, headings, and links; improve clarity and flow only."
          : "";

    const improved = await generateText(
      `You polish blog writing. Preserve the author's voice, meaning, and language. Fix clarity, grammar, and flow.${fieldHint} Return only the improved text with no quotes, labels, or commentary.`,
      text,
      {
        maxTokens: Math.min(Math.max(Math.ceil(text.length / 3) + 64, 128), 2048),
        temperature: 0.3,
      }
    );
    return improved || text;
  }

  async generateBlogSummary(content: string): Promise<string> {
    return generateText(
      "Summarize the blog post in 2-3 clear sentences. Return only the summary.",
      content.slice(0, 4000),
      { maxTokens: 180, temperature: 0.3 }
    );
  }

  async generateTags(content: string): Promise<string[]> {
    const text = await generateText(
      "Extract up to 5 short blog tags. Return a comma-separated list only, no hashtags.",
      content.slice(0, 2000),
      { maxTokens: 80, temperature: 0.2 }
    );
    return text
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .slice(0, 5);
  }

  async generateSEOMetadata(
    title: string,
    content: string
  ): Promise<{ metaDescription: string; keywords: string[] }> {
    const metaDescription = await generateText(
      "Write one SEO meta description under 160 characters. Return only the description.",
      `Title: ${title}\n\nContent:\n${content.slice(0, 1500)}`,
      { maxTokens: 120, temperature: 0.3 }
    );

    const keywordsText = await generateText(
      "Return exactly 5 SEO keywords as a comma-separated list.",
      `Title: ${title}\n\nContent:\n${content.slice(0, 1500)}`,
      { maxTokens: 80, temperature: 0.2 }
    );

    const keywords = keywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 5);

    return { metaDescription: metaDescription.slice(0, 160), keywords };
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
  }> {
    const raw = await generateText(
      'Classify sentiment as exactly one of: positive, negative, or neutral. Reply with JSON only: {"sentiment":"...","score":0.0-1.0}',
      text.slice(0, 1500),
      { maxTokens: 60, temperature: 0.1 }
    );

    try {
      const parsed = JSON.parse(raw) as { sentiment?: string; score?: number };
      const label = (parsed.sentiment || "neutral").toLowerCase();
      const sentiment =
        label === "positive" || label === "negative" || label === "neutral"
          ? label
          : "neutral";
      const score =
        typeof parsed.score === "number" && Number.isFinite(parsed.score)
          ? Math.min(1, Math.max(0, parsed.score))
          : 0.5;
      return { sentiment, score };
    } catch {
      return { sentiment: "neutral", score: 0.5 };
    }
  }

  /**
   * Craft a rich Pollinations image prompt from post context.
   * Custom `direction` is creative guidance only — never the final URL prompt.
   */
  async craftCoverImagePrompt(input: CraftCoverImagePromptInput): Promise<string> {
    const title = input.title?.trim() || "";
    if (!title) {
      throw new GeminiError("Title is required to craft a cover prompt", 400);
    }

    const crafted = await generateText(
      COVER_IMAGE_PROMPT_SYSTEM,
      buildCoverImagePromptUserMessage({ ...input, title }),
      { maxTokens: 320, temperature: 0.7 }
    );
    const clamped = clampCoverImagePrompt(crafted);
    if (!clamped) {
      throw new GeminiError("Cover prompt craft returned an empty suggestion", 502);
    }
    return clamped;
  }
}

export const geminiAI = new GeminiAI();
export default geminiAI;
