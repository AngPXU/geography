import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import DailyMission from "@/models/DailyMission";
import User from "@/models/User";
import { getVietnamDateStr, ALL_MISSIONS } from "@/utils/missions";
import { getStreakMilestoneReached } from "@/utils/streakSystem";
import type { MissionId, IMissionSlot } from "@/models/DailyMission";

/**
 * POST /api/missions/claim
 * Body: { missionId: MissionId }
 *
 * Marks a completed mission as claimed and returns exp awarded.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const missionId = body.missionId as MissionId | undefined;
  if (!missionId) {
    return NextResponse.json({ error: "missionId required" }, { status: 400 });
  }

  await dbConnect();
  // Use findOne (not lean) so we can save EXP back
  const dbUser = await User.findOne({ username: session.user.name });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const today = getVietnamDateStr();
  const doc = await DailyMission.findOne({ userId: dbUser._id, date: today });
  if (!doc) return NextResponse.json({ error: "No missions for today" }, { status: 404 });

  const slot = doc.missions.find((m: IMissionSlot) => m.missionId === missionId);
  if (!slot) return NextResponse.json({ error: "Mission not found" }, { status: 404 });
  if (!slot.completed) return NextResponse.json({ error: "Mission not completed yet" }, { status: 400 });
  if (slot.claimed)   return NextResponse.json({ error: "Already claimed" }, { status: 400 });

  slot.claimed = true;

  // ── Streak logic: only update on FIRST claimed mission of the day ──
  const wasAnyClaimedBefore = doc.missions.some(
    (m: IMissionSlot) => m.missionId !== missionId && m.claimed
  );
  const yesterday = getVietnamDateStr(new Date(Date.now() - 86_400_000));
  const currentStreak: number = (dbUser as any).streak ?? 0;
  const streakLastDate: string = (dbUser as any).streakLastDate ?? '';

  let newStreak = currentStreak;
  
  const missionDef = ALL_MISSIONS.find(m => m.id === missionId);
  const coinsReward = missionDef ? missionDef.coins : 10;
  
  // Thưởng Xu theo số xu cấu hình trong ALL_MISSIONS
  const userUpdate: Record<string, unknown> = { $inc: { exp: slot.exp, coins: coinsReward } };

  if (!wasAnyClaimedBefore) {
    if (streakLastDate === today) {
      newStreak = currentStreak;
    } else if (streakLastDate === yesterday) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1;
    }
    (userUpdate as any).$set = { streak: newStreak, streakLastDate: today };

    // Kiểm tra mốc chuỗi và cộng thưởng xu
    const milestone = getStreakMilestoneReached(newStreak);
    if (milestone) {
      (userUpdate.$inc as any).coins = (coinsReward + milestone.reward);
    }
  }

  // Persist both DailyMission and User atomically
  await Promise.all([
    doc.save(),
    User.updateOne({ _id: dbUser._id }, userUpdate),
  ]);

  const updatedUser = await User.findById(dbUser._id).select('exp streak coins').lean() as { exp: number; streak: number; coins: number } | null;

  // Kiểm tra mốc chuỗi để trả về cho frontend
  const milestone = getStreakMilestoneReached(newStreak);

  return NextResponse.json({
    missions: doc.missions,
    expAwarded: slot.exp,
    totalExp: updatedUser?.exp ?? 0,
    streak: updatedUser?.streak ?? newStreak,
    coins: updatedUser?.coins ?? 0,
    streakMilestone: milestone ? { days: milestone.days, reward: milestone.reward, icon: milestone.icon, label: milestone.label } : null,
  });
}
