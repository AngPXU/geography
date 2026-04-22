import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';
import ChatMessage from '@/models/ChatMessage';

type Params = { params: Promise<{ id: string }> };

// ── GET: last 100 messages ────────────────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

  const userId = user._id.toString();
  const isTeacher = classroom.teacherId === userId;
  const isParticipant = classroom.participants.some((p) => p.studentId === userId);
  if (!isTeacher && !isParticipant) {
    return NextResponse.json({ error: 'Bạn không ở trong lớp học này' }, { status: 403 });
  }

  const messages = await ChatMessage.find({ classroomId: id })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  return NextResponse.json({ messages });
}

// ── POST: send a message ──────────────────────────────────────────────────────
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as {
    text: string;
    replyTo?: { messageId: string; senderName: string; text: string };
  };

  if (!body.text?.trim()) {
    return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 });
  }
  if (body.text.length > 1000) {
    return NextResponse.json({ error: 'Tin nhắn quá dài (tối đa 1000 ký tự)' }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOne({ username: session.user.name }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id).lean();
  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

  const userId = user._id.toString();
  const isTeacher = classroom.teacherId === userId;
  const isParticipant = classroom.participants.some((p) => p.studentId === userId);
  if (!isTeacher && !isParticipant) {
    return NextResponse.json({ error: 'Bạn không ở trong lớp học này' }, { status: 403 });
  }

  const msg = await ChatMessage.create({
    classroomId: id,
    senderId: userId,
    senderName: user.fullName || user.username,
    senderAvatar: user.avatar,
    senderRole: user.role,
    text: body.text.trim(),
    replyTo: body.replyTo ?? undefined,
  });

  return NextResponse.json({ message: msg }, { status: 201 });
}
