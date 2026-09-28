export function huggingFaceConfigured(): boolean {
  return Boolean(process.env.HUGGINGFACE_API_KEY?.trim());
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
