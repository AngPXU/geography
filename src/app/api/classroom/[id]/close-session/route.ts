import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

// POST /api/classroom/[id]/close-session
// Giáo viên kết thúc buổi học → tất cả học sinh bị thoát, LiveKit room bị xóa
export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isTeacher = classroom.teacherId === user._id.toString() || user.role === 1 || user.role === 2;
  if (!isTeacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Đánh dấu buổi học đã kết thúc — học sinh sẽ phát hiện qua polling
  classroom.sessionEndedAt = new Date();
  classroom.liveSessionActive = false; // đảm bảo condition sessionEnded hoạt động đúng
  // Xóa toàn bộ participants để heartbeat/prune không tự restore
  classroom.participants = [];
  // Reset teacherLastSeen
  classroom.teacherLastSeen = undefined;
  await classroom.save();

  // Xóa LiveKit room để disconnect tất cả ngay lập tức (best-effort)
  const apiKey    = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl     = process.env.LIVEKIT_WS_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_WS_URL ?? '';

  if (apiKey && apiSecret && wsUrl) {
    try {
      const { RoomServiceClient } = await import('livekit-server-sdk');
      const host = wsUrl.replace(/^wss?:\/\//, 'https://');
      const svc = new RoomServiceClient(host, apiKey, apiSecret);
      await svc.deleteRoom(`cls-${id}`);
    } catch {
      // LiveKit room có thể chưa tồn tại — bỏ qua
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/classroom/[id]/close-session
// Giáo viên mở lại buổi học mới → xóa flag sessionEndedAt
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isTeacher = classroom.teacherId === user._id.toString() || user.role === 1 || user.role === 2;
  if (!isTeacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  classroom.sessionEndedAt = undefined;
  await classroom.save();

  return NextResponse.json({ ok: true });
}
