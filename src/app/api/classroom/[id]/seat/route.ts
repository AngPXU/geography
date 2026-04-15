import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';

type Params = { params: Promise<{ id: string }> };

// POST /api/classroom/[id]/seat  — move to a seat
export async function POST(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { row, col } = await req.json() as { row: number; col: number };

  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });

  const userId = user._id.toString();
  const participant = classroom.participants.find((p) => p.studentId === userId);
  if (!participant) return NextResponse.json({ error: 'Bạn chưa ở trong lớp học này' }, { status: 403 });

  // Validate bounds
  if (row < 0 || row >= classroom.rows || col < 0 || col >= classroom.cols) {
    return NextResponse.json({ error: 'Vị trí không hợp lệ' }, { status: 400 });
  }

  // Check if seat is taken by someone else
  const seatTaken = classroom.participants.some(
    (p) => p.studentId !== userId && p.seatRow === row && p.seatCol === col,
  );
  if (seatTaken) return NextResponse.json({ error: 'Chỗ này đã có người ngồi' }, { status: 409 });

  participant.seatRow = row;
  participant.seatCol = col;
  participant.lastSeen = new Date();
  await classroom.save();

  return NextResponse.json({ message: 'Đã chuyển chỗ ngồi' });
}
