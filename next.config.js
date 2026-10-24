/** @type {import('next').NextConfig} */

const pollinationsPatterns = [
  {
    protocol: "https",
    hostname: "pollinations.ai",
    pathname: "/p/**",
  },
  {
    protocol: "https",
    hostname: "image.pollinations.ai",
    pathname: "/**",
  },
  {
    protocol: "https",
    hostname: "gen.pollinations.ai",
    pathname: "/**",
  },
];

const nextConfig = {
  serverExternalPackages: ["ioredis", "sliding-window-rate-limiter"],
  images: {
    remotePatterns: pollinationsPatterns,
  },
  async redirects() {
    return [
      {
        source: "/icons/:path*",
        destination: "/logo.png",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        // Keep security headers off hashed `/_next/static` chunks so Turbopack/HMR can revalidate.
        source: "/((?!_next/static|_next/image).*)",
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
