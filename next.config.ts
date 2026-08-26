import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/contact',
        destination: '/work-with-us',
        permanent: true,
      },
      {
        source: '/leadership/dinesh',
        destination: '/about/leadership/dinesh',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
