import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import GeoBook from '@/models/GeoBook';
import path from 'path';
import fs from 'fs';

const GRADE_COLORS: Record<string, string> = {
  '6': '#06B6D4',
  '7': '#22C55E',
  '8': '#F59E0B',
  '9': '#EC4899',
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file      = formData.get('file') as File | null;
    const grade     = formData.get('grade') as string;
    const title     = formData.get('title') as string;
    const subtitle  = formData.get('subtitle') as string ?? '';
    const publisher = formData.get('publisher') as string ?? 'Kết nối tri thức với cuộc sống';
    const startPage = parseInt(formData.get('startPage') as string) || 1;

    if (!file || !grade || !title) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (file, grade, title)' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Chỉ chấp nhận file PDF' }, { status: 400 });
    }

    // Đảm bảo thư mục public/books tồn tại
    const booksDir = path.join(process.cwd(), 'public', 'books');
    if (!fs.existsSync(booksDir)) fs.mkdirSync(booksDir, { recursive: true });

    // Tên file: grade-6.pdf, grade-7.pdf...
    const filename = `grade-${grade}.pdf`;
    const filepath = path.join(booksDir, filename);

    // Ghi file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Lưu vào MongoDB (upsert theo grade)
    await dbConnect();
    const gradeNum = parseInt(grade) as 6 | 7 | 8 | 9;
    const book = await GeoBook.findOneAndUpdate(
      { grade: gradeNum },
      {
        $set: {
          grade:       gradeNum,
          title,
          subtitle,
          publisher,
          pdfFilename: filename,
          startPage,
          coverColor:  GRADE_COLORS[grade] ?? '#06B6D4',
          uploadedAt:  new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, book }, { status: 201 });
  } catch (err: any) {
    console.error('[Books Upload]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
