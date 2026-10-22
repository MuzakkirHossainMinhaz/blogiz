/**
 * Hugging Face Inference Providers client.
 * Text polish uses the OpenAI-compatible chat endpoint; classification /
 * token tasks and image generation use the hf-inference path.
 */

export class HuggingFaceError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "HuggingFaceError";
    this.status = status;
    this.code = code;
  }
}

export interface HuggingFaceResponse {
  generated_text?: string;
  [key: string]: unknown;
}

function readApiKey(): string {
  return (
    process.env.HUGGINGFACE_API_KEY?.trim() ||
    process.env.HF_TOKEN?.trim() ||
    ""
  );
}

function textModel(): string {
  return process.env.HF_TEXT_MODEL?.trim() || "Qwen/Qwen3-4B-Instruct-2507";
}

function imageModel(style: string): string {
  const override = process.env.HF_IMAGE_MODEL?.trim();
  if (override) return override;
  const models: Record<string, string> = {
    realistic: "black-forest-labs/FLUX.1-schnell",
    artistic: "stabilityai/stable-diffusion-xl-base-1.0",
    digital: "stabilityai/stable-diffusion-xl-base-1.0",
  };
  return models[style] || models.realistic;
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

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = (await response.json().catch(() => null)) as
      | { error?: unknown; message?: unknown; detail?: unknown }
      | null;
    if (!data) return `Hugging Face request failed (${response.status})`;
    const raw = data.error ?? data.message ?? data.detail;
    if (typeof raw === "string" && raw.trim()) return raw.trim();
    if (raw && typeof raw === "object" && "message" in raw) {
      const nested = (raw as { message?: unknown }).message;
      if (typeof nested === "string" && nested.trim()) return nested.trim();
    }
    return `Hugging Face request failed (${response.status})`;
  }

  const text = await response.text().catch(() => "");
  if (text.includes("<!DOCTYPE") || text.includes("<html")) {
    return `Hugging Face returned an unexpected response (${response.status}). Check HUGGINGFACE_API_KEY and model access.`;
  }
  if (text.trim()) return text.trim().slice(0, 280);
  return `Hugging Face request failed (${response.status})`;
}

function mapStatusMessage(status: number, detail: string): string {
  if (status === 401 || status === 403) {
    return "Hugging Face credentials are invalid or missing Inference Providers permission";
  }
  if (status === 404) {
    return detail || "Hugging Face model was not found";
  }
  if (status === 429) {
    return "Hugging Face rate limit reached. Try again shortly.";
  }
  if (status === 503 || status === 529) {
    return "Writing assistant is warming up. Try again in a moment.";
  }
  return detail || `Hugging Face request failed (${status})`;
}

class HuggingFaceAI {
  private inferenceBase = "https://router.huggingface.co/hf-inference/models";
  private chatUrl = "https://router.huggingface.co/v1/chat/completions";

  private apiKey(): string {
    return readApiKey();
  }

  private requireKey(): string {
    const key = this.apiKey();
    if (!key) {
      throw new HuggingFaceError("Hugging Face is not configured", 503, "not_configured");
    }
    return key;
  }

  private async makeRequest(model: string, payload: Record<string, unknown>): Promise<unknown> {
    const key = this.requireKey();
    const response = await fetch(`${this.inferenceBase}/${model}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const detail = await readErrorMessage(response);
      throw new HuggingFaceError(mapStatusMessage(response.status, detail), response.status);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new HuggingFaceError(
        `Hugging Face returned an unexpected response (${response.status}). Check HUGGINGFACE_API_KEY and model access.`,
        response.status || 502
      );
    }

    return response.json();
  }

  private async chatCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: { maxTokens?: number; temperature?: number }
  ): Promise<string> {
    const key = this.requireKey();
    const response = await fetch(this.chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: textModel(),
        messages,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.4,
      }),
    });

    if (!response.ok) {
      const detail = await readErrorMessage(response);
      throw new HuggingFaceError(mapStatusMessage(response.status, detail), response.status);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new HuggingFaceError(
        `Hugging Face returned an unexpected response (${response.status}). Check HUGGINGFACE_API_KEY and model access.`,
        response.status || 502
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null }; text?: string }>;
      error?: unknown;
    };

    const content =
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.text ??
      "";
    if (typeof content !== "string" || !content.trim()) {
      throw new HuggingFaceError("Writing assistant returned an empty response", 502);
    }
    return stripWrappingQuotes(content);
  }

  private generatedText(response: unknown): string {
    if (Array.isArray(response)) {
      const first = response[0] as { generated_text?: string } | string | undefined;
      if (typeof first === "string") return first;
      if (first && typeof first.generated_text === "string") return first.generated_text;
    }
    if (response && typeof response === "object" && "generated_text" in response) {
      const text = (response as { generated_text?: unknown }).generated_text;
      if (typeof text === "string") return text;
    }
    return "";
  }

  async generateText(prompt: string, maxLength: number = 100): Promise<string> {
    const response = await this.makeRequest("distilgpt2", {
      inputs: prompt,
      parameters: {
        max_new_tokens: Math.min(Math.max(maxLength, 16), 256),
        temperature: 0.7,
        do_sample: true,
        top_p: 0.9,
        return_full_text: false,
      },
    });
    return this.generatedText(response);
  }

  async generateBlogTitle(topic: string): Promise<string[]> {
    const text = await this.chatCompletion(
      [
        {
          role: "system",
          content:
            "You write catchy blog titles. Return exactly 5 titles, one per line, with no numbering or bullets.",
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
      { maxTokens: 200, temperature: 0.8 }
    );
    return text
      .split("\n")
      .map((line) => line.replace(/^\d+[.)]\s*/, "").replace(/^[-*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  async generateBlogOutline(topic: string): Promise<string[]> {
    const text = await this.chatCompletion(
      [
        {
          role: "system",
          content: "Create a concise blog outline as bullet lines starting with '- '.",
        },
        { role: "user", content: `Topic: ${topic}` },
      ],
      { maxTokens: 400, temperature: 0.5 }
    );
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-") || /^\d+\./.test(line));
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

  async continueWriting(content: string): Promise<string> {
    return this.chatCompletion(
      [
        {
          role: "system",
          content:
            "Continue the blog draft in the same voice. Return only the continuation, not the original text.",
        },
        { role: "user", content: content.slice(-4000) },
      ],
      { maxTokens: 220, temperature: 0.7 }
    );
  }

  /**
   * Voice-preserving polish for titles and body copy.
   * Uses Inference Providers chat completions (not raw GPT-2 completion).
   */
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

  async generateImage(prompt: string, style: string = "realistic"): Promise<string> {
    const key = this.requireKey();
    const selectedModel = imageModel(style);

    const response = await fetch(`${this.inferenceBase}/${selectedModel}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "image/png",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: `${prompt}, professional blog cover, high quality, detailed`,
        parameters: {
          guidance_scale: 7.5,
          num_inference_steps: 20,
        },
      }),
    });

    if (!response.ok) {
      const detail = await readErrorMessage(response);
      throw new HuggingFaceError(mapStatusMessage(response.status, detail), response.status);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (Array.isArray(data) && typeof data[0] === "string") return data[0];
      if (data && typeof data === "object" && typeof (data as { image?: unknown }).image === "string") {
        return (data as { image: string }).image;
      }
      throw new HuggingFaceError("Unexpected image generation response format", 502);
    }

    if (contentType.includes("text/html")) {
      throw new HuggingFaceError(
        `Hugging Face returned an unexpected response (${response.status}). Check HUGGINGFACE_API_KEY and model access.`,
        response.status || 502
      );
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 32) {
      throw new HuggingFaceError("Image generation returned empty data", 502);
    }
    return `data:image/png;base64,${bytes.toString("base64")}`;
  }

  async generateBlogCoverImage(title: string, category: string = "technology"): Promise<string> {
    const prompt = `Professional blog cover image about "${title}" in ${category} style, modern, clean design, high quality`;
    return this.generateImage(prompt, "realistic");
  }

  async analyzeSentiment(text: string): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
  }> {
    const response = await this.makeRequest("cardiffnlp/twitter-roberta-base-sentiment-latest", {
      inputs: text.slice(0, 1500),
    });

    const scores = Array.isArray(response) ? (response[0] as Array<{ label?: string; score?: number }>) : [];
    if (!Array.isArray(scores) || scores.length === 0) {
      throw new HuggingFaceError("Sentiment analysis returned an unexpected response", 502);
    }
    const maxScore = Math.max(...scores.map((s) => s.score ?? 0));
    const sentiment = scores.find((s) => s.score === maxScore)?.label || "neutral";

    return {
      sentiment: sentiment.toLowerCase() as "positive" | "negative" | "neutral",
      score: maxScore,
    };
  }

  async extractKeywords(text: string): Promise<string[]> {
    const response = await this.makeRequest("dslim/bert-base-NER", {
      inputs: text.slice(0, 1500),
    });

    const entities = Array.isArray(response)
      ? response.flatMap((item) => (Array.isArray(item) ? item : [item]))
      : [];
    const keywords = entities
      .filter((entity): entity is { score: number; word: string } => {
        return (
          Boolean(entity) &&
          typeof entity === "object" &&
          typeof (entity as { score?: unknown }).score === "number" &&
          (entity as { score: number }).score > 0.5 &&
          typeof (entity as { word?: unknown }).word === "string"
        );
      })
      .map((entity) => entity.word);

    return [...new Set(keywords)];
  }

  async classifyContent(text: string): Promise<string[]> {
    const response = await this.makeRequest("distilbert-base-uncased-finetuned-sst-2-english", {
      inputs: text.slice(0, 1500),
    });

    if (!Array.isArray(response)) return [];
    return response
      .map((item) => (item && typeof item === "object" ? (item as { label?: unknown }).label : null))
      .filter((label): label is string => typeof label === "string");
  }
}

export const huggingFaceAI = new HuggingFaceAI();
export default huggingFaceAI;
