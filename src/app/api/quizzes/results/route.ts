import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import QuizResult from '@/models/QuizResult';
import QuizSet from '@/models/QuizSet';
import mongoose from 'mongoose';

// POST /api/quizzes/results  — student saves their submission
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const body = await req.json();
  const {
    setId, mcAnswers, tfAnswers, essayAnswers,
    mcCorrect, mcTotal, tfCorrect, tfTotal,
    essayAnswered, essayTotal,
    timeSpentSeconds, timeLimitSeconds,
    exitCount, exitLog,
  } = body;

  if (!setId) return NextResponse.json({ error: 'Thiếu setId' }, { status: 400 });

  await dbConnect();

  const quizSet = await QuizSet.findById(setId).lean();
  if (!quizSet) return NextResponse.json({ error: 'Không tìm thấy bộ đề' }, { status: 404 });

  const u = session.user as { id?: string; name?: string };
  const result = await QuizResult.create({
    setId: new mongoose.Types.ObjectId(setId),
    userId:   u.id ?? '',
    username: u.name ?? '',
    grade:    (quizSet as any).grade,
    quizTitle: (quizSet as any).title,
    quizType:  (quizSet as any).quizType,
    mcAnswers:  mcAnswers  ?? {},
    tfAnswers:  tfAnswers  ?? {},
    essayAnswers: essayAnswers ?? {},
    mcCorrect:  mcCorrect  ?? 0,
    mcTotal:    mcTotal    ?? 0,
    tfCorrect:  tfCorrect  ?? 0,
    tfTotal:    tfTotal    ?? 0,
    essayAnswered: essayAnswered ?? 0,
    essayTotal:    essayTotal    ?? 0,
    timeSpentSeconds: timeSpentSeconds ?? 0,
    timeLimitSeconds: timeLimitSeconds ?? 0,
    exitCount: exitCount ?? 0,
    exitLog:   exitLog   ?? [],
    submittedAt: new Date(),
  });

  return NextResponse.json({ ok: true, resultId: result._id });
}

// GET /api/quizzes/results?resultId=xxx  — student fetch own result (or admin)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const resultId = searchParams.get('resultId');
  if (!resultId) return NextResponse.json({ error: 'Thiếu resultId' }, { status: 400 });

  await dbConnect();
  const result = await QuizResult.findById(resultId).lean();
  if (!result) return NextResponse.json({ error: 'Không tìm thấy kết quả' }, { status: 404 });

  return NextResponse.json({ result });
}
