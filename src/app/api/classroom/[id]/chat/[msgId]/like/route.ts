import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import ChatMessage from '@/models/ChatMessage';

type Params = { params: Promise<{ id: string; msgId: string }> };

// POST /api/classroom/[id]/chat/[msgId]/like — toggle like
export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { msgId } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const userId = user._id.toString();
  const msg = await ChatMessage.findById(msgId);
  if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

  const alreadyLiked = msg.likes.includes(userId);
  if (alreadyLiked) {
    msg.likes = msg.likes.filter((uid) => uid !== userId);
  } else {
    msg.likes.push(userId);
  }
  await msg.save();

  return NextResponse.json({ liked: !alreadyLiked, likes: msg.likes.length });
}
