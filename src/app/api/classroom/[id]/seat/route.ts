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

  // Atomic update: only succeeds if no OTHER participant currently occupies (row, col).
  // This prevents the race condition where two students click the same seat simultaneously.
  const result = await Classroom.updateOne(
    {
      _id: id,
      'participants.studentId': userId,           // match participant to update via $ operator
      participants: {
        $not: {
          $elemMatch: { studentId: { $ne: userId }, seatRow: row, seatCol: col },
        },
      },
    },
    {
      $set: {
        'participants.$.seatRow': row,
        'participants.$.seatCol': col,
        'participants.$.lastSeen': new Date(),
      },
    },
  );

  if (result.modifiedCount === 0) {
    return NextResponse.json({ error: 'Chỗ này đã có người ngồi' }, { status: 409 });
  }

  return NextResponse.json({ message: 'Đã chuyển chỗ ngồi' });
}
