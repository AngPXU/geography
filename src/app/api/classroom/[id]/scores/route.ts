import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

// ── GET /api/classroom/[id]/scores ─────────────────────────────────────────
// Returns current scores for all students in the classroom.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id).select('teacherId participants scores totalQuestionsAsked kickedIds').lean();
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const uid = session.user.id;
  const isTeacher = classroom.teacherId === uid;
  const isParticipant = classroom.participants.some((p: { studentId: string }) => p.studentId === uid);
  if (!isTeacher && !isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Build online set for quick lookup
  const onlineIds = new Set(classroom.participants.map((p: { studentId: string }) => p.studentId));

  return NextResponse.json({
    scores: classroom.scores ?? [],
    totalQuestionsAsked: classroom.totalQuestionsAsked ?? 0,
    participantCount: classroom.participants.length,
    onlineIds: [...onlineIds],
    kickedIds: classroom.kickedIds ?? [],
  });
}

// ── PATCH /api/classroom/[id]/scores (unused — kept for compatibility) ──────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const body = await req.json() as {
    correctAnswerers: { studentId: string; studentName: string }[];
    wrongAnswerers: { studentId: string; studentName: string }[];
  };

  const { correctAnswerers = [], wrongAnswerers = [] } = body;
  const N = correctAnswerers.length; // highest score possible = N

  // Upsert each correct answerer
  correctAnswerers.forEach((s, idx) => {
    const pts = N - idx; // fastest = N pts, next = N-1, ...
    const existing = classroom.scores.find((sc: { studentId: string }) => sc.studentId === s.studentId);
    if (existing) {
      existing.totalScore += pts;
      existing.correctCount += 1;
    } else {
      classroom.scores.push({ studentId: s.studentId, studentName: s.studentName, totalScore: pts, correctCount: 1, wrongCount: 0 });
    }
  });

  // Upsert wrong answerers (no points)
  wrongAnswerers.forEach((s) => {
    const existing = classroom.scores.find((sc: { studentId: string }) => sc.studentId === s.studentId);
    if (existing) {
      existing.wrongCount += 1;
    } else {
      classroom.scores.push({ studentId: s.studentId, studentName: s.studentName, totalScore: 0, correctCount: 0, wrongCount: 1 });
    }
  });

  classroom.totalQuestionsAsked += 1;
  await classroom.save();

  return NextResponse.json({ ok: true, totalQuestionsAsked: classroom.totalQuestionsAsked });
}

// ── DELETE /api/classroom/[id]/scores ─────────────────────────────────────
// Teacher resets all scores.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  classroom.scores = [];
  classroom.totalQuestionsAsked = 0;
  await classroom.save();

  return NextResponse.json({ ok: true });
}
