import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

// POST /api/classroom/[id]/quiz/answer
// Body: { answer: 'A' | 'B' | 'C' | 'D', questionIndex: number }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const uid = user._id.toString();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const quiz = classroom.activeQuiz;
  if (!quiz || quiz.isFinished) {
    return NextResponse.json({ error: 'No active quiz' }, { status: 400 });
  }
  if (quiz.isPaused) {
    return NextResponse.json({ error: 'Quiz is paused' }, { status: 400 });
  }

  const { answer, questionIndex } = await req.json() as { answer: 'A' | 'B' | 'C' | 'D'; questionIndex: number };

  // Validate answer
  if (!['A', 'B', 'C', 'D'].includes(answer)) {
    return NextResponse.json({ error: 'Invalid answer' }, { status: 400 });
  }

  // Ensure client is answering the current question (race condition guard)
  if (questionIndex !== quiz.currentIndex) {
    return NextResponse.json({ error: 'Question already advanced' }, { status: 409 });
  }

  // Check if already answered
  const alreadyAnswered = quiz.currentAnswers.some(
    (a: { studentId: string }) => a.studentId === uid,
  );
  if (alreadyAnswered) {
    return NextResponse.json({ error: 'Already answered' }, { status: 409 });
  }

  // Get student name from scores roster or participants
  const existingRoster = classroom.scores.find((s: { studentId: string }) => s.studentId === uid);
  const participant = classroom.participants.find((p: { studentId: string }) => p.studentId === uid);
  const studentName = existingRoster?.studentName ?? participant?.studentName ?? 'Ẩn danh';

  // ── Rank-based scoring ────────────────────────────────────────────────────
  // Đếm TRƯỚC khi push → đây là số người đã trả lời đúng trước mình (0 = mình là người đầu tiên)
  const correct = quiz.questions[quiz.currentIndex]?.correct;
  const isCorrect = answer === correct;
  const participantCount = Math.max(classroom.participants.length, 1);
  const correctBeforeMe = quiz.currentAnswers.filter(
    (a: { answer: string }) => a.answer === correct,
  ).length; // 0 = first correct, 1 = second correct, ...
  const earnedPoints = isCorrect
    ? Math.max(1, participantCount - correctBeforeMe)
    : 0;

  // Push sau khi đã tính xong rank
  quiz.currentAnswers.push({
    studentId: uid,
    studentName,
    answer,
    answeredAt: new Date(),
  });

  const scoreEntry = classroom.scores.find((s: { studentId: string }) => s.studentId === uid);
  if (scoreEntry) {
    if (isCorrect) { scoreEntry.totalScore += earnedPoints; scoreEntry.correctCount += 1; }
    else { scoreEntry.wrongCount += 1; }
  } else {
    classroom.scores.push({
      studentId: uid,
      studentName,
      totalScore: earnedPoints,
      correctCount: isCorrect ? 1 : 0,
      wrongCount: isCorrect ? 0 : 1,
    });
  }
  classroom.markModified('scores');
  classroom.markModified('activeQuiz');
  await classroom.save();

  return NextResponse.json({ ok: true, isCorrect, earnedPoints });
}
