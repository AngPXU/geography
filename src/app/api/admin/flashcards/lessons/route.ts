import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import FlashcardLesson from '@/models/FlashcardLesson';
import FlashcardCard from '@/models/FlashcardCard';

// GET — list all lessons, joined with card counts
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');

  const filter: Record<string, unknown> = {};
  if (grade) filter.grade = parseInt(grade);

  // Fetch all lesson records
  const lessonDocs = await FlashcardLesson.find(filter)
    .sort({ grade: 1, order: 1, lessonId: 1 })
    .lean();

  // Fetch card counts grouped by (grade, lessonId)
  const cardCounts = await FlashcardCard.aggregate([
    ...(grade ? [{ $match: { grade: parseInt(grade) } }] : []),
    { $group: { _id: { grade: '$grade', lessonId: '$lessonId' }, count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  for (const c of cardCounts) {
    countMap.set(`${c._id.grade}__${c._id.lessonId}`, c.count);
  }

  const lessons = lessonDocs.map(l => ({
    _id: l._id.toString(),
    grade: l.grade,
    lessonId: l.lessonId,
    lessonTitle: l.lessonTitle,
    lessonIcon: l.lessonIcon,
    cardCount: countMap.get(`${l.grade}__${l.lessonId}`) ?? 0,
  }));

  return NextResponse.json({ lessons });
}

// POST — create a new lesson record
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const body = await request.json();
  const { grade, lessonId, lessonTitle, lessonIcon } = body;

  if (!grade || !lessonId || !lessonTitle) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
  }

  // Duplicate check
  const existing = await FlashcardLesson.findOne({
    grade: Number(grade),
    lessonId: String(lessonId).trim(),
  });
  if (existing) {
    return NextResponse.json(
      { error: `Mã bài học "${lessonId}" đã tồn tại ở Lớp ${grade}` },
      { status: 409 }
    );
  }

  // Auto order
  const last = await FlashcardLesson.findOne({ grade: Number(grade) })
    .sort({ order: -1 })
    .select('order')
    .lean();
  const order = last ? (last as { order: number }).order + 1 : 0;

  const lesson = await FlashcardLesson.create({
    grade: Number(grade),
    lessonId: String(lessonId).trim(),
    lessonTitle: String(lessonTitle).trim(),
    lessonIcon: String(lessonIcon || '📚').trim(),
    order,
  });

  return NextResponse.json(
    {
      lesson: {
        _id: lesson._id.toString(),
        grade: lesson.grade,
        lessonId: lesson.lessonId,
        lessonTitle: lesson.lessonTitle,
        lessonIcon: lesson.lessonIcon,
        cardCount: 0,
      },
    },
    { status: 201 }
  );
}
