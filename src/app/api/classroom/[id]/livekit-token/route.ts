import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AccessToken } from 'livekit-server-sdk';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

// POST /api/classroom/[id]/livekit-token
// Trả về JWT token để client kết nối vào LiveKit room
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit chưa được cấu hình trên server' }, { status: 503 });
  }

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = user._id.toString();
  const isTeacher = classroom.teacherId === userId || user.role === 1 || user.role === 2;
  const isParticipant = classroom.participants.some(
    (p: { studentId: string }) => p.studentId === userId,
  );

  if (!isTeacher && !isParticipant) {
    return NextResponse.json({ error: 'Không có quyền vào phòng học này' }, { status: 403 });
  }

  const roomName = `cls-${id}`;
  const displayName: string = (user.fullName as string | undefined) || (user.username as string);

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: displayName,
    ttl: '2h',
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    // Giáo viên có thể publish ngay; học sinh KHÔNG publish cho đến khi được cấp quyền
    canPublish: isTeacher,
    canSubscribe: true,
    // Tất cả được gửi data messages (raise hand, v.v.)
    canPublishData: true,
  });

  const token = await at.toJwt();
  return NextResponse.json({ token, roomName, isTeacher, displayName });
}
