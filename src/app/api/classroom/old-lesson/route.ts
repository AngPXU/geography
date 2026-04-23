import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import OldLessonCheck from '@/models/OldLessonCheck';

// ── GET: Lấy danh sách kiểm tra bài cũ của giáo viên ──────────────────────────
export async function GET() {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Học sinh không thể xem danh sách này, chỉ giáo viên mới được xem của mình
  if (user.role !== 2 && user.role !== 1) {
    return NextResponse.json({ error: 'Chỉ giáo viên mới có thể xem danh sách kiểm tra bài cũ' }, { status: 403 });
  }

  const userId = user._id.toString();
  const checks = await OldLessonCheck.find({ teacherId: userId }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ checks });
}

// ── POST: Tạo bộ kiểm tra bài cũ mới ──────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  if (user.role !== 2 && user.role !== 1) {
    return NextResponse.json({ error: 'Chỉ giáo viên mới có thể tạo kiểm tra bài cũ' }, { status: 403 });
  }

  const { title, classId, questions } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Tiêu đề không được để trống' }, { status: 400 });
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'Phải có ít nhất 1 câu hỏi' }, { status: 400 });
  }

  const check = await OldLessonCheck.create({
    teacherId: user._id.toString(),
    classId: classId || undefined,
    title: title.trim(),
    questions,
  });

  return NextResponse.json({ check }, { status: 201 });
}
