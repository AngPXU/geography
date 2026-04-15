import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/utils/db';
import Classroom from '@/models/Classroom';

// POST /api/classroom/[id]/kick — teacher removes a student from the room
// Body: { studentId: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden — teacher only' }, { status: 403 });
  }

  const { studentId } = await req.json() as { studentId: string };
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  // Remove from participants (kicks them off active seat)
  classroom.participants = classroom.participants.filter(
    (p: { studentId: string }) => p.studentId !== studentId,
  );

  // Track in kickedIds so student's client can detect being kicked
  if (!classroom.kickedIds.includes(studentId)) {
    classroom.kickedIds.push(studentId);
  }

  await classroom.save();
  return NextResponse.json({ ok: true });
}
