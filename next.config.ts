import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config
  turbopack: {
    resolveAlias: {
      canvas:   './src/utils/empty-module.ts',
      encoding: './src/utils/empty-module.ts',
    },
  },
  // Webpack config
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;

    // Cesium is loaded as a global script (/cesium/Cesium.js), NOT bundled.
    // Mark it as external so webpack doesn't touch it.
    config.externals = [...(config.externals || []), { cesium: 'Cesium' }];

    return config;
  },
};

export default nextConfig;