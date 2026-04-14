import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Bắt buộc phải có tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Tên đăng nhập đã tồn tại' },
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      provider: 'credentials',
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
