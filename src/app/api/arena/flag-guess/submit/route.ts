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
    const { correct, total } = body;

    if (typeof correct !== 'number' || typeof total !== 'number' || total === 0) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    await dbConnect();

    // Quy đổi sang thang 0–10000 (khớp schema hiện tại)
    const score = Math.round((correct / total) * 10000);
    const expEarned = 50; // Luôn cộng 50 EXP sau mỗi lượt chơi

    await ArenaMatchHistory.create({
      username:  session.user.name,
      gameMode:  'flag-guess',
      topic:     'flag-guess',
      score,
      expEarned,
    });

    await User.updateOne(
      { username: session.user.name },
      { $inc: { exp: expEarned } }
    );

    return NextResponse.json({ success: true, expEarned, score });
  } catch (error: any) {
    console.error('[flag-guess/submit] Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
