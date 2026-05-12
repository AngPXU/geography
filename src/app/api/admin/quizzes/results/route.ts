import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import QuizResult from '@/models/QuizResult';
import User from '@/models/User';
import mongoose from 'mongoose';

// GET /api/admin/quizzes/results?setId=xxx        → list all submissions for a set
// GET /api/admin/quizzes/results?resultId=xxx     → full detail of one submission
export async function GET(req: NextRequest) {
  const session = await auth();
  const u = session?.user as { role?: number } | null;
  if (!u || (u.role ?? 3) > 2) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const setId    = searchParams.get('setId');
  const resultId = searchParams.get('resultId');

  if (resultId) {
    // Detail view
    const result = await QuizResult.findById(resultId).lean();
    if (!result) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    return NextResponse.json({ result });
  }

  if (setId) {
    // List all submissions for a quiz set
    const results = await QuizResult.find(
      { setId: new mongoose.Types.ObjectId(setId) },
      'userId username mcCorrect mcTotal tfCorrect tfTotal essayAnswered essayTotal timeSpentSeconds timeLimitSeconds exitCount submittedAt'
    )
      .sort({ submittedAt: -1 })
      .lean();

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: 'Thiếu tham số' }, { status: 400 });
}

// DELETE /api/admin/quizzes/results?resultId=xxx  → xoá một bài làm
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const u = session?.user as { role?: number } | null;
  if (!u || (u.role ?? 3) > 2) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const resultId = searchParams.get('resultId');
  if (!resultId) return NextResponse.json({ error: 'Thiếu resultId' }, { status: 400 });

  await QuizResult.findByIdAndDelete(resultId);
  return NextResponse.json({ ok: true });
}
