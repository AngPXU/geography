import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import ArenaMatchHistory from '@/models/ArenaMatchHistory';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { setId, elapsed, total } = body;

    if (!setId || typeof elapsed !== 'number' || typeof total !== 'number') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    await dbConnect();

    // Quy đổi thành điểm: hoàn thành nhanh = điểm cao (max 10000)
    // Dưới 60s = 10000, dưới 180s = 7000, dưới 300s = 5000, còn lại = 3000
    const score = elapsed < 60 ? 10000 : elapsed < 180 ? 7000 : elapsed < 300 ? 5000 : 3000;
    const expEarned = 50;

    await ArenaMatchHistory.create({
      username:  session.user.name,
      gameMode:  'map-puzzle',
      topic:     setId,
      score,
      expEarned,
    });

    await User.updateOne(
      { username: session.user.name },
      { $inc: { exp: expEarned } }
    );

    return NextResponse.json({ success: true, expEarned, score });
  } catch (error: any) {
    console.error('[puzzle/submit] Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
