const CLOUD_NAME = /^[a-z0-9_-]+$/i;

export function configuredCloudName(): string {
  return process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
}

/**
 * HTTPS image delivered by Cloudinary. Does not check which cloud it belongs to.
 * Write paths use isStoredImageUrl, which requires this app's cloud name.
 */
export function isCloudinaryDeliveryUrl(value: string): boolean {
  return cloudinaryPublicId(value, "*") !== null;
}

/** This app's Cloudinary secure URL only. */
export function isStoredImageUrl(value: string, cloudName = configuredCloudName()): boolean {
  if (!cloudName || !CLOUD_NAME.test(cloudName)) return false;
  return cloudinaryPublicId(value, cloudName) !== null;
}

/**
 * Public id (folder + name, no extension) for a secure URL we issued.
 * Pass "*" to accept any Cloudinary cloud name.
 */
export function cloudinaryPublicId(value: string, cloudName = configuredCloudName()): string | null {
  const cloud = cloudName === "*" ? "[a-z0-9_-]+" : cloudName;
  if (!cloud || (cloudName !== "*" && !CLOUD_NAME.test(cloudName))) return null;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return null;
  if (url.username || url.password || url.search || url.hash) return null;

  const match = url.pathname.match(new RegExp(`^/${cloud}/image/upload/v\\d+/(.+)\\.(jpg|jpeg|png|webp)$`, "i"));
  const publicId = match?.[1];
  if (!publicId || publicId.includes("..") || publicId.includes("\\") || publicId.startsWith("/")) return null;
  return publicId;
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
