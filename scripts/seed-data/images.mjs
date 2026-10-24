/**
 * Seed image helpers. Blog/banner URLs must match isStoredImageUrl for API writes.
 * AI covers use Pollinations HTTPS URLs seeded by the MongoDB blog `_id`.
 */

/**
 * Stable Pollinations cover URL for a seeded post.
 * Format: https://pollinations.ai/p/{prompt}?width=1200&height=630&seed={blogId}
 */
export function seedPollinationsUrl(prompt, blogId) {
  const crafted = String(prompt || "editorial blog cover").trim() || "editorial blog cover";
  const seed = String(blogId || "").trim();
  if (!seed) {
    throw new Error("seedPollinationsUrl requires a blogId seed");
  }
  return `https://pollinations.ai/p/${encodeURIComponent(crafted)}?width=1200&height=630&seed=${encodeURIComponent(seed)}`;
}
