/**
 * Pollinations.ai image helper.
 * Builds a public generation URL (no API key) stored directly on the blog document.
 * Callers must pass a Gemini-crafted final prompt — never a raw title.
 * Always seed with the MongoDB blog `_id` so the cover stays stable per post.
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
 * Pollinations image URL from a crafted prompt + blog document id seed.
 * Format: https://pollinations.ai/p/{prompt}?width=1200&height=630&seed={blogId}
 */
export function buildPollinationsImageUrl(prompt: string, blogId: string): string {
  const crafted = prompt.trim();
  if (!crafted) {
    throw new PollinationsError("Image prompt is required", 400);
  }

  const seed = blogId.trim();
  if (!seed) {
    throw new PollinationsError("blogId is required for a stable Pollinations seed", 400);
  }

  const encoded = encodeURIComponent(crafted);
  return `https://pollinations.ai/p/${encoded}?width=1200&height=630&seed=${encodeURIComponent(seed)}`;
}
