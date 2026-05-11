import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Strip console.log/warn/info/debug khi build production để giữ DevTools
  // sạch + giảm chi phí runtime trên mobile yếu. Vẫn giữ console.error để
  // lỗi thật vẫn được ghi nhận (Vercel logs / Sentry).
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
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

export default withBundleAnalyzer(nextConfig);