import { afterEach, describe, expect, it } from "vitest";
import { huggingFaceConfigured, imageDailyQuota, mapHuggingFaceHttpError } from "@/lib/ai-provider";
import { HuggingFaceError } from "@/lib/huggingface";

describe("ai provider config", () => {
  const previous = {
    HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
    HF_TOKEN: process.env.HF_TOKEN,
    HF_IMAGE_DAILY_QUOTA: process.env.HF_IMAGE_DAILY_QUOTA,
  };

  afterEach(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("treats HF_TOKEN as an alias for the Hugging Face key", () => {
    delete process.env.HUGGINGFACE_API_KEY;
    delete process.env.HF_TOKEN;
    expect(huggingFaceConfigured()).toBe(false);

    process.env.HF_TOKEN = "hf_test_token";
    expect(huggingFaceConfigured()).toBe(true);
  });

  it("requires a positive integer quota before image generation is enabled", () => {
    process.env.HUGGINGFACE_API_KEY = "hf_test";
    delete process.env.HF_IMAGE_DAILY_QUOTA;
    expect(imageDailyQuota()).toBeNull();

    process.env.HF_IMAGE_DAILY_QUOTA = "0";
    expect(imageDailyQuota()).toBeNull();

    process.env.HF_IMAGE_DAILY_QUOTA = "3";
    expect(imageDailyQuota()).toBe(3);
  });

  it("maps HuggingFaceError statuses to client-safe responses", () => {
    expect(mapHuggingFaceHttpError(new HuggingFaceError("bad key", 401))).toEqual({
      message: "bad key",
      status: 502,
    });
    expect(mapHuggingFaceHttpError(new HuggingFaceError("slow down", 429))).toEqual({
      message: "slow down",
      status: 429,
    });
    expect(mapHuggingFaceHttpError(new HuggingFaceError("warming", 503))).toEqual({
      message: "warming",
      status: 503,
    });
    expect(mapHuggingFaceHttpError(new Error("unrelated"))).toBeNull();
  });
});
