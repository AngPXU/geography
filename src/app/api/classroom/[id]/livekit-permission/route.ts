import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { RoomServiceClient } from 'livekit-server-sdk';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

function getLivekitClient() {
  const wsUrl = process.env.LIVEKIT_WS_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_WS_URL ?? '';
  const apiKey = process.env.LIVEKIT_API_KEY ?? '';
  const apiSecret = process.env.LIVEKIT_API_SECRET ?? '';
  // RoomServiceClient cần HTTPS URL (không phải wss://)
  const host = wsUrl.replace(/^wss?:\/\//, 'https://');
  return new RoomServiceClient(host, apiKey, apiSecret);
}

// POST /api/classroom/[id]/livekit-permission
// Body: { participantIdentity: string, canPublish: boolean }
// Chỉ giáo viên mới được gọi — dùng để cho phép / tắt mic học sinh
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    return NextResponse.json({ error: 'LiveKit chưa được cấu hình' }, { status: 503 });
  }

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = user._id.toString();
  const isTeacher = classroom.teacherId === userId || user.role === 1 || user.role === 2;
  if (!isTeacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { participantIdentity, canPublish } = await req.json() as {
    participantIdentity: string;
    canPublish: boolean;
  };

  const roomName = `cls-${id}`;
  const svc = getLivekitClient();

  await svc.updateParticipant(roomName, participantIdentity, undefined, {
    canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  return NextResponse.json({ ok: true });
}

// POST /api/classroom/[id]/livekit-permission?action=mute-all
// Tắt quyền publish của tất cả học sinh trong phòng
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
    return NextResponse.json({ error: 'LiveKit chưa được cấu hình' }, { status: 503 });
  }

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = user._id.toString();
  const isTeacher = classroom.teacherId === userId || user.role === 1 || user.role === 2;
  if (!isTeacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const roomName = `cls-${id}`;
  const svc = getLivekitClient();
  const teacherId = userId;

  // Lấy danh sách participants hiện tại trong phòng
  let participants: { identity: string }[] = [];
  try {
    participants = await svc.listParticipants(roomName);
  } catch {
    // Phòng chưa có ai hoặc chưa tồn tại → không sao
    return NextResponse.json({ ok: true, revoked: 0 });
  }

  // Tắt publish của tất cả trừ giáo viên
  const studentParticipants = participants.filter((p) => p.identity !== teacherId);
  await Promise.allSettled(
    studentParticipants.map((p) =>
      svc.updateParticipant(roomName, p.identity, undefined, {
        canPublish: false,
        canSubscribe: true,
        canPublishData: true,
      }),
    ),
  );

  return NextResponse.json({ ok: true, revoked: studentParticipants.length });
}
