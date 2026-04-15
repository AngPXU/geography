import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

// ── Helper: apply scoring for current question ────────────────────────────────
function applyQuestionScore(classroom: InstanceType<typeof Classroom>) {
  const quiz = classroom.activeQuiz;
  if (!quiz || quiz.isFinished) return;

  const correct = quiz.questions[quiz.currentIndex]?.correct;
  if (!correct) return;

  const correctAnswerers = quiz.currentAnswers
    .filter((a: { answer: string }) => a.answer === correct)
    .sort((a: { answeredAt: Date }, b: { answeredAt: Date }) =>
      new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime(),
    );

  const wrongAnswerers = quiz.currentAnswers.filter(
    (a: { answer: string }) => a.answer !== correct,
  );

  const N = correctAnswerers.length;

  correctAnswerers.forEach((a: { studentId: string; studentName: string }, idx: number) => {
    const pts = N - idx;
    const existing = classroom.scores.find((s: { studentId: string }) => s.studentId === a.studentId);
    if (existing) {
      existing.totalScore += pts;
      existing.correctCount += 1;
    } else {
      classroom.scores.push({ studentId: a.studentId, studentName: a.studentName, totalScore: pts, correctCount: 1, wrongCount: 0 });
    }
  });

  wrongAnswerers.forEach((a: { studentId: string; studentName: string }) => {
    const existing = classroom.scores.find((s: { studentId: string }) => s.studentId === a.studentId);
    if (existing) {
      existing.wrongCount += 1;
    } else {
      classroom.scores.push({ studentId: a.studentId, studentName: a.studentName, totalScore: 0, correctCount: 0, wrongCount: 1 });
    }
  });

  classroom.totalQuestionsAsked += 1;
}

// ── POST: start a new quiz (teacher only) ─────────────────────────────────────
// Body: { questions: IQuizQuestion[], questionDuration?: number }
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  const { questions, questionDuration = 10 } = await req.json();
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'Cần ít nhất 1 câu hỏi' }, { status: 400 });
  }

  classroom.activeQuiz = {
    questions,
    currentIndex: 0,
    currentQuestionStartedAt: new Date(),
    isPaused: false,
    pausedTimeRemaining: questionDuration,
    currentAnswers: [],
    isFinished: false,
    questionDuration,
  };

  await classroom.save();
  return NextResponse.json({ ok: true, activeQuiz: classroom.activeQuiz });
}

// ── PATCH: control quiz (teacher only) ───────────────────────────────────────
// Body: { action: 'pause' | 'resume' | 'next' | 'finish' }
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  const quiz = classroom.activeQuiz;
  if (!quiz) return NextResponse.json({ error: 'No active quiz' }, { status: 400 });

  const { action } = await req.json() as { action: 'pause' | 'resume' | 'next' | 'finish' };

  if (action === 'pause') {
    const elapsed = (Date.now() - new Date(quiz.currentQuestionStartedAt).getTime()) / 1000;
    quiz.isPaused = true;
    quiz.pausedTimeRemaining = Math.max(0, quiz.questionDuration - elapsed);

  } else if (action === 'resume') {
    // Adjust startedAt so remaining = pausedTimeRemaining
    quiz.isPaused = false;
    quiz.currentQuestionStartedAt = new Date(
      Date.now() - (quiz.questionDuration - quiz.pausedTimeRemaining) * 1000,
    );

  } else if (action === 'next') {
    applyQuestionScore(classroom);
    const isLast = quiz.currentIndex + 1 >= quiz.questions.length;
    if (isLast) {
      quiz.isFinished = true;
    } else {
      quiz.currentIndex += 1;
      quiz.currentQuestionStartedAt = new Date();
      quiz.isPaused = false;
      quiz.currentAnswers = [];
    }

  } else if (action === 'finish') {
    applyQuestionScore(classroom);
    quiz.isFinished = true;
  }

  classroom.markModified('activeQuiz');
  classroom.markModified('scores');
  await classroom.save();
  return NextResponse.json({ ok: true, activeQuiz: classroom.activeQuiz });
}

// ── DELETE: end and clear quiz ────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  classroom.activeQuiz = undefined;
  classroom.markModified('activeQuiz');
  await classroom.save();
  return NextResponse.json({ ok: true });
}
