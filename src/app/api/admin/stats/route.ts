import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';
import FlashcardCard from '@/models/FlashcardCard';
import FlashcardLesson from '@/models/FlashcardLesson';
import QuizSet from '@/models/QuizSet';
import HomeClass from '@/models/HomeClass';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const oneWeekAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // ─── Base counts ───────────────────────────────────────────
  const [
    totalUsers, newUsersWeek, newUsersMonth,
    totalStudents, totalTeachers, totalAdmins,
    totalFlashcards, totalLessons,
    totalQuizSets, totalClasses,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    User.countDocuments({ createdAt: { $gte: oneMonthAgo } }),
    User.countDocuments({ role: 3 }),
    User.countDocuments({ role: 2 }),
    User.countDocuments({ role: 1 }),
    FlashcardCard.countDocuments(),
    FlashcardLesson.countDocuments(),
    QuizSet.countDocuments(),
    HomeClass.countDocuments(),
  ]);

  // ─── Role distribution ─────────────────────────────────────
  const roleDistribution = [
    { name: 'Học sinh', value: totalStudents, color: '#06B6D4' },
    { name: 'Giáo viên', value: totalTeachers, color: '#22C55E' },
    { name: 'Admin', value: totalAdmins, color: '#F59E0B' },
  ];

  // ─── Flashcards by grade ───────────────────────────────────
  const cardsByGrade = await FlashcardCard.aggregate([
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  const gradeStats = [6, 7, 8, 9].map(g => ({
    grade: `Lớp ${g}`,
    count: (cardsByGrade.find(x => x._id === g)?.count ?? 0) as number,
  }));

  // ─── New users last 7 days (daily breakdown) ───────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setHours(0, 0, 0, 0);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const dailyRaw = await User.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailyUsers = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('sv-SE'); // YYYY-MM-DD
    const dayLabel = d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' });
    const found = dailyRaw.find(r => r._id === key);
    return { day: dayLabel, count: found?.count ?? 0 };
  });

  // ─── Top 5 users by EXP ───────────────────────────────────
  const topUsers = await User.find()
    .sort({ exp: -1 })
    .limit(5)
    .select('username fullName exp streak avatar role')
    .lean();

  return NextResponse.json({
    totalUsers, newUsers: newUsersWeek, newUsersWeek, newUsersMonth,
    totalStudents, totalTeachers, totalAdmins,
    totalFlashcards, totalLessons, totalQuizSets, totalClasses,
    roleDistribution, gradeStats, dailyUsers, topUsers,
  });
}

