import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import FlashcardCard from '@/models/FlashcardCard';
import FlashcardLesson from '@/models/FlashcardLesson';

interface CardItem { front: string; back: string; hint?: string; order: number; }
interface LessonGroup { lessonId: string; lessonTitle: string; lessonIcon: string; cards: CardItem[]; }

// GET /api/flashcards — returns grades 6–9 → lessons → cards
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const [lessons, cards] = await Promise.all([
    FlashcardLesson.find({}).sort({ grade: 1, order: 1, lessonId: 1 }).lean(),
    FlashcardCard.find({})
      .sort({ grade: 1, lessonId: 1, order: 1 })
      .select('grade lessonId lessonTitle lessonIcon front back hint order')
      .lean(),
  ]);

  // Build card groups keyed by grade__lessonId
  const cardGroupMap = new Map<string, LessonGroup>();
  for (const card of cards) {
    const key = `${card.grade}__${card.lessonId}`;
    if (!cardGroupMap.has(key)) {
      cardGroupMap.set(key, {
        lessonId:    card.lessonId,
        lessonTitle: card.lessonTitle,
        lessonIcon:  card.lessonIcon,
        cards:       [],
      });
    }
    cardGroupMap.get(key)!.cards.push({
      front: card.front, back: card.back, hint: card.hint, order: card.order,
    });
  }

  // Always include all 4 grade buckets
  const gradeMap = new Map<number, { grade: number; lessons: LessonGroup[] }>();
  for (const g of [6, 7, 8, 9]) gradeMap.set(g, { grade: g, lessons: [] });

  const addedKeys = new Set<string>();

  // Primary source: FlashcardLesson — join with card groups
  for (const lesson of lessons) {
    const key = `${lesson.grade}__${lesson.lessonId}`;
    addedKeys.add(key);
    const g = gradeMap.get(lesson.grade);
    if (!g) continue;
    g.lessons.push({
      lessonId:    lesson.lessonId,
      lessonTitle: lesson.lessonTitle,
      lessonIcon:  lesson.lessonIcon,
      cards:       cardGroupMap.get(key)?.cards ?? [],
    });
  }

  // Fallback: card groups with no matching FlashcardLesson (handles mismatched IDs)
  for (const [key, group] of cardGroupMap) {
    if (addedKeys.has(key)) continue;
    const grade = parseInt(key.split('__')[0]);
    const g = gradeMap.get(grade);
    if (!g) continue;
    g.lessons.push(group);
  }

  const grades = Array.from(gradeMap.values()).sort((a, b) => a.grade - b.grade);

  return NextResponse.json({ grades });
}
