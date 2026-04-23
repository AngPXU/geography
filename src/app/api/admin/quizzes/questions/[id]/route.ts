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

// PUT /api/admin/quizzes/questions/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await dbConnect();
    const body = await req.json();
    const { id } = await params;
    const q = await QuizQuestion.findByIdAndUpdate(id, body, { new: true });
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ question: q });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/quizzes/questions/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAuth())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await dbConnect();
    const { id } = await params;
    const q = await QuizQuestion.findByIdAndDelete(id);
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
