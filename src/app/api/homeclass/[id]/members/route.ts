import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import HomeClass from '@/models/HomeClass';
import User from '@/models/User';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string }> };

// POST — add member by username
export async function POST(req: NextRequest, { params }: Params) {
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

    const { username } = await req.json();
    if (!username?.trim()) return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập' }, { status: 400 });

    const student = await User.findOne({ username: username.trim() }).select('_id username fullName avatar').lean();
    if (!student) return NextResponse.json({ error: `Không tìm thấy tài khoản "${username}"` }, { status: 404 });

    const alreadyIn = cls.members.some(m => m.userId.toString() === (student._id as mongoose.Types.ObjectId).toString());
    if (alreadyIn) return NextResponse.json({ error: 'Học sinh này đã có trong lớp' }, { status: 409 });

    cls.members.push({
      userId:   student._id as mongoose.Types.ObjectId,
      username: student.username,
      fullName: student.fullName,
      avatar:   student.avatar,
      joinedAt: new Date(),
    });
    await cls.save();

    return NextResponse.json({ member: cls.members[cls.members.length - 1] });
  } catch (err) {
    console.error('[homeclass/members POST]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// DELETE — remove member  (?memberId=xxx)
export async function DELETE(req: NextRequest, { params }: Params) {
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

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    if (!memberId) return NextResponse.json({ error: 'Thiếu memberId' }, { status: 400 });

    cls.members = cls.members.filter(m => m.userId.toString() !== memberId);
    await cls.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[homeclass/members DELETE]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
