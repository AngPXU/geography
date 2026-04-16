import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import DailyMission from "@/models/DailyMission";
import User from "@/models/User";
import { getVietnamDateStr } from "@/utils/missions";
import type { MissionId, IMissionSlot } from "@/models/DailyMission";

/**
 * POST /api/missions/progress
 * Body: { missionId: MissionId, increment?: number }
 *
 * Increments progress for a specific mission slot.
 * Increments default to 1 except "online-20" which sends minutes elapsed.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const missionId = body.missionId as MissionId | undefined;
  const increment: number = typeof body.increment === "number" ? body.increment : 1;

  if (!missionId) {
    return NextResponse.json({ error: "missionId required" }, { status: 400 });
  }

  await dbConnect();
  const dbUser = await User.findOne({ username: session.user.name }).lean() as { _id: any } | null;
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const today = getVietnamDateStr();
  const doc = await DailyMission.findOne({ userId: dbUser._id, date: today });
  if (!doc) return NextResponse.json({ error: "No missions for today" }, { status: 404 });

  const slot = doc.missions.find((m: IMissionSlot) => m.missionId === missionId);
  if (!slot) return NextResponse.json({ error: "Mission not in today's set" }, { status: 404 });

  // Don't update already-completed missions
  if (slot.completed) {
    return NextResponse.json({ missions: doc.missions });
  }

  slot.progress = Math.min(slot.progress + increment, slot.target);
  if (slot.progress >= slot.target) {
    slot.completed = true;
  }

  await doc.save();
  return NextResponse.json({ missions: doc.missions });
}
