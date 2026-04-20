import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import ScreenSignal from '@/models/ScreenSignal';

// POST: gửi signal WebRTC
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: classroomId } = await params;
  const body = await req.json();
  const { type, payload, targetUsername } = body;

  await dbConnect();

  // Only broadcast signals (announce/stop) clear the room — targeted signals stay
  if (type === 'announce' || type === 'stop') {
    await ScreenSignal.deleteMany({ classroomId });
  }

  // Avoid duplicating request-offer from same viewer
  if (type === 'request-offer') {
    await ScreenSignal.deleteMany({ classroomId, senderUsername: session.user.name, type: 'request-offer' });
  }

  await ScreenSignal.create({
    classroomId,
    senderUsername: session.user.name,
    targetUsername: targetUsername || undefined,
    type,
    payload,
  });

  return NextResponse.json({ success: true });
}

// GET: poll signals dành cho user này
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id: classroomId } = await params;
  const username = session.user.name;

  await dbConnect();

  const signals = await ScreenSignal.find({
    classroomId,
    senderUsername: { $ne: username },
    $or: [
      { targetUsername: { $exists: false } },
      { targetUsername: null },
      { targetUsername: username },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({ signals });
}
