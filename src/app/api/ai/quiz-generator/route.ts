import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dbConnect from '@/utils/db';
import GeoQuizCache from '@/models/GeoQuizCache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { pagesText, imageBase64, currentPage, bookTitle, grade } = await request.json();

    if (!pagesText || !currentPage || !bookTitle) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    // Connect DB & Check Cache FIRST
    await dbConnect();
    const cacheKey = { bookTitle, grade: Number(grade), pageNumber: Number(currentPage) };
    const cachedQuiz = await GeoQuizCache.findOne(cacheKey).lean();
    
    if (cachedQuiz) {
      // Bỏ qua gọi API, dùng lại cache
      return NextResponse.json({
        lessonDetected: cachedQuiz.lessonDetected,
        questions: cachedQuiz.questions
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    const systemPrompt = `Bạn là GeoBot 🌍 — chuyên gia ra đề thi Trắc nghiệm môn Địa Lý cấp THCS Việt Nam.
Nhiệm vụ của bạn là nhận vào nội dung văn bản của một số trang sách xung quanh trang ${currentPage} của cuốn "${bookTitle}" (Lớp ${grade}).
Bạn PHẢI phân tích để TÌM RA "Bài học" (Lesson) nào đang chứa nội dung của TRANG HIỆN TẠI (Trang ${currentPage}). Sau đó, CHỈ sử dụng kiến thức nằm trong phạm vi BÀI HỌC ĐÓ để tạo ra 4 câu hỏi trắc nghiệm cực hay, phù hợp với lứa tuổi. Không lấy dính kiến thức của bài trước hoặc bài sau!

[QUỸ ĐẠO BÀI HỌC]:
Dưới đây là nội dung chiết xuất thô từ file PDF, đọc nó cẩn thận để xác định ranh giới (boundary) của Bài học:
=== BẮT ĐẦU VĂN BẢN ===
${pagesText}
=== KẾT THÚC VĂN BẢN ===

YÊU CẦU ĐẦU RA KIỂM TRA (CHỈ TRẢ VỀ JSON, KHÔNG THÊM BẤT KỲ VĂN BẢN NÀO TRƯỚC HAY SAU):
Bạn phải trả về một object JSON có cấu trúc sau:
{
  "lessonDetected": "Tên hoặc Bài số mấy bạn đã trích xuất được (VD: Bài 5: Vị trí địa lí Việt Nam)",
  "questions": [
    {
      "q": "Nội dung câu hỏi trắc nghiệm?",
      "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
      "answerIndex": 0, /* Chỉ số của đáp án đúng (0, 1, 2, 3) */
      "explanation": "Lời giải thích ngắn gọn, súc tích (1-2 câu) tại sao đây là đáp án đúng, khen ngợi học sinh"
    }
  ]
}`;

    const contents: any[] = [{ text: systemPrompt }];
    if (imageBase64) {
      const b64 = imageBase64.split(',')[1] || imageBase64;
      contents.push({
        inlineData: { data: b64, mimeType: 'image/jpeg' }
      });
    }

    const result = await model.generateContent(contents);

    const textResponse = result.response.text().trim();
    // Dọn dẹp Markdown JSON format nếu gemini bọc trong ```json
    const cleanJson = textResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');

    const parsed = JSON.parse(cleanJson);

    // Save success result to DB before returning
    if (parsed.questions && parsed.questions.length > 0) {
      try {
        await GeoQuizCache.create({
          ...cacheKey,
          lessonDetected: parsed.lessonDetected || 'Bài ôn tập',
          questions: parsed.questions
        });
      } catch (dbErr) {
        // Ignore duplicate key error (race condition)
        console.error('[Cache Save Error]', dbErr);
      }
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('[AI Quiz Gen]', err);
    return NextResponse.json({ error: err.message ?? 'Lỗi khi tạo Quiz' }, { status: 500 });
  }
}
