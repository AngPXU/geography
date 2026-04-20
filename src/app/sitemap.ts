import { MetadataRoute } from 'next';

const SITE_URL = 'https://vuihocdialy.edu.vn';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // ── Các trang tĩnh public (dựa theo src/app/**/page.tsx) ─────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    // Trang chủ
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Bản đồ
    {
      url: `${SITE_URL}/map`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Đấu trường
    {
      url: `${SITE_URL}/arena`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/arena/map-guessing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Bài học
    {
      url: `${SITE_URL}/lessons`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/lessons/grade6-bai1`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/lessons/mekong-delta`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Sách
    {
      url: `${SITE_URL}/books`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Lộ trình
    {
      url: `${SITE_URL}/roadmap`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Lớp học
    {
      url: `${SITE_URL}/classroom`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Không đưa vào sitemap: /login, /admin, /profile, /homeclass/[cid]/[aid],
    //   /arena/map-guessing/room/[roomCode] — login-only hoặc dynamic private
  ];

  return staticRoutes;
}
