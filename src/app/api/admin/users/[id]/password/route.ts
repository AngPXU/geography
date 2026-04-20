import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/users/[id]/password
 * Body: { adminPassword: string }
 * Admin xác thực bằng mật khẩu của chính mình,
 * sau đó server trả về hash mật khẩu của user đích.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  const body = await req.json();
  const { adminPassword } = body as { adminPassword?: string };
  if (!adminPassword?.trim()) {
    return NextResponse.json({ error: 'Vui lòng nhập mật khẩu' }, { status: 400 });
  }

  await dbConnect();

  // Fetch admin's own account (with password field)
  const adminId = (session.user as { id?: string }).id;
  const adminUser = await User.findById(adminId).select('+password').lean();
  if (!adminUser?.password) {
    return NextResponse.json(
      { error: 'Tài khoản admin không sử dụng mật khẩu (đăng nhập qua Google/Facebook)' },
      { status: 400 }
    );
  }

  const isValid = await bcrypt.compare(adminPassword, adminUser.password);
  if (!isValid) {
    return NextResponse.json({ error: 'Mật khẩu admin không đúng' }, { status: 401 });
  }

  // Fetch target user's password hash
  const targetUser = await User.findById(id).select('+password').lean();
  if (!targetUser) {
    return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
  }

  if (!targetUser.password) {
    return NextResponse.json(
      { error: 'Tài khoản này không có mật khẩu (đăng nhập qua Google/Facebook)' },
      { status: 400 }
    );
  }

  return NextResponse.json({ passwordHash: targetUser.password });
}
