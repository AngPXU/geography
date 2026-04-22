import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';
import bcrypt from 'bcryptjs';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── GET: list classrooms for current user ─────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const userId = user._id.toString();

  let classrooms;
  if (user.role === 2 || user.role === 1) {
    // Teacher: their own classrooms
    classrooms = await Classroom.find({ teacherId: userId, isActive: true }).sort({ updatedAt: -1 }).lean();
  } else {
    // Student: classrooms they're in
    classrooms = await Classroom.find({
      'participants.studentId': userId,
      isActive: true,
    }).sort({ updatedAt: -1 }).lean();
  }

  return NextResponse.json({
    classrooms: classrooms.map((c: any) => {
      const onlineThreshold = new Date(Date.now() - 2 * 60 * 1000); // 2 min window
      const onlineCount = c.participants.filter(
        (p: { lastSeen: Date }) => new Date(p.lastSeen) > onlineThreshold,
      ).length;
      const teacherOnline = c.teacherLastSeen
        ? new Date(c.teacherLastSeen) > onlineThreshold
        : false;
      return { ...c, onlineCount, teacherOnline };
    }),
  });
}

// ── POST: create a classroom (teacher only) ───────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.role !== 2 && user.role !== 1) {
    return NextResponse.json({ error: 'Chỉ giáo viên mới có thể tạo lớp học' }, { status: 403 });
  }

  const { name, subject, description, password, rows, cols } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Tên lớp học không được trống' }, { status: 400 });

  // Generate unique code
  let code = generateCode();
  let attempts = 0;
  while (attempts < 10) {
    const exists = await Classroom.findOne({ code });
    if (!exists) break;
    code = generateCode();
    attempts++;
  }

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  const classroom = await Classroom.create({
    name: name.trim(),
    code,
    passwordHash,
    teacherId: user._id.toString(),
    teacherName: user.fullName || user.username,
    teacherAvatar: user.avatar,
    subject: subject?.trim() || undefined,
    description: description?.trim() || undefined,
    rows: Math.min(Math.max(Number(rows) || 5, 2), 8),
    cols: Math.min(Math.max(Number(cols) || 6, 2), 8),
  });

  return NextResponse.json({ classroom }, { status: 201 });
}
