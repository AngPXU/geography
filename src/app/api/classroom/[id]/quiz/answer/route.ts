import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import Classroom from '@/models/Classroom';

// POST /api/classroom/[id]/quiz/answer
// Body: { answer: 'A' | 'B' | 'C' | 'D', questionIndex: number }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
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

  const uid = session.user.id;

  // Check if already answered
  const alreadyAnswered = quiz.currentAnswers.some(
    (a: { studentId: string }) => a.studentId === uid,
  );
  if (alreadyAnswered) {
    return NextResponse.json({ error: 'Already answered' }, { status: 409 });
  }

  // Get student name from scores roster or participants
  const scoreEntry = classroom.scores.find((s: { studentId: string }) => s.studentId === uid);
  const participant = classroom.participants.find((p: { studentId: string }) => p.studentId === uid);
  const studentName = scoreEntry?.studentName ?? participant?.studentName ?? 'Ẩn danh';

  quiz.currentAnswers.push({
    studentId: uid,
    studentName,
    answer,
    answeredAt: new Date(),
  });

  classroom.markModified('activeQuiz');
  await classroom.save();

  return NextResponse.json({ ok: true });
}
