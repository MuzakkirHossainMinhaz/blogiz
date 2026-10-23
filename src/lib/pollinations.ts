/**
 * Pollinations.ai image helper.
 * Builds a public generation URL (no API key), then fetches image bytes for Cloudinary upload.
 * Callers must pass a Gemini-crafted final prompt — never a raw title.
 */

export class PollinationsError extends Error {
  readonly status: number;

  constructor(message: string, status: number = 502) {
    super(message);
    this.name = "PollinationsError";
    this.status = status;
  }
}

/**
 * Pollinations image URL from a final crafted prompt string.
 * Format: https://pollinations.ai/p/{prompt}?width=1200&height=630&seed=…
 */
export function buildPollinationsImageUrl(prompt: string): string {
  const crafted = prompt.trim();
  if (!crafted) {
    throw new PollinationsError("Image prompt is required", 400);
  }

  const seed = Math.floor(Math.random() * 1_000_000_000);
  const encoded = encodeURIComponent(crafted);
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
