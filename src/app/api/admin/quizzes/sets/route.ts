import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import QuizSet from '@/models/QuizSet';
import QuizQuestion from '@/models/QuizQuestion';

// Require admin or teacher role
async function requireAuth() {
  const session = await auth();
  if (!session?.user) return false;
  // admin(1) or teacher(2)
  if ((session.user as any).role > 2) return false;
  return true;
}

// GET /api/admin/quizzes/sets -> list all quiz sets
export async function GET() {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await dbConnect();
    const sets = await QuizSet.find().sort({ grade: 1, order: 1, createdAt: 1 }).lean();
    
    // Fetch counts
    const withCounts = await Promise.all(
      sets.map(async (s) => {
        const count = await QuizQuestion.countDocuments({ quizSetId: s._id });
        return { ...s, questionCount: count };
      })
    );
    return NextResponse.json({ sets: withCounts });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/admin/quizzes/sets
export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const { grade, quizId, title, icon, quizType, timeLimit } = body;
    if (!grade || !quizId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const existing = await QuizSet.findOne({ grade, quizId });
    if (existing) {
      return NextResponse.json({ error: 'quizId already exists for this grade' }, { status: 400 });
    }

    const set = await QuizSet.create({
      grade,
      quizId,
      title,
      icon: icon || '📝',
      quizType: quizType || 'kt15p',
      timeLimit: timeLimit || 15
    });

    return NextResponse.json({ set });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/quizzes/sets (Delete ALL)
export async function DELETE() {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await dbConnect();
    await QuizQuestion.deleteMany({});
    const setRes = await QuizSet.deleteMany({});
    return NextResponse.json({ deleted: setRes.deletedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
