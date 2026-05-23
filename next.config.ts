import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["motion", "dexie", "zustand"],
  },
};

export default nextConfig;
