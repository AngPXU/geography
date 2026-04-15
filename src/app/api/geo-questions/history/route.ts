import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import GeoQAHistory from '@/models/GeoQAHistory';

export async function GET() {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ items: [] });
  }

  await dbConnect();
  const items = await GeoQAHistory.find({ username: session.user.name })
    .sort({ askedAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ items });
}
