import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import dbConnect from '@/utils/db';
import GeoAiCache from '@/models/GeoAiCache';
import { AI_PERSONAS } from '@/data/tutors';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { question, pageNumber, bookTitle, grade, pageText, imageBase64, personaId } = await request.json();

    if (!question || !pageNumber || !bookTitle) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    const pId = personaId || 'geobot';
    const persona = AI_PERSONAS.find(p => p.id === pId) || AI_PERSONAS[0];

    // Caching: Tạo hash dựa trên câu hỏi và ngữ cảnh để tra cứu (tiết kiệm token)
    // Các câu hỏi giống hệt nhau trên cùng 1 trang, cùng 1 nhân vật sẽ trả về kết quả cũ
    const rawString = `${question.toLowerCase().trim()}|${pageNumber}|${bookTitle}|${pId}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex');

    await dbConnect();
    
    // Kiểm tra cache
    const cachedResponse = await GeoAiCache.findOne({ hash });
    if (cachedResponse) {
      console.log(`[AI Ask Book] Cache hit for: ${rawString}`);
      return NextResponse.json({ answer: cachedResponse.answer });
    }

    console.log(`[AI Ask Book] Cache miss, calling Gemini for: ${rawString}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    // Xây dựng system prompt dựa trên persona
    const basePrompt = persona.systemPrompt.replace('{{grade}}', String(grade));
    
    const systemPrompt = `${basePrompt}

📚 Học sinh đang đọc cuốn: "${bookTitle}" — Trang ${pageNumber}
${pageText ? `📝 Nội dung văn bản trang này (để bạn tham khảo):\n${pageText.slice(0, 2000)}` : ''}

🎯 Nhớ phải giữ đúng tính cách nhân vật "${persona.name}" của bạn.
Nếu có ảnh đính kèm (sơ đồ/bản đồ), hãy giải thích những gì bạn thấy.

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

    // Lưu vào cache
    await GeoAiCache.create({
      hash,
      question,
      answer,
      personaId: pId,
      bookTitle,
      pageNumber
    });

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error('[AI Ask Book Error]', err);
    return NextResponse.json({ error: err.message ?? 'AI không phản hồi' }, { status: 500 });
  }
}
