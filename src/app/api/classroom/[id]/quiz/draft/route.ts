import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

// PUT /api/classroom/[id]/quiz/draft
// Body: { questions, questionDuration }
// Saves teacher's draft questions to DB — persists across refreshes, scoped per classroom
export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  const { questions, questionDuration = 10 } = await req.json();
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'Cần ít nhất 1 câu hỏi' }, { status: 400 });
  }

  classroom.draftQuiz = { questions, questionDuration };
  classroom.markModified('draftQuiz');
  await classroom.save();

  return NextResponse.json({ ok: true });
}

// DELETE /api/classroom/[id]/quiz/draft — clear draft
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (classroom.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  classroom.draftQuiz = undefined;
  classroom.markModified('draftQuiz');
  await classroom.save();

  return NextResponse.json({ ok: true });
}
