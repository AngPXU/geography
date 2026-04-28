import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// GET — full user detail (all fields except password)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findById(id).select('-password').lean();
  if (!user) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });

  return NextResponse.json({ user });
}

// PATCH — update user info (all fields)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  const body = await req.json();
  const ALLOWED_FIELDS = [
    'username', 'email', 'role', 'fullName', 'school', 'className',
    'province', 'ward', 'address', 'exp', 'streak', 'petExp', 'coins'
  ];
  
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (update.role !== undefined && ![1, 2, 3].includes(Number(update.role))) {
    return NextResponse.json({ error: 'Role không hợp lệ (1=Admin, 2=Giáo viên, 3=Học sinh)' }, { status: 400 });
  }

  await dbConnect();

  // Kiểm tra username/email trùng lặp nếu có thay đổi
  if (update.username) {
    const existingUser = await User.findOne({ username: update.username, _id: { $ne: id } });
    if (existingUser) return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 400 });
  }
  
  if (update.email) {
    const existingEmail = await User.findOne({ email: update.email, _id: { $ne: id } });
    if (existingEmail) return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
  }

  // Nếu có password mới thì hash và update
  if (body.password && typeof body.password === 'string' && body.password.trim() !== '') {
    const bcrypt = await import('bcryptjs');
    update.password = await bcrypt.hash(body.password.trim(), 12);
  }

  const user = await User.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true }
  ).select('-password').lean();

  if (!user) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
  return NextResponse.json({ user });
}

// DELETE — remove user account
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
  }

  // Prevent deleting your own account
  if (id === (session.user as { id?: string }).id) {
    return NextResponse.json({ error: 'Không thể xoá tài khoản đang đăng nhập' }, { status: 400 });
  }

  await dbConnect();
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });

  return NextResponse.json({ success: true });
}
