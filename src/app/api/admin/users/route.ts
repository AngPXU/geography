import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page    = Math.max(1, parseInt(searchParams.get('page')    || '1'));
  const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '14')));
  const search  = (searchParams.get('search') || '').trim();
  const role    = searchParams.get('role')    || 'all';
  const sort    = searchParams.get('sort')    || 'createdAt';
  const sortDir = searchParams.get('sortDir') === 'asc' ? 1 : -1;
  const skip    = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (role !== 'all' && ['1', '2', '3'].includes(role)) {
    query.role = parseInt(role);
  }
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
    ];
  }

  const ALLOWED_SORTS = ['username', 'email', 'exp', 'streak', 'createdAt'];
  const sortField = ALLOWED_SORTS.includes(sort) ? sort : 'createdAt';

  const [users, total] = await Promise.all([
    User.find(query)
      .select('username email role fullName exp streak createdAt provider avatar')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return NextResponse.json({ users, total, page, limit });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 1) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { username, password, email, fullName, className, school, province, ward, address, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Bắt buộc phải có tên đăng nhập và mật khẩu' }, { status: 400 });
    }

    const parsedRole = Number(role);
    if (![1, 2, 3].includes(parsedRole)) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 400 });
    }

    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      provider: 'credentials',
      role: parsedRole,
      ...(email     && { email }),
      ...(fullName  && { fullName }),
      ...(className && { className }),
      ...(school    && { school }),
      ...(province  && { province }),
      ...(ward      && { ward }),
      ...(address   && { address }),
    });

    return NextResponse.json({ message: 'Tạo người dùng thành công', user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Admin create user error:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống khi tạo người dùng' }, { status: 500 });
  }
}
