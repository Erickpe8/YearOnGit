import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/privacidad",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/terminos",
        destination: "/terms",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
