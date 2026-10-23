import { afterEach, describe, expect, it } from "vitest";
import {
  geminiConfigured,
  imageGenerationConfigured,
  imageUnavailableMessage,
  mapAiHttpError,
  textAiConfigured,
  textAiUnavailableMessage,
} from "@/lib/ai-provider";
import {
  COVER_IMAGE_PROMPT_MAX,
  COVER_IMAGE_PROMPT_SYSTEM,
  GeminiError,
  buildCoverImagePromptUserMessage,
  clampCoverImagePrompt,
} from "@/lib/gemini";
import { PollinationsError, buildPollinationsImageUrl } from "@/lib/pollinations";
import {
  AI_RATE_LIMIT_MESSAGE,
  parseAiRateLimitConfig,
} from "@/lib/ai-rate-limit";

describe("ai provider config", () => {
  const keys = [
    "GEMINI_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "AI_RATE_LIMIT_MAX_REQUESTS",
    "AI_RATE_LIMIT_WINDOW_SECONDS",
  ] as const;

  const previous: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function snapshotEnv() {
    for (const key of keys) {
      previous[key] = process.env[key];
    }
  }

  it("requires GEMINI_API_KEY for text AI", () => {
    snapshotEnv();
    delete process.env.GEMINI_API_KEY;
    expect(geminiConfigured()).toBe(false);
    expect(textAiConfigured()).toBe(false);
    expect(textAiUnavailableMessage()).toMatch(/GEMINI_API_KEY/i);

    process.env.GEMINI_API_KEY = "test-key";
    expect(geminiConfigured()).toBe(true);
    expect(textAiConfigured()).toBe(true);
  });

  it("enables image generation only when Gemini and Cloudinary are configured", () => {
    snapshotEnv();
    delete process.env.GEMINI_API_KEY;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    expect(imageGenerationConfigured()).toBe(false);
    expect(imageUnavailableMessage()).toMatch(/GEMINI_API_KEY/i);

    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";
    expect(imageGenerationConfigured()).toBe(false);

    process.env.GEMINI_API_KEY = "gemini-test";
    expect(imageGenerationConfigured()).toBe(true);
  });

  it("maps GeminiError and PollinationsError statuses to client-safe responses", () => {
    expect(mapAiHttpError(new GeminiError("bad key", 401))).toEqual({
      message: "bad key",
      status: 502,
    });
    expect(mapAiHttpError(new GeminiError("warming up", 503))).toEqual({
      message: "warming up",
      status: 503,
    });
    expect(mapAiHttpError(new PollinationsError("slow down", 429))).toEqual({
      message: "slow down",
      status: 429,
    });
    expect(mapAiHttpError(new Error("unrelated"))).toBeNull();
  });
});

describe("AI rate limit config", () => {
  const keys = ["AI_RATE_LIMIT_MAX_REQUESTS", "AI_RATE_LIMIT_WINDOW_SECONDS"] as const;
  const previous: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function snapshotEnv() {
    for (const key of keys) {
      previous[key] = process.env[key];
    }
  }

  it("defaults to 3 requests per 60 seconds", () => {
    snapshotEnv();
    delete process.env.AI_RATE_LIMIT_MAX_REQUESTS;
    delete process.env.AI_RATE_LIMIT_WINDOW_SECONDS;
    expect(parseAiRateLimitConfig()).toEqual({
      maxRequests: 3,
      windowSeconds: 60,
      windowMs: 60_000,
    });
    expect(AI_RATE_LIMIT_MESSAGE).toMatch(/Try again in a minute/i);
  });

  it("parses valid overrides", () => {
    snapshotEnv();
    process.env.AI_RATE_LIMIT_MAX_REQUESTS = "5";
    process.env.AI_RATE_LIMIT_WINDOW_SECONDS = "120";
    expect(parseAiRateLimitConfig()).toEqual({
      maxRequests: 5,
      windowSeconds: 120,
      windowMs: 120_000,
    });
  });

  it("rejects invalid values as misconfiguration", () => {
    snapshotEnv();
    process.env.AI_RATE_LIMIT_MAX_REQUESTS = "0";
    expect(parseAiRateLimitConfig()).toBeNull();

    process.env.AI_RATE_LIMIT_MAX_REQUESTS = "3";
    process.env.AI_RATE_LIMIT_WINDOW_SECONDS = "-1";
    expect(parseAiRateLimitConfig()).toBeNull();

    process.env.AI_RATE_LIMIT_WINDOW_SECONDS = "abc";
    expect(parseAiRateLimitConfig()).toBeNull();
  });
});

describe("Gemini cover prompt craft helpers", () => {
  it("builds a contextual user message and treats custom prompt as creative direction", () => {
    const message = buildCoverImagePromptUserMessage({
      title: "Shipping Faster",
      description: "A post about CI",
      content: "We cut deploy time in half.",
      direction: "neon cyberpunk",
    });
    expect(message).toContain("Title: Shipping Faster");
    expect(message).toContain("Description: A post about CI");
    expect(message).toContain("Content excerpt: We cut deploy time in half.");
    expect(message).toMatch(/Creative direction from the author/i);
    expect(message).toContain("neon cyberpunk");
    expect(COVER_IMAGE_PROMPT_SYSTEM).toMatch(/1200×630|1200x630/i);
    expect(COVER_IMAGE_PROMPT_SYSTEM).toMatch(/no text|logos|watermarks/i);
  });

  it("clamps crafted prompts for Pollinations URLs", () => {
    const long = `${"vivid ".repeat(200)}scene`;
    const clamped = clampCoverImagePrompt(`"${long}"`);
    expect(clamped.length).toBeLessThanOrEqual(COVER_IMAGE_PROMPT_MAX);
    expect(clamped.startsWith('"')).toBe(false);
  });
});

describe("pollinations helpers", () => {
  it("builds a Pollinations URL from a crafted prompt string only", () => {
    const crafted =
      "Wide cinematic blog thumbnail of a harbor at golden hour, soft fog, teal and amber lighting, no text or logos";
    const url = buildPollinationsImageUrl(crafted);
    expect(url.startsWith("https://pollinations.ai/p/")).toBe(true);
    expect(url).toContain(encodeURIComponent(crafted));
    expect(url).toMatch(/width=1200/);
    expect(url).toMatch(/height=630/);
    expect(url).toMatch(/seed=\d+/);
    // Must not be a thin raw-title composition
    expect(decodeURIComponent(url)).not.toMatch(/Blog cover about "/);
  });

  it("rejects empty prompts", () => {
    expect(() => buildPollinationsImageUrl("   ")).toThrow(PollinationsError);
  });
});
