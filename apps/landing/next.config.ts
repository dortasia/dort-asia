import type { NextConfig } from "next";
import path from "path";
import { validateEnv } from "./utils/env";

// Fail the build immediately if required env vars are absent.
// Remove this call only if you are running `next dev` without a .env.local.
validateEnv();

const monorepoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "uzylfswzyygcbqaylnyh.supabase.co" },
    ],
  },
  outputFileTracingRoot: monorepoRoot,
  turbopack: {
    root: monorepoRoot,
  },
  async redirects() {
    const hrmsUrl = process.env.NEXT_PUBLIC_EMPLOYEE_MANAGEMENT_URL!;
    return [
      {
        source: "/products/vertex",
        destination: hrmsUrl,
        permanent: false,
      },
      {
        source: "/apps/vertex",
        destination: hrmsUrl,
        permanent: false,
      },
      {
        source: "/apps/vertex-hrms",
        destination: hrmsUrl,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
