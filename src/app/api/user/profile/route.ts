import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const user = await User.findOne({ username: session.user.name }).select('-password');
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: user.toObject() });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    fullName, className, school, email,
    province, ward, address, avatar,
    currentPassword, newPassword,
  } = body as Record<string, string | undefined>;

  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // ── Password change ──────────────────────────────────────────────────────
  if (newPassword !== undefined) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Vui lòng nhập mật khẩu hiện tại' }, { status: 400 });
    }
    if (!user.password) {
      return NextResponse.json({ error: 'Tài khoản không có mật khẩu để đổi' }, { status: 400 });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
    }
    const pwValid =
      newPassword.length >= 8 &&
      /[A-Z]/.test(newPassword) &&
      /[a-z]/.test(newPassword) &&
      /[0-9]/.test(newPassword) &&
      /[^A-Za-z0-9]/.test(newPassword);
    if (!pwValid) {
      return NextResponse.json(
        { error: 'Mật khẩu mới cần: ≥8 ký tự, có hoa, thường, số và ký tự đặc biệt' },
        { status: 400 },
      );
    }
    user.password = await bcrypt.hash(newPassword, 12);
  }

  // ── Email update ─────────────────────────────────────────────────────────
  if (email !== undefined) {
    const trimmed = email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }
    if (trimmed && trimmed !== user.email) {
      const dup = await User.findOne({ email: trimmed });
      if (dup) {
        return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
      }
    }
    user.email = trimmed || undefined;
  }

  // ── Other fields ─────────────────────────────────────────────────────────
  if (fullName  !== undefined) user.fullName  = fullName  || undefined;
  if (className !== undefined) user.className = className || undefined;
  if (school    !== undefined) user.school    = school    || undefined;
  if (address   !== undefined) user.address   = address   || undefined;
  if (avatar    !== undefined) user.avatar    = avatar    || undefined;

  // Province & ward arrive as objects
  if ('province' in body) user.province = (body.province as { code: number; name: string }) || undefined;
  if ('ward'     in body) user.ward     = (body.ward     as { code: number; name: string }) || undefined;

  await user.save();
  return NextResponse.json({ message: 'Cập nhật thành công' });
}
