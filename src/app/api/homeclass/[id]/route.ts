import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import HomeClass from '@/models/HomeClass';
import Assignment from '@/models/Assignment';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// GET — get class detail + assignments
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const cls = await HomeClass.findById(id).lean();
    if (!cls) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });

    const userId = (session.user as { id?: string }).id;
    const isTeacher = cls.teacherId.toString() === userId;
    const isMember  = cls.members.some(m => m.userId.toString() === userId);
    if (!isTeacher && !isMember && session.user.role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignments = await Assignment.find({ homeClassId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ class: cls, assignments });
  } catch (err) {
    console.error('[homeclass/[id] GET]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PATCH — update class info (teacher only)
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const cls = await HomeClass.findById(id);
    if (!cls) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });

    const userId = (session.user as { id?: string }).id;
    if (cls.teacherId.toString() !== userId && session.user.role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (body.name)        cls.name        = body.name.trim();
    if (body.subject)     cls.subject     = body.subject.trim();
    if (body.description) cls.description = body.description.trim();
    if (body.grade)       cls.grade       = Number(body.grade);
    await cls.save();

    return NextResponse.json({ class: cls });
  } catch (err) {
    console.error('[homeclass/[id] PATCH]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// DELETE — remove class (teacher only)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const cls = await HomeClass.findById(id);
    if (!cls) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });

    const userId = (session.user as { id?: string }).id;
    if (cls.teacherId.toString() !== userId && session.user.role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Promise.all([
      HomeClass.findByIdAndDelete(id),
      Assignment.deleteMany({ homeClassId: id }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[homeclass/[id] DELETE]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
