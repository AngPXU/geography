import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

// POST /api/classroom/[id]/heartbeat  — keep alive + prune stale
export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const userId = user._id.toString();

  // Prune stale (> 10 min)
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  classroom.participants = classroom.participants.filter((p) => p.lastSeen > staleThreshold);

  const participant = classroom.participants.find((p) => p.studentId === userId);
  if (participant) {
    participant.lastSeen = new Date();
  }

  await classroom.save();
  return NextResponse.json({ ok: true });
}
