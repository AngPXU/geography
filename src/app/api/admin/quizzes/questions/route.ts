import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import QuizQuestion from '@/models/QuizQuestion';
import QuizSet from '@/models/QuizSet';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) return false;
  if ((session.user as any).role > 2) return false;
  return true;
}

// GET /api/admin/quizzes/questions?setId=...
export async function GET(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const setId = searchParams.get('setId');
    if (!setId) return NextResponse.json({ error: 'setId is required' }, { status: 400 });

    await dbConnect();
    const questions = await QuizQuestion.find({ quizSetId: setId }).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/quizzes/questions
export async function POST(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const { quizSetId, questionType = 'mc', content, mediaUrl, mediaType, options, correctOption, tfAnswers, essayAnswer, explanation } = body;

    if (!quizSetId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (questionType === 'mc' && (options?.length !== 4 || typeof correctOption !== 'number')) {
      return NextResponse.json({ error: 'MC question requires 4 options and correctOption' }, { status: 400 });
    }
    if (questionType === 'tf' && (options?.length !== 4 || !Array.isArray(tfAnswers) || tfAnswers.length !== 4)) {
      return NextResponse.json({ error: 'TF question requires 4 options and 4 tfAnswers' }, { status: 400 });
    }

    await dbConnect();
    const setExists = await QuizSet.exists({ _id: quizSetId });
    if (!setExists) {
      return NextResponse.json({ error: 'QuizSet not found' }, { status: 404 });
    }

    const count = await QuizQuestion.countDocuments({ quizSetId });

    const q = await QuizQuestion.create({
      quizSetId,
      questionType,
      content,
      mediaUrl,
      mediaType,
      options: options ?? [],
      correctOption,
      tfAnswers,
      essayAnswer,
      explanation,
      order: count
    });

    return NextResponse.json({ question: q });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/quizzes/questions
export async function DELETE(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await dbConnect();
    await QuizQuestion.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
