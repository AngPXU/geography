import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import HomeClass from '@/models/HomeClass';
import Assignment from '@/models/Assignment';
import mongoose from 'mongoose';
import { notify } from '@/utils/notificationService';

type Params = { params: Promise<{ id: string }> };

// POST — create one assignment with questions[]
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const cls = await HomeClass.findById(id).lean();
    if (!cls) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 });

    const userId = (session.user as { id?: string }).id;
    if (cls.teacherId.toString() !== userId && session.user.role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { title, questions, dueDate, expReward } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Tiêu đề bài tập không được để trống' }, { status: 400 });
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Bài tập phải có ít nhất 1 câu hỏi' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validatedQuestions = (questions as any[]).map((q) => ({
      type:             q.type === 'quiz' ? 'quiz' : 'text',
      description:      q.description || undefined,
      quizQuestion:     q.type === 'quiz' ? (q.quizQuestion?.trim() || undefined) : undefined,
      quizOptions:      q.type === 'quiz' ? q.quizOptions : undefined,
      quizCorrectIndex: q.type === 'quiz' ? Number(q.quizCorrectIndex) : undefined,
    }));

    const assignment = await Assignment.create({
      homeClassId: id,
      title:       title.trim(),
      questions:   validatedQuestions,
      dueDate:     dueDate ? new Date(dueDate) : undefined,
      expReward:   expReward ? Number(expReward) : 20,
      submissions: [],
      createdBy:   userId,
    });

    // Notify all students in this class
    if (cls.members && cls.members.length > 0) {
      const studentIds = cls.members.map((m: any) => m.userId.toString());
      await notify(
        studentIds,
        'NEW_ASSIGNMENT',
        '📝 Bài tập mới!',
        `Giáo viên ${cls.teacherName} vừa giao bài tập: "${title.trim()}" cho lớp ${cls.name}.`,
        `/assignments`,
        userId
      );
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error('[homeclass/assignments POST]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
