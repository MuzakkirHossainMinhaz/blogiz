/**
 * Local Ollama client for free, offline writing assistance.
 * Uses the OpenAI-compatible chat endpoint Ollama exposes at /v1/chat/completions.
 */

export class OllamaError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "OllamaError";
    this.status = status;
    this.code = code;
  }
}

function baseUrl(): string {
  const raw = process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
  return raw.replace(/\/+$/, "");
}

function textModel(): string {
  return process.env.OLLAMA_TEXT_MODEL?.trim() || "llama3.2";
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

function connectionError(url: string, cause: unknown): OllamaError {
  const detail =
    cause instanceof Error && cause.message
      ? cause.message
      : "connection failed";
  return new OllamaError(
    `Cannot reach Ollama at ${url}. Is Ollama running? Check OLLAMA_BASE_URL (got: ${detail}).`,
    503,
    "unreachable"
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { error?: unknown; message?: unknown }
      | null;
    if (!data) return `Ollama request failed (${response.status})`;
    const raw = data.error ?? data.message;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    return `Ollama request failed (${response.status})`;
  }
  const text = await response.text().catch(() => "");
  if (text.trim()) return text.trim().slice(0, 280);
  return `Ollama request failed (${response.status})`;
}

function mapModelMissing(detail: string, model: string): string {
  const lower = detail.toLowerCase();
  if (
    lower.includes("not found") ||
    lower.includes("does not exist") ||
    lower.includes("try pulling") ||
    lower.includes("pull the model") ||
    responseLooksLikeMissingModel(lower)
  ) {
    return `Ollama model "${model}" is not installed. Run: ollama pull ${model}`;
  }
  return detail;
}

function responseLooksLikeMissingModel(lower: string): boolean {
  return lower.includes("model") && (lower.includes("not found") || lower.includes("404"));
}

class OllamaAI {
  private root(): string {
    return baseUrl();
  }

  private async chatCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const root = this.root();
    const model = textModel();
    const url = `${root}/v1/chat/completions`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: options?.maxTokens ?? 1024,
          temperature: options?.temperature ?? 0.4,
          stream: false,
        }),
      });
    } catch (error) {
      throw connectionError(root, error);
    }

    if (!response.ok) {
      const detail = await readErrorMessage(response);
      const mapped = mapModelMissing(detail, model);
      const status = response.status === 404 ? 404 : response.status >= 500 ? 503 : 502;
      throw new OllamaError(mapped, status === 404 ? 502 : status);
    }

    const data = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string | null }; text?: string }>;
      error?: unknown;
    } | null;

    if (!data) {
      throw new OllamaError("Ollama returned an unexpected response", 502);
    }

    if (typeof data.error === "string" && data.error.trim()) {
      throw new OllamaError(mapModelMissing(data.error.trim(), model), 502);
    }

    const content =
      data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? "";
    if (typeof content !== "string" || !content.trim()) {
      throw new OllamaError("Writing assistant returned an empty response", 502);
    }
    return stripWrappingQuotes(content);
  }

  async improveWriting(text: string): Promise<string> {
    const improved = await this.chatCompletion(
      [
        {
          role: "system",
          content:
            "You polish blog writing. Preserve the author's voice, meaning, and language. Fix clarity, grammar, and flow. Return only the improved text with no quotes, labels, or commentary.",
        },
        { role: "user", content: text },
      ],
      {
        maxTokens: Math.min(Math.max(Math.ceil(text.length / 3) + 64, 128), 2048),
        temperature: 0.3,
      }
    );
    return improved || text;
  }

  async generateBlogSummary(content: string): Promise<string> {
    return this.chatCompletion(
      [
        {
          role: "system",
          content: "Summarize the blog post in 2-3 clear sentences. Return only the summary.",
        },
        { role: "user", content: content.slice(0, 4000) },
      ],
      { maxTokens: 180, temperature: 0.3 }
    );
  }

  async generateTags(content: string): Promise<string[]> {
    const text = await this.chatCompletion(
      [
        {
          role: "system",
          content:
            "Extract up to 5 short blog tags. Return a comma-separated list only, no hashtags.",
        },
        { role: "user", content: content.slice(0, 2000) },
      ],
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
  ): Promise<{
    metaDescription: string;
    keywords: string[];
  }> {
    const metaDescription = await this.chatCompletion(
      [
        {
          role: "system",
          content:
            "Write one SEO meta description under 160 characters. Return only the description.",
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent:\n${content.slice(0, 1500)}`,
        },
      ],
      { maxTokens: 120, temperature: 0.3 }
    );

    const keywordsText = await this.chatCompletion(
      [
        {
          role: "system",
          content: "Return exactly 5 SEO keywords as a comma-separated list.",
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent:\n${content.slice(0, 1500)}`,
        },
      ],
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
    const raw = await this.chatCompletion(
      [
        {
          role: "system",
          content:
            'Classify sentiment as exactly one of: positive, negative, or neutral. Reply with JSON only: {"sentiment":"...","score":0.0-1.0}',
        },
        { role: "user", content: text.slice(0, 1500) },
      ],
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
      const lower = raw.toLowerCase();
      const sentiment = lower.includes("positive")
        ? "positive"
        : lower.includes("negative")
          ? "negative"
          : "neutral";
      return { sentiment, score: 0.5 };
    }
  }

  /**
   * Ollama does not ship a clean free text-to-image path for Blogiz covers.
   * Callers should check image support via ai-provider before invoking this.
   */
  async generateImage(_prompt: string, _style?: string): Promise<string> {
    throw new OllamaError(
      "Cover AI generation is not available with local Ollama. Upload a cover instead, or switch AI_PROVIDER=huggingface with paid Inference Providers credits and HF_IMAGE_DAILY_QUOTA.",
      503,
      "image_unsupported"
    );
  }
}

export const ollamaAI = new OllamaAI();
export default ollamaAI;

export function ollamaBaseUrl(): string {
  return baseUrl();
}

export function ollamaTextModel(): string {
  return textModel();
}
