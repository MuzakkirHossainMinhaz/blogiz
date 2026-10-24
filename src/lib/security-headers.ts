const POLLINATIONS_IMG_SOURCES = [
  "https://pollinations.ai",
  "https://image.pollinations.ai",
  "https://gen.pollinations.ai",
].join(" ");

export function contentSecurityPolicy(nonce: string): string {
  const imgSrc = ["'self'", "data:", "blob:", POLLINATIONS_IMG_SOURCES].join(" ");
  const isDev = process.env.NODE_ENV !== "production";
  // React reconstruction / Turbopack HMR need eval in development only.
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", isDev ? "'unsafe-eval'" : null]
    .filter(Boolean)
    .join(" ");
  const connectSrc = isDev ? "'self' ws: wss:" : "'self'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function applySecurityHeaders(headers: Headers, csp: string) {
  headers.set("Content-Security-Policy", csp);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}
