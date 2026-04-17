import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import HomeClass from '@/models/HomeClass';
import Assignment, { computeAssignmentScore, IQuestion } from '@/models/Assignment';
import User from '@/models/User';
import mongoose from 'mongoose';

type Params = { params: Promise<{ id: string; aid: string }> };

// GET — full assignment detail (teacher: all submissions; student: own only)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, aid } = await params;
    if (!mongoose.isValidObjectId(aid)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const [assignment, cls] = await Promise.all([
      Assignment.findOne({ _id: aid, homeClassId: id }),
      HomeClass.findById(id).lean(),
    ]);
    if (!assignment || !cls) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    const userId    = (session.user as { id?: string }).id!;
    const isTeacher = cls.teacherId.toString() === userId || session.user.role === 1 || session.user.role === 2;
    const isMember  = cls.members.some(m => m.userId.toString() === userId);
    if (!isTeacher && !isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const subsOut = isTeacher
      ? assignment.submissions
      : assignment.submissions.filter(s => s.userId.toString() === userId);

    return NextResponse.json({
      assignment:  { ...assignment.toObject(), submissions: subsOut },
      isTeacher,
      memberCount: cls.members.length,
    });
  } catch (err) {
    console.error('[assignments/[aid] GET]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// POST — student submits answers  { answers: { questionIdx, answer }[] }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, aid } = await params;
    if (!mongoose.isValidObjectId(aid)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const assignment = await Assignment.findOne({ _id: aid, homeClassId: id });
    if (!assignment) return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });

    const userId   = (session.user as { id?: string }).id!;
    const username = session.user.name || '';

    if (assignment.submissions.some(s => s.userId.toString() === userId)) {
      return NextResponse.json({ error: 'Bạn đã nộp bài tập này rồi' }, { status: 409 });
    }

    const { answers } = await req.json() as { answers: { questionIdx: number; answer: string }[] };
    if (!Array.isArray(answers)) return NextResponse.json({ error: 'Thiếu answers' }, { status: 400 });

    const submittedAt = new Date();

    // Build processed answers (no textScore yet for text questions)
    const processedAnswers = answers.map(a => ({
      questionIdx: a.questionIdx,
      answer:      a.answer !== undefined ? String(a.answer) : undefined,
    }));

    // Compute initial score (quiz auto-graded; text ungraded = 0)
    const { totalScore, fullyGraded } = computeAssignmentScore(
      assignment.questions as IQuestion[],
      processedAnswers
    );

    assignment.submissions.push({
      userId:      new mongoose.Types.ObjectId(userId),
      username,
      submittedAt,
      answers:     processedAnswers,
      totalScore:  fullyGraded ? totalScore : undefined,
      fullyGraded,
      gradedAt:    fullyGraded ? submittedAt : undefined,
    } as never);
    await assignment.save();

    if (assignment.expReward > 0) {
      await User.findByIdAndUpdate(userId, { $inc: { exp: assignment.expReward } });
    }

    return NextResponse.json({ success: true, expAwarded: assignment.expReward });
  } catch (err) {
    console.error('[assignments/[aid] POST]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PATCH — teacher grades one text answer  { userId, questionIdx, textScore (0-10) }
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, aid } = await params;
    if (!mongoose.isValidObjectId(aid)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const [assignment, cls] = await Promise.all([
      Assignment.findOne({ _id: aid, homeClassId: id }),
      HomeClass.findById(id).lean(),
    ]);
    if (!assignment || !cls) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    const callerId  = (session.user as { id?: string }).id!;
    const isTeacher = cls.teacherId.toString() === callerId || session.user.role === 1 || session.user.role === 2;
    if (!isTeacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId, questionIdx, textScore } = await req.json();
    if (!userId || questionIdx === undefined || textScore === undefined) {
      return NextResponse.json({ error: 'Thiếu userId, questionIdx hoặc textScore' }, { status: 400 });
    }
    const scoreNum = Number(textScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      return NextResponse.json({ error: 'Điểm phải từ 0 đến 10' }, { status: 400 });
    }

    const sub = assignment.submissions.find(s => s.userId.toString() === userId);
    if (!sub) return NextResponse.json({ error: 'Không tìm thấy bài nộp' }, { status: 404 });

    const q = assignment.questions[questionIdx];
    if (!q || q.type !== 'text') {
      return NextResponse.json({ error: 'Câu hỏi không hợp lệ hoặc không phải văn bản' }, { status: 400 });
    }

    // Update or create the answer entry
    const existingAns = sub.answers.find(a => a.questionIdx === questionIdx);
    if (existingAns) {
      existingAns.textScore = scoreNum;
    } else {
      sub.answers.push({ questionIdx, textScore: scoreNum });
    }

    // Recompute total score
    const { totalScore, fullyGraded } = computeAssignmentScore(
      assignment.questions as IQuestion[],
      sub.answers as { questionIdx: number; answer?: string; textScore?: number }[]
    );
    sub.totalScore  = totalScore;
    sub.fullyGraded = fullyGraded;
    if (fullyGraded) sub.gradedAt = new Date();

    await assignment.save();
    return NextResponse.json({ success: true, totalScore, fullyGraded });
  } catch (err) {
    console.error('[assignments/[aid] PATCH]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// PUT — teacher edits assignment  { title, questions[], dueDate, expReward }
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, aid } = await params;
    if (!mongoose.isValidObjectId(aid)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const [assignment, cls] = await Promise.all([
      Assignment.findOne({ _id: aid, homeClassId: id }),
      HomeClass.findById(id).lean(),
    ]);
    if (!assignment || !cls) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    const callerId  = (session.user as { id?: string }).id!;
    const isTeacher = cls.teacherId.toString() === callerId || session.user.role === 1 || session.user.role === 2;
    if (!isTeacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, questions, dueDate, expReward } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: 'Tiêu đề không được để trống' }, { status: 400 });

    assignment.title     = title.trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (Array.isArray(questions)) assignment.questions = questions as any;
    assignment.dueDate   = dueDate ? new Date(dueDate) : undefined;
    assignment.expReward = expReward !== undefined ? Number(expReward) : assignment.expReward;

    await assignment.save();
    return NextResponse.json({ assignment });
  } catch (err) {
    console.error('[assignments/[aid] PUT]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

// DELETE — teacher deletes an assignment
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { aid } = await params;
    if (!mongoose.isValidObjectId(aid)) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    await dbConnect();
    const assignment = await Assignment.findById(aid);
    if (!assignment) return NextResponse.json({ error: 'Không tìm thấy bài tập' }, { status: 404 });

    const userId  = (session.user as { id?: string }).id;
    const isOwner = assignment.createdBy.toString() === userId;
    if (!isOwner && session.user.role !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Assignment.findByIdAndDelete(aid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[assignments/[aid] DELETE]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
