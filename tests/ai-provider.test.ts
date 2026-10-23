import { afterEach, describe, expect, it } from "vitest";
import {
  huggingFaceConfigured,
  imageDailyQuota,
  imageGenerationConfigured,
  imageUnavailableMessage,
  mapAiHttpError,
  mapHuggingFaceHttpError,
  resolveAiProvider,
  textAiConfigured,
  textAiUnavailableMessage,
} from "@/lib/ai-provider";
import { HuggingFaceError } from "@/lib/huggingface";
import { OllamaError } from "@/lib/ollama";

describe("ai provider config", () => {
  const keys = [
    "AI_PROVIDER",
    "HUGGINGFACE_API_KEY",
    "HF_TOKEN",
    "HF_IMAGE_DAILY_QUOTA",
    "OLLAMA_BASE_URL",
    "OLLAMA_TEXT_MODEL",
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

  it("defaults to ollama and treats text AI as configured without a cloud key", () => {
    snapshotEnv();
    delete process.env.AI_PROVIDER;
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.HF_TOKEN;
    expect(resolveAiProvider()).toBe("ollama");
    expect(textAiConfigured()).toBe(true);
    expect(imageGenerationConfigured()).toBe(false);
    expect(imageUnavailableMessage()).toMatch(/Ollama/i);
  });

  it("can turn AI off explicitly", () => {
    snapshotEnv();
    process.env.AI_PROVIDER = "off";
    expect(resolveAiProvider()).toBe("off");
    expect(textAiConfigured()).toBe(false);
    expect(textAiUnavailableMessage()).toMatch(/turned off/i);
  });

  it("requires a Hugging Face key when AI_PROVIDER=huggingface", () => {
    snapshotEnv();
    process.env.AI_PROVIDER = "huggingface";
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.HF_TOKEN;
    expect(textAiConfigured()).toBe(false);

    process.env.HF_TOKEN = "hf_test_token";
    expect(huggingFaceConfigured()).toBe(true);
    expect(textAiConfigured()).toBe(true);
  });

  it("enables image generation only for huggingface with a positive quota", () => {
    snapshotEnv();
    process.env.AI_PROVIDER = "huggingface";
    process.env.HUGGINGFACE_API_KEY = "hf_test";
    delete process.env.HF_IMAGE_DAILY_QUOTA;
    expect(imageDailyQuota()).toBeNull();
    expect(imageGenerationConfigured()).toBe(false);

    process.env.HF_IMAGE_DAILY_QUOTA = "0";
    expect(imageDailyQuota()).toBeNull();

    process.env.HF_IMAGE_DAILY_QUOTA = "3";
    expect(imageDailyQuota()).toBe(3);
    expect(imageGenerationConfigured()).toBe(true);
  });

  it("maps HuggingFaceError and OllamaError statuses to client-safe responses", () => {
    expect(mapAiHttpError(new HuggingFaceError("bad key", 401))).toEqual({
      message: "bad key",
      status: 502,
    });
    expect(mapAiHttpError(new OllamaError("Cannot reach Ollama", 503))).toEqual({
      message: "Cannot reach Ollama",
      status: 503,
    });
    expect(mapHuggingFaceHttpError(new HuggingFaceError("slow down", 429))).toEqual({
      message: "slow down",
      status: 429,
    });
    expect(mapAiHttpError(new Error("unrelated"))).toBeNull();
  });
});
