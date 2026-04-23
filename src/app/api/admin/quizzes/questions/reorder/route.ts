import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import QuizQuestion from '@/models/QuizQuestion';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) return false;
  if ((session.user as any).role > 2) return false;
  return true;
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { updates } = await req.json(); // [{ id, order }]
    if (!Array.isArray(updates)) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    await dbConnect();
    const ops = updates.map(u => ({
      updateOne: {
        filter: { _id: u.id },
        update: { $set: { order: u.order } }
      }
    }));
    await QuizQuestion.bulkWrite(ops);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
