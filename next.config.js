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
