import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import FlashcardCard from '@/models/FlashcardCard';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, newUsers, totalFlashcards] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    FlashcardCard.countDocuments(),
  ]);

  return NextResponse.json({ totalUsers, newUsers, totalFlashcards });
}
