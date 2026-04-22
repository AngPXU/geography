import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import Classroom from '@/models/Classroom';
import HomeClass from '@/models/HomeClass';
import { notify } from '@/utils/notificationService';

type Params = { params: Promise<{ id: string }> };

// POST /api/classroom/[id]/live-session-status
// Body: { active: boolean }
// Giáo viên gọi khi join (active=true) hoặc leave/close LiveKit room (active=false)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  const user = await User.findOne({ username: session.user.name });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const classroom = await Classroom.findById(id);
  if (!classroom) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const isTeacher =
    classroom.teacherId === user._id.toString() ||
    user.role === 1 ||
    user.role === 2;
  if (!isTeacher) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { active } = await req.json() as { active: boolean };
  classroom.liveSessionActive = !!active;

  if (active) {
    classroom.sessionEndedAt = undefined;
    // Notify all students of this teacher across all their HomeClasses
    try {
      const classes = await HomeClass.find({ teacherId: classroom.teacherId }).lean();
      const studentIds = new Set<string>();
      classes.forEach(c => {
        if (c.members) {
          c.members.forEach((m: any) => studentIds.add(m.userId.toString()));
        }
      });
      if (studentIds.size > 0) {
        await notify(
          Array.from(studentIds),
          'LIVE_CLASS_STARTED',
          '🔴 Lớp học trực tuyến đang diễn ra',
          `Giáo viên ${classroom.teacherName} đã mở phòng học "${classroom.name}". Bấm vào để tham gia ngay!`,
          `/classroom/${classroom.code}`,
          classroom.teacherId
        );
      }
    } catch (err) {
      console.error('Failed to notify live class start', err);
    }
  }

  await classroom.save();

  return NextResponse.json({ ok: true, liveSessionActive: classroom.liveSessionActive });
}
