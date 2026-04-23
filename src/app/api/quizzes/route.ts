import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import QuizSet from '@/models/QuizSet';
import QuizQuestion from '@/models/QuizQuestion';

// GET /api/quizzes?grade=6  → list sets (with questions) for a grade
// GET /api/quizzes?setId=xxx → questions for a specific set
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');
    const setId = searchParams.get('setId');

    await dbConnect();

    if (setId) {
      const [quizSet, questions] = await Promise.all([
        QuizSet.findById(setId).lean(),
        QuizQuestion.find({ quizSetId: setId }).sort({ order: 1 }).lean(),
      ]);
      return NextResponse.json({ set: quizSet, questions });
    }

    if (grade) {
      const sets = await QuizSet.find({ grade: Number(grade) })
        .sort({ order: 1, createdAt: 1 })
        .lean();
      return NextResponse.json({ sets });
    }

    // Return all sets grouped by grade
    const sets = await QuizSet.find().sort({ grade: 1, order: 1 }).lean();
    return NextResponse.json({ sets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
