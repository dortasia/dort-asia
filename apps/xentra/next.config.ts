import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack uses project directory by default, but we explicitly restrict it
  // to avoid scanning the parent `scratch` directory which contains massive files
  // and multiple other apps, causing the entire system to lag out of response.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
