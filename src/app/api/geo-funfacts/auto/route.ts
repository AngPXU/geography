/**
 * GET /api/geo-funfacts/auto
 *
 * Logic "lazy trigger":
 * - Mỗi ngày có 2 window: 00:00-11:59 (session '00:00') và 12:00-23:59 (session '12:00')
 * - Khi user vào trang, endpoint này kiểm tra:
 *   → Đã có fun fact được tạo trong window hiện tại chưa?
 *   → Nếu chưa → tự động generate (không cần cron secret)
 * - Trả về fact mới nhất + thời điểm update tiếp theo (nextUpdateAt)
 */

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/utils/db';
import GeoFunFact from '@/models/GeoFunFact';

const TOPICS = [
  'Núi lửa & Vỏ Trái Đất', 'Đại dương & Dòng chảy', 'Khí hậu & Thời tiết',
  'Địa hình & Cảnh quan', 'Sông ngòi & Hồ nước', 'Sa mạc & Thảo nguyên',
  'Rừng nhiệt đới', 'Băng hà & Cực địa', 'Đảo & Quần đảo',
  'Biên giới & Địa chính', 'Dân cư & Đô thị hoá', 'Tài nguyên khoáng sản',
  'Động thực vật đặc hữu', 'Thiên tai & Hiện tượng tự nhiên',
];
const REGIONS = [
  'Đông Nam Á', 'Đông Á', 'Nam Á', 'Trung Đông', 'Châu Phi',
  'Châu Âu', 'Bắc Mỹ', 'Nam Mỹ', 'Châu Đại Dương', 'Bắc Cực', 'Nam Cực',
];
const EMOJIS = ['🌋', '🌊', '⛰️', '🏜️', '🌿', '🧊', '🏝️', '🌪️', '💎', '🗺️', '🏙️', '🌌', '🦁', '🐋'];

/** Tính thông tin window hiện tại (UTC+7) */
function getCurrentWindow() {
  const now = new Date();
  // UTC+7
  const vnOffset = 7 * 60 * 60 * 1000;
  const vnNow = new Date(now.getTime() + vnOffset);

  const hour = vnNow.getUTCHours();
  const isNight = hour < 12; // 00:00-11:59 → session '00:00'
  const session: '00:00' | '12:00' = isNight ? '00:00' : '12:00';

  // Thời điểm bắt đầu window hiện tại (UTC)
  const windowStartVN = new Date(vnNow);
  windowStartVN.setUTCHours(isNight ? 0 : 12, 0, 0, 0);
  const windowStart = new Date(windowStartVN.getTime() - vnOffset);

  // Thời điểm update tiếp theo (UTC)
  const nextUpdateVN = new Date(vnNow);
  if (isNight) {
    nextUpdateVN.setUTCHours(12, 0, 0, 0);
  } else {
    nextUpdateVN.setUTCDate(nextUpdateVN.getUTCDate() + 1);
    nextUpdateVN.setUTCHours(0, 0, 0, 0);
  }
  const nextUpdateAt = new Date(nextUpdateVN.getTime() - vnOffset);

  return { session, windowStart, nextUpdateAt };
}

async function generateFunFact(session: '00:00' | '12:00') {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  let parsed: any = null;

  try {
    const prompt = `Bạn là chuyên gia địa lý với 20 năm kinh nghiệm. Hãy tạo ra MỘT "Fun Fact" địa lý gây sốc, bất ngờ hoặc cực kỳ thú vị.

Chủ đề: ${topic}
Khu vực: ${region}

Yêu cầu:
- Phải là sự thật có thể kiểm chứng, có số liệu cụ thể
- Phải khiến người đọc thốt lên "Ồ, thật không?!"
- Phù hợp với học sinh cấp 2-3

Trả về JSON thuần túy (không markdown, không \`\`\`) với cấu trúc:
{"headline":"Câu tiêu đề ngắn gọn gây sốc tối đa 15 chữ","detail":"Giải thích chi tiết 4-6 câu có số liệu cụ thể","whyItMatters":"Tại sao điều này quan trọng 2-3 câu","tags":["tag1","tag2","tag3","tag4"]}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.warn("Gemini API fail, using fallback fact", error);
    // Fallback if Quota is exhausted
    const FALLBACKS = [
      {
        headline: "Sông Amazon không có một cây cầu nào!",
        detail: "Dù dài tới 6.400km và rộng hàng chục km vào mùa mưa, không có một cây cầu nào bắc qua sông Amazon do địa hình 2 bên phần lớn là rừng nhiệt đới trũng lầy và dân số khu vực này rất thưa thớt.",
        whyItMatters: "Thể hiện sức mạnh nguyên thủy của thiên nhiên và sự khó khăn trong việc cải tạo môi trường khắc nghiệt.",
        tags: ["Amazon", "Sông ngòi", "Kỳ lạ"]
      },
      {
        headline: "Thái Bình Dương đang thu hẹp dần!",
        detail: "Mỗi năm, Thái Bình Dương bị thu hẹp khoảng 2-3cm do các mảng kiến tạo cọ xát và chìm xuống dưới các mảng khác (đới hút chìm), trong khi Đại Tây Dương lại đang mở rộng ra.",
        whyItMatters: "Chứng minh rằng vỏ Trái Đất là một hệ thống động liên tục thay đổi hình dạng các lục địa.",
        tags: ["Đại dương", "Kiến tạo mảng", "Trái đất"]
      },
      {
        headline: "Canada có nhiều hồ hơn toàn bộ phần còn lại địa cầu!",
        detail: "Đất nước Canada sở hữu tới khoảng 2 triệu hồ nước các loại, chiếm tới 62% tổng số hồ nước tự nhiên trên toàn thế giới.",
        whyItMatters: "Giúp Canada có nguồn cung cấp năng lượng thủy điện khổng lồ và nguồn lợi thủy sản dồi dào.",
        tags: ["Canada", "Hồ nước", "Kỷ lục"]
      }
    ];
    parsed = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  return GeoFunFact.create({
    headline: parsed.headline,
    detail: parsed.detail,
    whyItMatters: parsed.whyItMatters,
    topic, region, emoji,
    tags: parsed.tags ?? [],
    session,
    generatedAt: new Date(),
  });
}

export async function GET() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY chưa cấu hình' }, { status: 500 });
    }

    await dbConnect();
    const { session, windowStart, nextUpdateAt } = getCurrentWindow();

    // Kiểm tra đã có fact trong window hiện tại chưa
    const existing = await GeoFunFact.findOne({
      generatedAt: { $gte: windowStart },
    }).sort({ generatedAt: -1 }).lean();

    let fact = existing;
    let generated = false;

    if (!fact) {
      // Chưa có → generate ngay cho user đầu tiên vào trong window này
      fact = (await generateFunFact(session)).toObject();
      generated = true;
    }

    return NextResponse.json({ fact, nextUpdateAt, generated, session });
  } catch (err: any) {
    console.error('[GeoFunFact Auto]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
