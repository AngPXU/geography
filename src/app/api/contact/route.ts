import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import ContactMessage from '@/models/ContactMessage';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const body = await req.json() as { content?: string; image?: string };

  if (!body.content || body.content.trim().length < 5) {
    return NextResponse.json({ error: 'Nội dung quá ngắn (tối thiểu 5 ký tự)' }, { status: 400 });
  }

  await dbConnect();
  await ContactMessage.create({
    username: session.user.name,
    image: body.image || undefined,
    content: body.content.trim(),
  });

  return NextResponse.json({ ok: true });
}
