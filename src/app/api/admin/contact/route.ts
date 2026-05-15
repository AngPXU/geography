import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import ContactMessage from '@/models/ContactMessage';

// GET: Admin lấy danh sách liên hệ
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: number }).role !== 1) {
    return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page    = Math.max(1, Number(searchParams.get('page')  ?? 1));
  const limit   = Math.min(50, Number(searchParams.get('limit') ?? 20));
  const status  = searchParams.get('status'); // 'read' | 'unread' | null = all
  const search  = searchParams.get('search') ?? '';

  const filter: Record<string, unknown> = {};
  if (status === 'read')   filter.isRead = true;
  if (status === 'unread') filter.isRead = false;
  if (search) filter.username = { $regex: search, $options: 'i' };

  const [messages, total] = await Promise.all([
    ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ContactMessage.countDocuments(filter),
  ]);

  return NextResponse.json({ messages, total, page, limit });
}

// PATCH: Đánh dấu đã xử lý / chưa xử lý
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: number }).role !== 1) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }

  const body = await req.json() as { id?: string; isRead?: boolean };
  if (!body.id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });

  await dbConnect();
  const updated = await ContactMessage.findByIdAndUpdate(
    body.id,
    { isRead: body.isRead },
    { new: true }
  ).lean();

  if (!updated) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
  return NextResponse.json({ ok: true, message: updated });
}

// DELETE: Xóa tin nhắn
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: number }).role !== 1) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Thiếu id' }, { status: 400 });

  await dbConnect();
  await ContactMessage.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
