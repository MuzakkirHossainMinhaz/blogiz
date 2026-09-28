const STORED_MEDIA_PATH = /^\/api\/media\/[a-f0-9]{24}$/i;

/**
 * Same-site relative path, or an explicit http(s) URL.
 * Rejects protocol-relative, javascript:, data:, and credentialed URLs.
 */
export function isSafeNavigationUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\") && !trimmed.includes("\\")) {
    return !trimmed.includes("://");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }

  if (url.username || url.password) return false;
  return url.protocol === "http:" || url.protocol === "https:";
}

/** Profile and social links: https only. */
export function isHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return false;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return false;
  }
  return url.protocol === "https:" && !url.username && !url.password && url.hostname.length > 0;
}

export function isStoredImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (STORED_MEDIA_PATH.test(trimmed)) return true;

  const base = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!base || !trimmed.startsWith(`${base.replace(/\/$/, "")}/`)) return false;

  try {
    const url = new URL(trimmed);
    const baseUrl = new URL(base);
    return url.protocol === "https:" && url.host === baseUrl.host && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Post-login redirect. Only a same-site path is accepted. */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || value.includes("://") || /[\r\n]/.test(value)) return fallback;
  return value;
}
