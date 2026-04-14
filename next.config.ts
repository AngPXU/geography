import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ép cứng thư mục gốc, tránh bị Next.js nhận diện nhầm do có file package.json rác bên ngoài
    root: "c:\\Users\\nht_anh.BRYCENVN\\Documents\\geography",
  },
  webpack: (config) => {
    // Tránh việc Webpack đi lạc ra ngoài thư mục dự án khi biên dịch PostCSS/Tailwind
    config.resolve.modules = [
      "c:\\Users\\nht_anh.BRYCENVN\\Documents\\geography\\node_modules",
      "node_modules"
    ];
    return config;
  }
};

export default nextConfig;
