import type { NextConfig } from "next";
import webpack from "webpack";

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

    // Inject CESIUM_BASE_URL at compile-time so Cesium Workers
    // can locate static assets regardless of deployment environment
    config.plugins.push(
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify('/cesium'),
      })
    );

    return config;
  },
};

export default nextConfig;