import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/utils/db';
import GeoQuestion from '@/models/GeoQuestion';

const TOPICS = [
  'Núi lửa & Vỏ Trái Đất', 'Đại dương & Dòng chảy', 'Khí hậu & Thời tiết',
  'Địa hình & Cảnh quan', 'Sông ngòi & Hồ nước', 'Sa mạc & Thảo nguyên',
  'Rừng nhiệt đới', 'Băng hà & Cực địa', 'Đảo & Quần đảo',
  'Biên giới & Địa chính', 'Dân cư & Đô thị hoá', 'Tài nguyên khoáng sản',
];
const REGIONS = [
  'Đông Nam Á', 'Đông Á', 'Nam Á', 'Trung Đông',
  'Châu Phi', 'Châu Âu', 'Bắc Mỹ', 'Nam Mỹ',
  'Châu Đại Dương', 'Bắc Cực', 'Nam Cực',
];

export async function POST(request: Request) {
  // Bảo vệ endpoint bằng secret header
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const session: '00:00' | '12:00' = body.session ?? (new Date().getHours() < 6 ? '00:00' : '12:00');

  // Chọn ngẫu nhiên topic và region
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];

  // ---- Gọi Gemini ----
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY chưa được cấu hình trong .env' }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  const prompt = `
Bạn là một chuyên gia địa lý. Hãy tạo ra MỘT câu hỏi "Vì sao..." rất thú vị về chủ đề địa lý.

Chủ đề: ${topic}
Khu vực: ${region}

Trả về JSON thuần túy (không có markdown, không có \`\`\`) với cấu trúc:
{
  "question": "Vì sao ... (câu hỏi hấp dẫn, cụ thể, dành cho học sinh cấp 2-3)",
  "answer": "Giải thích chi tiết 3-5 câu, dễ hiểu, chính xác về mặt khoa học, có số liệu cụ thể nếu có thể",
  "funFact": "Một sự thật thú vị ngắn gọn (1 câu) liên quan đến chủ đề",
  "tags": ["tag1", "tag2", "tag3"]
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON từ response
    const parsed = JSON.parse(text);

    // ---- Lưu vào MongoDB ----
    await dbConnect();
    const doc = await GeoQuestion.create({
      question: parsed.question,
      answer: parsed.answer,
      topic,
      region,
      funFact: parsed.funFact,
      tags: parsed.tags ?? [],
      session,
      generatedAt: new Date(),
    });

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err: any) {
    console.error('[GeoQuestion Generate]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
