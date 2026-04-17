import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import FlashcardLesson from '@/models/FlashcardLesson';
import FlashcardCard from '@/models/FlashcardCard';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// PATCH — update lesson metadata
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  await dbConnect();

  const body = await request.json();
  const { lessonTitle, lessonIcon } = body;

  if (!lessonTitle) {
    return NextResponse.json({ error: 'Tên bài học không được để trống' }, { status: 400 });
  }

  const lesson = await FlashcardLesson.findByIdAndUpdate(
    id,
    {
      lessonTitle: String(lessonTitle).trim(),
      lessonIcon: String(lessonIcon || '📚').trim(),
    },
    { new: true }
  );

  if (!lesson) {
    return NextResponse.json({ error: 'Không tìm thấy bài học' }, { status: 404 });
  }

  // Also update the denormalized fields in all cards of this lesson
  await FlashcardCard.updateMany(
    { grade: lesson.grade, lessonId: lesson.lessonId },
    { $set: { lessonTitle: lesson.lessonTitle, lessonIcon: lesson.lessonIcon } }
  );

  return NextResponse.json({ lesson });
}

// DELETE — delete a lesson and ALL its flashcards
export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  await dbConnect();

  const lesson = await FlashcardLesson.findByIdAndDelete(id);
  if (!lesson) {
    return NextResponse.json({ error: 'Không tìm thấy bài học' }, { status: 404 });
  }

  // Delete all flashcards belonging to this lesson
  const result = await FlashcardCard.deleteMany({
    grade: lesson.grade,
    lessonId: lesson.lessonId,
  });

  return NextResponse.json({ success: true, deletedCards: result.deletedCount });
}
