import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeminiError, geminiAI } from "@/lib/gemini";

const generateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent };
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status = 500) {
      super(message);
      this.name = "ApiError";
      this.status = status;
    }
  },
}));

describe("craftCoverImagePrompt", () => {
  beforeEach(() => {
    generateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it("returns a clamped Gemini-crafted prompt and never echoes raw title alone", async () => {
    generateContent.mockResolvedValue({
      text: [
        '"Wide cinematic blog thumbnail of a bustling harbor at golden hour,',
        "soft fog rolling over teal water, warm amber rim light, shallow depth of field,",
        'no text, logos, or watermarks"',
      ].join(" "),
    });

    await expect(geminiAI.craftCoverImagePrompt({ title: "  " })).rejects.toBeInstanceOf(
      GeminiError
    );

    const crafted = await geminiAI.craftCoverImagePrompt({
      title: "Harbor Mornings",
      description: "Life by the docks",
      direction: "painterly watercolor",
    });

    expect(generateContent).toHaveBeenCalledTimes(1);
    const call = generateContent.mock.calls[0]?.[0] as {
      config?: { systemInstruction?: string };
      contents?: string;
    };
    expect(call.config?.systemInstruction).toMatch(/1200×630|subject|mood|lighting/i);
    expect(call.contents).toContain("Title: Harbor Mornings");
    expect(call.contents).toMatch(/Creative direction/i);
    expect(call.contents).toContain("painterly watercolor");
    expect(crafted.toLowerCase()).toMatch(/harbor|golden|fog|light/);
    expect(crafted).not.toBe("Harbor Mornings");
    expect(crafted.startsWith('"')).toBe(false);
  });
});
