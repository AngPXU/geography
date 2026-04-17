import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import FlashcardCard from '@/models/FlashcardCard';
import FlashcardLesson from '@/models/FlashcardLesson';
import { FLASHCARD_DATA } from '@/data/flashcardsData';

// POST — seed the flashcard DB from static data
export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const existing = await FlashcardCard.countDocuments();
  if (existing > 0) {
    return NextResponse.json({
      message: `Database đã có ${existing} thẻ. Xóa toàn bộ trước khi nhập lại.`,
      skipped: true,
      existing,
    });
  }

  const cardDocs = [];
  const lessonDocs = [];

  for (const grade of FLASHCARD_DATA) {
    for (let li = 0; li < grade.lessons.length; li++) {
      const lesson = grade.lessons[li];
      lessonDocs.push({
        grade: grade.grade,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonIcon: lesson.icon,
        order: li,
      });
      for (let i = 0; i < lesson.cards.length; i++) {
        const card = lesson.cards[i];
        cardDocs.push({
          grade: grade.grade,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonIcon: lesson.icon,
          front: card.front,
          back: card.back,
          hint: card.hint,
          order: i,
        });
      }
    }
  }

  // Upsert lessons so we don't duplicate if run again
  for (const l of lessonDocs) {
    await FlashcardLesson.updateOne(
      { grade: l.grade, lessonId: l.lessonId },
      { $set: l },
      { upsert: true }
    );
  }

  await FlashcardCard.insertMany(cardDocs);
  return NextResponse.json({ success: true, count: cardDocs.length, lessons: lessonDocs.length });
}
