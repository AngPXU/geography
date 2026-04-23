import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import QuizSet from '@/models/QuizSet';
import QuizQuestion from '@/models/QuizQuestion';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) return false;
  if ((session.user as any).role > 2) return false;
  return true;
}

// PATCH /api/admin/quizzes/sets/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    const set = await QuizSet.findByIdAndUpdate(id, body, { new: true });
    if (!set) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ set });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/quizzes/sets/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await dbConnect();
    const { id } = await params;
    const set = await QuizSet.findById(id);
    if (!set) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await QuizQuestion.deleteMany({ quizSetId: set._id });
    await QuizSet.findByIdAndDelete(set._id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
