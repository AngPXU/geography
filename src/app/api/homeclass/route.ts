import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import HomeClass from '@/models/HomeClass';

// GET — list home classes for current user (as teacher or member)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const userId = (session.user as { id?: string }).id;

    const classes = await HomeClass.find({
      $or: [
        { teacherId: userId },
        { 'members.userId': userId },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ classes });
  } catch (err) {
    console.error('[homeclass GET]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// POST — create a new home class (teacher/admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 1 && session.user.role !== 2) {
      return NextResponse.json({ error: 'Chỉ giáo viên mới có thể tạo lớp học' }, { status: 403 });
    }

    await dbConnect();
    const body = await req.json();
    const { name, subject, description, grade } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Tên lớp học không được để trống' }, { status: 400 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: 'Không tìm thấy ID người dùng. Vui lòng đăng xuất và đăng nhập lại.' }, { status: 401 });
    }

    const cls = await HomeClass.create({
      name: name.trim(),
      subject: subject?.trim() || undefined,
      description: description?.trim() || undefined,
      grade: grade ? Number(grade) : undefined,
      teacherId: userId,
      teacherName: session.user.name || 'Giáo viên',
      teacherAvatar: session.user.image || undefined,
      members: [],
    });

    return NextResponse.json({ class: cls }, { status: 201 });
  } catch (err) {
    console.error('[homeclass POST]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
