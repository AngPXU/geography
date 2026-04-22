import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { notify } from '@/utils/notificationService';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { opponentUsername, topic, roomCode } = await req.json();
    if (!opponentUsername) return NextResponse.json({ error: 'Missing opponent' }, { status: 400 });

    const opponent = await User.findOne({ username: opponentUsername }).lean();
    if (!opponent) return NextResponse.json({ error: 'Người chơi không tồn tại' }, { status: 404 });

    await notify(
      opponent._id.toString(),
      'ARENA_INVITE',
      '⚔️ Lời mời thách đấu',
      `Người chơi ${session.user.name} đã mời bạn tham gia đấu trường chủ đề "${topic || 'Tự do'}".`,
      `/arena?room=${roomCode}`,
      (session.user as any).id
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Arena invite error', err);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
