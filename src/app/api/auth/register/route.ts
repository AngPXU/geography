import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'Unknown';
    const { username, password, email, fullName, className, school, province, ward, address, role } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Bắt buộc phải có tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    // role must be 2 (teacher) or 3 (student) — 1 (admin) cannot be self-registered
    const parsedRole = Number(role);
    if (![2, 3].includes(parsedRole)) {
      return NextResponse.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
    }

    // Basic email format validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại' },
        { status: 400 }
      );
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
      ipAddress: ip,
    });

    return NextResponse.json(
      { message: 'Đăng ký thành công', user: { id: newUser._id, username: newUser.username } },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi đăng ký' },
      { status: 500 }
    );
  }
}
