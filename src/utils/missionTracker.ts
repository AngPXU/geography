'use client';

import type { MissionId } from "@/models/DailyMission";

/**
 * Fire-and-forget helper — calls POST /api/missions/progress.
 * Safe to call from any client component.
 */
export async function trackMission(missionId: MissionId, increment = 1): Promise<void> {
  try {
    await fetch("/api/missions/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId, increment }),
    });
  } catch {
    // Silently ignore — mission tracking is non-critical
  }
}

/**
 * Claim EXP for a completed mission.
 * Returns the exp awarded, or 0 on failure.
 */
export async function claimMission(missionId: MissionId): Promise<number> {
  const result = await claimMissionWithExp(missionId);
  return result.exp;
}

/**
 * Claim EXP and return expAwarded, new totalExp, and new streak.
 */
export async function claimMissionWithExp(
  missionId: MissionId
): Promise<{ exp: number; totalExp: number; streak: number }> {
  try {
    const res = await fetch("/api/missions/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId }),
    });
    const data = await res.json();
    if (res.ok) {
      return {
        exp: data.expAwarded ?? 0,
        totalExp: data.totalExp ?? 0,
        streak: data.streak ?? 0,
      };
    }
    return { exp: 0, totalExp: 0, streak: 0 };
  } catch {
    return { exp: 0, totalExp: 0, streak: 0 };
  }
}
