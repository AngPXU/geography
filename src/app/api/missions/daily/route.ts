import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import DailyMission from "@/models/DailyMission";
import User from "@/models/User";
import { getVietnamDateStr, pickDailyMissions } from "@/utils/missions";

/** GET /api/missions/daily — return (or create) today's missions, plus streak + last-7-days calendar */
export async function GET() {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const dbUser = await User.findOne({ username: session.user.name })
    .select('_id streak streakLastDate')
    .lean() as { _id: any; streak?: number; streakLastDate?: string } | null;
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const today = getVietnamDateStr();
  let doc = await DailyMission.findOne({ userId: dbUser._id, date: today }).lean();

  if (!doc) {
    const picked = pickDailyMissions(String(dbUser._id), today);
    const missions = picked.map((m) => ({
      missionId: m.id,
      exp: m.exp,
      progress: 0,
      target: m.target,
      completed: false,
      claimed: false,
    }));
    doc = await DailyMission.create({ userId: dbUser._id, date: today, missions });
    doc = (doc as any).toObject();
  }

  // ── Lazy streak reset: if streakLastDate is before yesterday, effective streak = 0 ──
  const yesterday = getVietnamDateStr(new Date(Date.now() - 86_400_000));
  const streakLastDate = dbUser.streakLastDate ?? '';
  const isStreakAlive = streakLastDate === today || streakLastDate === yesterday;
  const effectiveStreak = isStreakAlive ? (dbUser.streak ?? 0) : 0;

  // Reset in DB if needed (lazy) — fire and forget
  if (!isStreakAlive && (dbUser.streak ?? 0) > 0) {
    User.updateOne({ _id: dbUser._id }, { $set: { streak: 0 } }).catch(() => {});
  }

  // ── Last 7 days calendar ──
  const last7Dates = Array.from({ length: 7 }, (_, i) =>
    getVietnamDateStr(new Date(Date.now() - i * 86_400_000))
  );
  const calendarDocs = await DailyMission.find({
    userId: dbUser._id,
    date: { $in: last7Dates },
  }).lean();

  const last7Days = last7Dates.map((date) => ({
    date,
    active: calendarDocs.some(
      (r: any) => r.date === date && r.missions.some((m: any) => m.claimed)
    ),
  }));

  return NextResponse.json({
    date: today,
    missions: (doc as any).missions,
    streak: effectiveStreak,
    last7Days,
  });
}
