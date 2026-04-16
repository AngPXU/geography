import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config
  turbopack: {
    resolveAlias: {
      canvas:   './src/utils/empty-module.ts',
      encoding: './src/utils/empty-module.ts',
    },
  },
  // Webpack fallback
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;