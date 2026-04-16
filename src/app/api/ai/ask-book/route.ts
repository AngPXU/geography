import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { question, pageNumber, bookTitle, grade, pageText, imageBase64 } = await request.json();

    if (!question || !pageNumber || !bookTitle) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    // Xây dựng prompt thân thiện với học sinh THCS
    const systemPrompt = `Bạn là GeoBot 🌍 — trợ lý học tập Địa Lý thông minh và tuyệt vời, 
chuyên hỗ trợ học sinh lớp ${grade} cấp THCS Việt Nam.

📚 Học sinh đang đọc: "${bookTitle}" — Trang ${pageNumber}
${pageText ? `📝 Nội dung văn bản trang này:\n${pageText.slice(0, 2000)}` : ''}

🎯 Nhiệm vụ của bạn:
- Giải thích kiến thức địa lý một cách đơn giản, dễ hiểu, phù hợp lứa tuổi học sinh lớp ${grade}
- Dùng ví dụ thực tế gần gũi với học sinh Việt Nam
- Trả lời ngắn gọn (tối đa 300 từ), súc tích, có cấu trúc rõ ràng
- Thêm emoji phù hợp để sinh động
- Nếu câu hỏi liên quan đến bản đồ/hình ảnh trong trang, hãy mô tả và giải thích những gì bạn thấy
- Khuyến khích học sinh và tạo cảm hứng học tập

Câu hỏi của học sinh: "${question}"`;

    // Gửi kèm ảnh nếu có (Gemini Vision)
    const parts: any[] = [];

    if (imageBase64) {
      // Loại bỏ prefix data:image/...;base64,
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data,
        },
      });
    }

    parts.push(systemPrompt);

    const result = await model.generateContent(parts);
    const answer = result.response.text();

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error('[AI Ask Book]', err);
    return NextResponse.json({ error: err.message ?? 'AI không phản hồi' }, { status: 500 });
  }
}
