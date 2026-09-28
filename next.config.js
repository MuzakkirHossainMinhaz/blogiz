/** @type {import('next').NextConfig} */

function storagePattern() {
  const base = process.env.S3_PUBLIC_BASE_URL;
  if (!base) return [];
  try {
    const url = new URL(base);
    if (url.protocol !== "https:") return [];
    return [{ protocol: "https", hostname: url.hostname, pathname: "/**" }];
  } catch {
    return [];
  }
}

const nextConfig = {
  images: {
    remotePatterns: storagePattern(),
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
