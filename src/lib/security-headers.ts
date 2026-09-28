export function contentSecurityPolicy(nonce: string): string {
  const storageHost = storageHostSource();
  const imgSrc = ["'self'", "data:", "blob:", storageHost].filter(Boolean).join(" ");

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function storageHostSource(): string {
  const base = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (!base) return "";
  try {
    const url = new URL(base);
    if (url.protocol !== "https:") return "";
    return url.host;
  } catch {
    return "";
  }
}

export function applySecurityHeaders(headers: Headers, csp: string) {
  headers.set("Content-Security-Policy", csp);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}
