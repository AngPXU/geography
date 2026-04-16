import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16+ mặc định dùng Turbopack)
  turbopack: {
    resolveAlias: {
      canvas: './src/utils/empty-module.ts',
      encoding: './src/utils/empty-module.ts',
    },
  },
  // Giữ webpack config cho fallback
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
