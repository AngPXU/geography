import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import OldLessonCheck from '@/models/OldLessonCheck';

// ── DELETE: Xóa bộ kiểm tra bài cũ ────────────────────────────────────────────
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const check = await OldLessonCheck.findById(id);
  if (!check) return NextResponse.json({ error: 'Không tìm thấy bộ kiểm tra này' }, { status: 404 });

  // Chỉ người tạo (giáo viên) mới được xoá
  if (check.teacherId !== user._id.toString()) {
    return NextResponse.json({ error: 'Bạn không có quyền xóa bộ kiểm tra này' }, { status: 403 });
  }

  await OldLessonCheck.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
