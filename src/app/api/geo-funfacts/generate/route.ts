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

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const session: '00:00' | '12:00' = body.session ?? (new Date().getHours() < 6 ? '00:00' : '12:00');

  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY chưa được cấu hình' }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
Bạn là chuyên gia địa lý với 20 năm kinh nghiệm. Hãy tạo ra MỘT "Fun Fact" địa lý gây sốc, bất ngờ hoặc cực kỳ thú vị.

Chủ đề: ${topic}
Khu vực: ${region}

Yêu cầu:
- Phải là sự thật có thể kiểm chứng, có số liệu cụ thể
- Phải khiến người đọc thốt lên "Ồ, thật không?!"
- Phù hợp với học sinh cấp 2-3

Trả về JSON thuần túy (không markdown, không \`\`\`) với cấu trúc:
{
  "headline": "Câu tiêu đề ngắn gọn gây sốc/bất ngờ, tối đa 15 chữ, bắt đầu bằng sự thật đáng ngạc nhiên",
  "detail": "Giải thích chi tiết 4-6 câu, bao gồm nguyên nhân khoa học, số liệu cụ thể, quá trình hình thành hoặc ví dụ minh họa sinh động",
  "whyItMatters": "Giải thích tại sao điều này quan trọng với địa lý/cuộc sống con người (2-3 câu)",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = JSON.parse(text);

    await dbConnect();
    const doc = await GeoFunFact.create({
      headline: parsed.headline,
      detail: parsed.detail,
      whyItMatters: parsed.whyItMatters,
      topic,
      region,
      emoji,
      tags: parsed.tags ?? [],
      session,
      generatedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err: any) {
    console.error('[GeoFunFact Generate]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
