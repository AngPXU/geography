import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import { OldTest } from '@/models/OldTest';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 1 && session.user.role !== 2)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    const test = await OldTest.findById(id);
    if (!test) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    
    if (session.user.role !== 1 && test.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Không có quyền sửa bài của người khác' }, { status: 403 });
    }

    // Cập nhật thông tin gốc (nếu có)
    if (body.title !== undefined) test.title = body.title;
    if (body.subject !== undefined) test.subject = body.subject;
    if (body.grade !== undefined) test.grade = body.grade;
    if (body.description !== undefined) test.description = body.description;

    // Cập nhật câu hỏi
    if (body.questions !== undefined) {
      test.questions = body.questions;
    }

    await test.save();
    return NextResponse.json({ test });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 1 && session.user.role !== 2)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await dbConnect();
    const test = await OldTest.findById(id);
    if (!test) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });
    
    if (session.user.role !== 1 && test.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Không có quyền xóa bài của người khác' }, { status: 403 });
    }

    await OldTest.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
