import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/classroom/[id]/quiz/save-results
 * Body: { scores: ScoreEntry[], totalQuestionsAsked: number }
 *
 * Ghi kết quả quiz vào MongoDB 1 lần duy nhất cuối buổi (thay vì ghi mỗi câu trả lời).
 * Chỉ giáo viên của lớp (hoặc admin) mới được gọi.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  await connectDB();

  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isTeacher =
    classroom.teacherId === user._id.toString() ||
    user.role === 1 ||
    user.role === 2;

  if (!isTeacher) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  const { scores, totalQuestionsAsked } = await req.json() as {
    scores: {
      studentId: string;
      studentName: string;
      totalScore: number;
      correctCount: number;
      wrongCount: number;
    }[];
    totalQuestionsAsked: number;
  };

  if (!Array.isArray(scores)) {
    return NextResponse.json({ error: 'scores must be an array' }, { status: 400 });
  }

  // Merge with existing scores (accumulate across sessions)
  const existingMap = new Map<string, typeof scores[0]>();
  for (const e of (classroom.scores ?? [])) {
    existingMap.set(e.studentId, { ...e });
  }

  for (const s of scores) {
    const prev = existingMap.get(s.studentId);
    if (prev) {
      prev.totalScore += s.totalScore;
      prev.correctCount += s.correctCount;
      prev.wrongCount += s.wrongCount;
      prev.studentName = s.studentName; // keep latest name
    } else {
      existingMap.set(s.studentId, { ...s });
    }
  }

  classroom.scores = Array.from(existingMap.values()).sort((a, b) => b.totalScore - a.totalScore);
  classroom.totalQuestionsAsked = (classroom.totalQuestionsAsked ?? 0) + (totalQuestionsAsked ?? 0);

  // Clear active quiz state from DB (in case any legacy fields remain)
  classroom.activeQuiz = undefined;
  classroom.pendingQuiz = undefined;
  classroom.quizCountdown = undefined;

  classroom.markModified('scores');
  await classroom.save();

  return NextResponse.json({ ok: true, scores: classroom.scores });
}
