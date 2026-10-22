export function huggingFaceConfigured(): boolean {
  return Boolean(
    process.env.HUGGINGFACE_API_KEY?.trim() || process.env.HF_TOKEN?.trim()
  );
}

/** Image generation stays off until an operator sets a positive daily quota. */
export function imageDailyQuota(): number | null {
  if (!huggingFaceConfigured()) return null;
  const raw = process.env.HF_IMAGE_DAILY_QUOTA?.trim();
  if (!raw || !/^[0-9]+$/.test(raw)) return null;
  const quota = Number(raw);
  if (!Number.isSafeInteger(quota) || quota < 1) return null;
  return quota;
}

/**
 * Map provider failures to a client-safe message + HTTP status.
 * Keeps Redis / config errors specific instead of a generic 500.
 */
export function mapHuggingFaceHttpError(error: unknown): { message: string; status: number } | null {
  if (!error || typeof error !== "object") return null;
  const name = (error as { name?: unknown }).name;
  const message = (error as { message?: unknown }).message;
  const status = (error as { status?: unknown }).status;

  if (name !== "HuggingFaceError" || typeof message !== "string") return null;

  const code = Number.isInteger(status) ? (status as number) : 502;
  if (code === 401 || code === 403) return { message, status: 502 };
  if (code === 429) return { message, status: 429 };
  if (code === 503 || code === 529) return { message, status: 503 };
  if (code >= 400 && code < 600) return { message, status: code === 500 ? 502 : code };
  return { message, status: 502 };
}
