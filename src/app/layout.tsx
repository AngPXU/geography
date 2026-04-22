import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import PwaRegister from "@/components/PwaRegister";
import { OnlineTimer } from "@/components/OnlineTimer";
import { BadgeUnlockWatcher } from "@/components/ui/BadgeUnlockWatcher";

const beVietnamPro = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
});

// ── Thay "https://vuihocdialy.edu.vn" bằng domain thật của bạn sau khi mua ──
const SITE_URL = "https://vuihocdialy.edu.vn";
const SITE_NAME = "Khám Phá Địa Lý";
const SITE_DESCRIPTION =
  "Nền tảng học Địa lý số hoá dành cho học sinh THCS Việt Nam — Bản đồ 3D, AI hỏi đáp, câu hỏi trắc nghiệm, lớp học trực tuyến và offline, giáo trình chuẩn Bộ GD&ĐT.";

export const metadata: Metadata = {
  // ── Tiêu đề ──
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Học Địa Lý Thú Vị`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,

  // ── Keywords ──
  keywords: [
    "học địa lý", "địa lý THCS", "bài tập địa lý", "ôn thi địa lý",
    "bản đồ 3D", "câu hỏi địa lý", "lớp học online", "giáo viên địa lý",
    "địa lý lớp 6", "địa lý lớp 7", "địa lý lớp 8", "địa lý lớp 9",
    "khám phá địa lý", "PWA học tập", "app địa lý việt nam",
    "địa lý việt nam", "địa lý thế giới", "giáo dục trực tuyến",
  ],

  // ── Tác giả & nhà xuất bản ──
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // ── Canonical & alternates ──
  alternates: {
    canonical: SITE_URL,
    languages: { "vi-VN": SITE_URL },
  },

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph (Facebook, Zalo, Messenger…) ──
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Học Địa Lý Thú Vị`,
    description: SITE_DESCRIPTION,
    locale: "vi_VN",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Khám Phá Địa Lý — Nền tảng học Địa lý số",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X Card ──
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Học Địa Lý Thú Vị`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: "@vuihocdialy",
    site: "@vuihocdialy",
  },

  // ── Icons ──
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  // ── PWA manifest ──
  manifest: "/manifest.json",

  // ── Apple Web App ──
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },

  // ── Misc ──
  category: "education",
  classification: "Education, Geography, E-learning",
  formatDetection: { telephone: false },

  // ── Google Search Console verification (thêm code sau khi verify) ──
  // verification: {
  //   google: "GOOGLE_VERIFICATION_CODE",
  //   yandex: "YANDEX_VERIFICATION_CODE",
  // },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#E0F2FE" },
    { media: "(prefers-color-scheme: dark)",  color: "#0C4A6E" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ── JSON-LD Structured Data ──────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: "vi-VN",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/map?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#webapp`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web, Android, iOS",
      inLanguage: "vi-VN",
      offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
      featureList: [
        "Bản đồ thế giới 3D tương tác",
        "Hỏi đáp AI về Địa lý",
        "Câu hỏi trắc nghiệm",
        "Lớp học online & offline",
        "Lộ trình học cá nhân hoá",
        "Cài được lên màn hình chính (PWA)",
      ],
      screenshot: `${SITE_URL}/og-image.png`,
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512x512.png`,
        width: 512,
        height: 512,
      },
      sameAs: [],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        <OnlineTimer />
        <BadgeUnlockWatcher />
        {children}
      </body>
    </html>
  );
}
