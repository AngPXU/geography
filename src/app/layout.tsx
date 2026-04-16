import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";
import { OnlineTimer } from "@/components/OnlineTimer";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
});
export const metadata: Metadata = {
  title: "Khám Phá Địa Lý",
  description: "Ứng dụng học tập môn Địa lý dành cho học sinh THCS",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Khám Phá Địa Lý",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#E0F2FE",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <OnlineTimer />
        {children}
      </body>
    </html>
  );
}
