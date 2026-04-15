import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

// ── Helper: resolve teacher userId ────────────────────────────────────────────
async function resolveTeacher(sessionName: string | null | undefined, classroom: InstanceType<typeof Classroom>) {
  if (!sessionName) return null;
  const user = await User.findOne({ username: sessionName });
  if (!user || classroom.teacherId !== user._id.toString()) return null;
  return user;
}

// ── Helper: advance question accounting ──────────────────────────────────────
// Scores are applied at answer time; here we just track questions asked.
function applyQuestionScore(classroom: InstanceType<typeof Classroom>) {
  classroom.totalQuestionsAsked += 1;
}

// ── POST: start a new quiz (teacher only) ─────────────────────────────────────
// Body: { questions: IQuizQuestion[], questionDuration?: number }
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const teacher = await resolveTeacher(session.user.name, classroom);
  if (!teacher) return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });

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
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const teacher = await resolveTeacher(session.user.name, classroom);
  if (!teacher) return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });

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
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const user = await User.findOne({ username: session.user.name });
  if (!user || classroom.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  classroom.activeQuiz = undefined;
  classroom.quizCountdown = undefined;
  classroom.pendingQuiz = undefined;
  classroom.markModified('activeQuiz');
  classroom.markModified('quizCountdown');
  classroom.markModified('pendingQuiz');
  await classroom.save();
  return NextResponse.json({ ok: true });
}
