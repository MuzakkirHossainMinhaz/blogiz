/** @type {import('next').NextConfig} */

function storagePattern() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud || !/^[a-z0-9_-]+$/i.test(cloud)) return [];
  return [
    {
      protocol: "https",
      hostname: "res.cloudinary.com",
      pathname: `/${cloud}/**`,
    },
  ];
}

const nextConfig = {
  serverExternalPackages: ["cloudinary", "ioredis", "sliding-window-rate-limiter"],
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
