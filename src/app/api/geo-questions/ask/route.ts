import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import GeoQAHistory from '@/models/GeoQAHistory';

const GEO_SYSTEM_PROMPT = `Bạn là trợ lý AI chuyên về Địa lý, hỗ trợ học sinh cấp 2 tìm hiểu kiến thức địa lý.

NGUYÊN TẮC QUAN TRỌNG:
- Mặc định HÃY TRẢ LỜI nếu câu hỏi có liên quan đến địa lý, dù chỉ một phần nhỏ.
- Địa lý bao gồm rất rộng: sông, núi, biển, quốc gia, thủ đô, khí hậu, thiên nhiên, châu lục, vùng đất, địa danh, khoáng sản, dân cư, môi trường, bản đồ, v.v.
- Câu hỏi về vị trí ("ở đâu"), độ lớn ("dài bao nhiêu", "cao bao nhiêu"), đặc điểm tự nhiên của bất kỳ địa danh nào → ĐỀU là địa lý, luôn trả lời.

CHỈ TỪ CHỐI khi câu hỏi hoàn toàn không liên quan đến địa lý, ví dụ:
- Toán học thuần túy (2+2=?, giải phương trình)
- Lập trình / công nghệ (code Python, sửa lỗi máy tính)
- Văn học / thơ ca (phân tích bài thơ, viết văn)
- Thể thao (kết quả bóng đá, luật thi đấu)
- Giải trí (phim ảnh, âm nhạc, game)
- Y tế / sức khỏe (triệu chứng bệnh, thuốc)

FORMAT TRẢ LỜI — luôn là JSON thuần túy, KHÔNG có markdown, KHÔNG có \`\`\`:

Nếu được phép trả lời:
{"allowed":true,"answer":"Câu trả lời chi tiết, dễ hiểu, phù hợp học sinh cấp 2, có số liệu cụ thể nếu có","funFact":"Một sự thật thú vị ngắn (1-2 câu)","relatedTopics":["chủ đề 1","chủ đề 2"]}

Nếu từ chối:
{"allowed":false,"reason":"Lý do ngắn gọn, thân thiện, gợi ý hỏi về địa lý thay thế"}`;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const username = session?.user?.name ?? null;

    const body = await request.json();
    const question: string = (body.question ?? '').trim();

    if (!question || question.length < 5) {
      return NextResponse.json({ error: 'Câu hỏi quá ngắn' }, { status: 400 });
    }
    if (question.length > 500) {
      return NextResponse.json({ error: 'Câu hỏi quá dài (tối đa 500 ký tự)' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY chưa được cấu hình' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const result = await model.generateContent(
      `${GEO_SYSTEM_PROMPT}\n\nCâu hỏi của học sinh: ${question}`
    );
    const text = result.response.text().trim();

    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // Lưu vào DB nếu AI trả lời và user đã đăng nhập
    if (parsed.allowed && username) {
      await dbConnect();
      await GeoQAHistory.create({
        username,
        question,
        answer: parsed.answer,
        funFact: parsed.funFact ?? '',
        relatedTopics: parsed.relatedTopics ?? [],
      });
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('[GeoAsk]', err);
    return NextResponse.json({ error: err.message ?? 'Lỗi không xác định' }, { status: 500 });
  }
}
