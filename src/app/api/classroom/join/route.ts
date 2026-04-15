import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';
import bcrypt from 'bcryptjs';

// POST /api/classroom/join  — student joins by room code + optional password
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code, password } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: 'Vui lòng nhập mã phòng' }, { status: 400 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findOne({ code: code.trim().toUpperCase(), isActive: true });
  if (!classroom) return NextResponse.json({ error: 'Không tìm thấy phòng học' }, { status: 404 });

  // Check password
  if (classroom.passwordHash) {
    if (!password) return NextResponse.json({ error: 'Phòng học có mật khẩu, vui lòng nhập' }, { status: 403 });
    const ok = await bcrypt.compare(password, classroom.passwordHash);
    if (!ok) return NextResponse.json({ error: 'Mật khẩu phòng không đúng' }, { status: 403 });
  }

  const userId = user._id.toString();

  // Prune stale participants (lastSeen > 10 min)
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  classroom.participants = classroom.participants.filter(
    (p) => p.studentId === userId || p.lastSeen > staleThreshold,
  );

  // Update existing or add new participant
  const existing = classroom.participants.find((p) => p.studentId === userId);
  if (existing) {
    existing.lastSeen = new Date();
    existing.studentName = user.fullName || user.username;
    existing.studentAvatar = user.avatar;
  } else {
    classroom.participants.push({
      studentId: userId,
      studentName: user.fullName || user.username,
      studentAvatar: user.avatar,
      seatRow: -1,
      seatCol: -1,
      lastSeen: new Date(),
    });
  }

  await classroom.save();

  // Ensure student is in scores roster (persistent, even after leaving)
  const inScores = classroom.scores.some((s: { studentId: string }) => s.studentId === userId);
  if (!inScores) {
    classroom.scores.push({ studentId: userId, studentName: user.fullName || user.username, totalScore: 0, correctCount: 0, wrongCount: 0 });
    await classroom.save();
  }

  return NextResponse.json({ classroom });
}
