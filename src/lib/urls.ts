const LOCAL_MEDIA_RE =
  /^\/api\/media\/(avatars|banners|covers|general)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

const POLLINATIONS_HOSTS = new Set(["pollinations.ai", "image.pollinations.ai", "gen.pollinations.ai"]);

/** Same-origin local upload served by `/api/media/...`. */
export function isLocalMediaUrl(value: string): boolean {
  return LOCAL_MEDIA_RE.test(value.trim());
}

/**
 * Relative path under the upload root for a local media URL (`kind/filename`),
 * or null when the value is not a local media path.
 */
export function localMediaRelativePath(value: string): string | null {
  const trimmed = value.trim();
  if (!isLocalMediaUrl(trimmed)) return null;
  return trimmed.replace(/^\/api\/media\//, "");
}

/** HTTPS Pollinations generation or CDN delivery URL. */
export function isPollinationsImageUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password) return false;
  if (!POLLINATIONS_HOSTS.has(url.hostname)) return false;
  if (url.hostname === "pollinations.ai") {
    return url.pathname.startsWith("/p/") && url.pathname.length > 3;
  }
  return url.pathname.length > 1;
}

/**
 * Image URL this app may store and render: local `/api/media/...` uploads
 * or Pollinations HTTPS cover URLs.
 */
export function isStoredImageUrl(value: string): boolean {
  return isLocalMediaUrl(value) || isPollinationsImageUrl(value);
}

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

/** Post-login redirect. Only a same-site path is accepted. */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\") || value.includes("://") || /[\r\n]/.test(value)) return fallback;
  return value;
}
