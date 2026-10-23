/**
 * Pollinations.ai image helper.
 * Builds a public generation URL (no API key), then fetches image bytes for Cloudinary upload.
 */

export class PollinationsError extends Error {
  readonly status: number;

  constructor(message: string, status: number = 502) {
    super(message);
    this.name = "PollinationsError";
    this.status = status;
  }
}

export type PollinationsImageInput = {
  title?: string;
  summary?: string;
  prompt?: string;
};

/** Compose a cover prompt from explicit prompt and/or title/summary. */
export function composeCoverPrompt(input: PollinationsImageInput): string {
  const explicit = input.prompt?.trim();
  if (explicit) return explicit.slice(0, 500);

  const title = input.title?.trim() || "";
  const summary = input.summary?.trim() || "";
  if (!title && !summary) return "";

  const parts = [
    title ? `Blog cover about "${title}"` : "Professional blog cover",
    summary ? summary.slice(0, 200) : "",
    "modern, clean design, high quality, no text overlay",
  ].filter(Boolean);

  return parts.join(". ").slice(0, 500);
}

/**
 * Pollinations image URL.
 * Format locked by migration plan: https://pollinations.ai/p/{prompt}?width=1200&height=630&seed=…
 */
export function buildPollinationsImageUrl(input: PollinationsImageInput): string {
  const prompt = composeCoverPrompt(input);
  if (!prompt) {
    throw new PollinationsError("Prompt or title is required", 400);
  }

  const seed = Math.floor(Math.random() * 1_000_000_000);
  const encoded = encodeURIComponent(prompt);
  return `https://pollinations.ai/p/${encoded}?width=1200&height=630&seed=${seed}`;
}

/** Fetch generated image bytes from a Pollinations URL. */
export async function fetchPollinationsImage(url: string): Promise<Buffer> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "image/*" },
      redirect: "follow",
    });
  } catch {
    throw new PollinationsError("Could not reach Pollinations image service", 503);
  }

  if (!response.ok) {
    throw new PollinationsError(
      `Pollinations image request failed (${response.status})`,
      response.status === 429 ? 429 : 502
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html") || contentType.includes("application/json")) {
    throw new PollinationsError("Pollinations returned a non-image response", 502);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32) {
    throw new PollinationsError("Pollinations returned empty image data", 502);
  }
  return bytes;
}
