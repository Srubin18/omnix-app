import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    dynamicIO: false,
  },
};

export default nextConfig;
