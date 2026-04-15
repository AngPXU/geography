import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

// POST /api/classroom/[id]/quiz/countdown
// Body: { questions, questionDuration, countdownSecs? }
// Saves pending quiz + countdown to DB so all clients can see it via polling
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  const { questions, questionDuration = 10, countdownSecs = 10 } = await req.json();
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'Cần ít nhất 1 câu hỏi' }, { status: 400 });
  }

  classroom.pendingQuiz = { questions, questionDuration };
  classroom.quizCountdown = {
    startedAt: new Date(),
    countdownSecs,
    questionCount: questions.length,
    questionDuration,
  };
  classroom.markModified('pendingQuiz');
  classroom.markModified('quizCountdown');
  await classroom.save();

  return NextResponse.json({ ok: true });
}

// DELETE /api/classroom/[id]/quiz/countdown — cancel countdown
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  classroom.quizCountdown = undefined;
  classroom.pendingQuiz = undefined;
  classroom.markModified('quizCountdown');
  classroom.markModified('pendingQuiz');
  await classroom.save();

  return NextResponse.json({ ok: true });
}
