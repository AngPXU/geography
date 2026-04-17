import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import FlashcardCard from '@/models/FlashcardCard';
import FlashcardLesson from '@/models/FlashcardLesson';

// GET — list cards (optional ?grade=6)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const search = searchParams.get('search') || '';

  const lessonId = searchParams.get('lessonId');

  const filter: Record<string, unknown> = {};
  if (grade) filter.grade = parseInt(grade);
  if (lessonId) filter.lessonId = lessonId;
  if (search) {
    filter.$or = [
      { front: { $regex: search, $options: 'i' } },
      { back:  { $regex: search, $options: 'i' } },
      { lessonTitle: { $regex: search, $options: 'i' } },
    ];
  }

  const cards = await FlashcardCard.find(filter)
    .sort({ grade: 1, lessonId: 1, order: 1 })
    .lean();

  return NextResponse.json({ cards });
}

// POST — create a new card
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const body = await request.json();
  const { grade, lessonId, lessonTitle, lessonIcon, front, back, hint } = body;

  if (!grade || !lessonId || !lessonTitle || !front || !back) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
  }

  // Get current max order for this lesson
  const lastCard = await FlashcardCard.findOne({ grade: Number(grade), lessonId })
    .sort({ order: -1 })
    .select('order')
    .lean();
  const order = lastCard ? (lastCard as { order: number }).order + 1 : 0;

  const card = await FlashcardCard.create({
    grade: Number(grade),
    lessonId: String(lessonId).trim(),
    lessonTitle: String(lessonTitle).trim(),
    lessonIcon: String(lessonIcon || '📚').trim(),
    front: String(front).trim(),
    back: String(back).trim(),
    hint: hint ? String(hint).trim() : undefined,
    order,
  });

  return NextResponse.json({ card }, { status: 201 });
}

// DELETE — delete ALL cards (for re-seeding)
export async function DELETE() {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();
  const [cardResult, lessonResult] = await Promise.all([
    FlashcardCard.deleteMany({}),
    FlashcardLesson.deleteMany({}),
  ]);
  return NextResponse.json({ deleted: cardResult.deletedCount, deletedLessons: lessonResult.deletedCount });
}
