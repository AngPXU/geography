import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import FlashcardCard from '@/models/FlashcardCard';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// PUT — update a card
export async function PUT(request: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  await dbConnect();

  const body = await request.json();
  const { grade, lessonId, lessonTitle, lessonIcon, front, back, hint } = body;

  if (!grade || !lessonId || !lessonTitle || !front || !back) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
  }

  const card = await FlashcardCard.findByIdAndUpdate(
    id,
    {
      grade: Number(grade),
      lessonId: String(lessonId).trim(),
      lessonTitle: String(lessonTitle).trim(),
      lessonIcon: String(lessonIcon || '📚').trim(),
      front: String(front).trim(),
      back: String(back).trim(),
      hint: hint ? String(hint).trim() : undefined,
    },
    { new: true, runValidators: true }
  );

  if (!card) {
    return NextResponse.json({ error: 'Không tìm thấy thẻ' }, { status: 404 });
  }

  return NextResponse.json({ card });
}

// DELETE — delete a single card
export async function DELETE(_: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  await dbConnect();

  const card = await FlashcardCard.findByIdAndDelete(id);
  if (!card) {
    return NextResponse.json({ error: 'Không tìm thấy thẻ' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
