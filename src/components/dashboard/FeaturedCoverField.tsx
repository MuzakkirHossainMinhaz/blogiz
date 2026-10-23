"use client";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { fieldErrorClassName, fieldLabelClassName } from "@/lib/field-styles";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useRef, useState } from "react";
import { FiImage, FiLoader, FiTrash2, FiUpload, FiZap } from "react-icons/fi";

type FeaturedCoverFieldProps = {
  value: string;
  title: string;
  description?: string;
  content?: string;
  onChange: (url: string) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
};

function mapGenerateError(status: number, payload?: { error?: unknown; message?: unknown }): string {
  const message =
    typeof payload?.error === "string"
      ? payload.error
      : typeof payload?.message === "string"
        ? payload.message
        : undefined;

  if (status === 403) return message || "Verify your email before generating covers.";
  if (status === 429) return message || "Too many AI requests. Try again in a minute.";
  if (status === 503) return message || "Image generation is not configured yet.";
  if (status === 502) {
    return message || "Cover generation failed. Check Gemini and Cloudinary settings and try again.";
  }
  return message || "Failed to generate cover.";
}

export function FeaturedCoverField({
  value,
  title,
  description = "",
  content = "",
  onChange,
  error,
  disabled = false,
  className,
}: FeaturedCoverFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [busy, setBusy] = useState<"upload" | "generate" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const canGenerate = title.trim().length >= 3;
  const displayError = error || localError;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Image size must be less than 5MB");
      return;
    }

    setBusy("upload");
    setLocalError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "covers");

    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLocalError(result.error || "Failed to upload image");
        return;
      }
      onChange(result.url);
    } catch {
      setLocalError("Failed to upload image");
    } finally {
      setBusy(null);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate || busy) return;

    setBusy("generate");
    setLocalError(null);

    const body: {
      title: string;
      description?: string;
      content?: string;
      prompt?: string;
    } = {
      title: title.trim().slice(0, 200),
    };
    const desc = description.trim();
    if (desc) body.description = desc.slice(0, 500);
    const excerpt = content.trim();
    if (excerpt) body.content = excerpt.slice(0, 2000);
    const direction = customPrompt.trim();
    if (direction.length >= 3) body.prompt = direction.slice(0, 500);

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setLocalError(mapGenerateError(response.status, result));
        return;
      }
      if (!result.url) {
        setLocalError("Failed to generate cover");
        return;
      }
      onChange(result.url);
    } catch {
      setLocalError("Failed to generate cover");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3 h-full min-h-0", className)}>
      <div className="flex items-center justify-between gap-2 shrink-0">
        <label className={cn(fieldLabelClassName, "mb-0")}>Featured cover</label>
        {value ? (
          <button
            type="button"
            disabled={disabled || Boolean(busy)}
            onClick={() => {
              onChange("");
              setLocalError(null);
            }}
            className="inline-flex items-center gap-1.5 text-sm text-accent-500 hover:text-red-600 disabled:opacity-50 min-h-9"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-neutral-50 shrink-0",
          displayError ? "border-red-300" : "border-neutral-200",
          "aspect-16/10 flex items-center justify-center"
        )}
      >
        {value ? (
          <Image
            src={value}
            alt={title || "Featured cover"}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 360px"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-accent-400">
            <FiImage className="w-8 h-8" />
            <p className="text-sm">Upload or generate a cover</p>
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <FiLoader className="w-4 h-4 animate-spin" />
              {busy === "generate" ? "Crafting Prompt…" : "Uploading…"}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || Boolean(busy)}
          onClick={() => fileRef.current?.click()}
          className="w-full"
        >
          <FiUpload className="w-4 h-4" />
          Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || Boolean(busy) || !canGenerate}
          onClick={() => void handleGenerate()}
          className="w-full"
        >
          <FiZap className="w-4 h-4" />
          Generate
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => void handleUpload(event)}
      />

      <Textarea
        id="cover-prompt"
        label="Creative Direction (Optional)"
        rows={6}
        placeholder={
          title.trim()
            ? `Gemini uses your title${description.trim() ? ", description" : ""}${content.trim() ? ", and content" : ""}. Add style or mood notes here…`
            : "Add a title first, then optional style or mood notes"
        }
        value={customPrompt}
        onChange={(event) => setCustomPrompt(event.target.value)}
        disabled={disabled || Boolean(busy)}
        className="flex-1 flex flex-col min-h-0 [&>textarea]:flex-1 [&>textarea]:min-h-36 [&>textarea]:resize-y"
      />

      {displayError ? <p className={fieldErrorClassName}>{displayError}</p> : null}
      <p className="text-xs text-accent-400 shrink-0">
        JPEG, PNG, or WebP up to 5MB. Generate: Gemini crafts the image prompt, Pollinations draws it, Cloudinary stores it. One AI rate-limit hit per click.
      </p>
    </div>
  );
}
