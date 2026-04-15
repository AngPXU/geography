import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

// ── GET: classroom detail (prunes stale participants) ─────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });

  const userId = user._id.toString();
  const isTeacher = classroom.teacherId === userId;
  const isParticipant = classroom.participants.some((p) => p.studentId === userId);
  if (!isTeacher && !isParticipant) {
    return NextResponse.json({ error: 'Bạn không ở trong lớp học này' }, { status: 403 });
  }

  // Prune stale (> 10 min)
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  const before = classroom.participants.length;
  classroom.participants = classroom.participants.filter((p) => p.lastSeen > staleThreshold);
  if (classroom.participants.length !== before) await classroom.save();

  return NextResponse.json({ classroom });
}

// ── PATCH: update classroom (teacher only) ────────────────────────────────────
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
  if (classroom.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Chỉ giáo viên mới có thể chỉnh sửa' }, { status: 403 });
  }

  const body = await req.json() as Record<string, string | undefined>;
  if (body.name !== undefined)         classroom.name = body.name || classroom.name;
  if (body.subject !== undefined)      classroom.subject = body.subject || undefined;
  if (body.description !== undefined)  classroom.description = body.description || undefined;
  if (body.announcement !== undefined) classroom.announcement = body.announcement || undefined;

  await classroom.save();
  return NextResponse.json({ classroom });
}

// ── DELETE: remove classroom (teacher only) ───────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });
  if (classroom.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Không có quyền xóa' }, { status: 403 });
  }

  await Classroom.findByIdAndDelete(id);
  return NextResponse.json({ message: 'Đã xóa lớp học' });
}
