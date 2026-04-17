import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import FlashcardCard from '@/models/FlashcardCard';
import mongoose from 'mongoose';

// PATCH — bulk reorder cards: body = { updates: [{id, order}] }
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const updates: { id: string; order: number }[] = body.updates ?? [];

  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
  }

  // Validate all IDs
  for (const u of updates) {
    if (!mongoose.isValidObjectId(u.id)) {
      return NextResponse.json({ error: `Invalid id: ${u.id}` }, { status: 400 });
    }
  }

  await dbConnect();

  await Promise.all(
    updates.map(({ id, order }) =>
      FlashcardCard.findByIdAndUpdate(id, { $set: { order } })
    )
  );

  return NextResponse.json({ success: true, updated: updates.length });
}
