import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import { getVietnamDateStr } from "@/utils/missions";

/** GET /api/study-time — return today's accumulated study seconds */
export async function GET() {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ seconds: 0 });

  await dbConnect();
  const today = getVietnamDateStr();
  const user = await User.findOne({ username: session.user.name })
    .select("studyTimeToday studyTimeDate")
    .lean() as { studyTimeToday?: number; studyTimeDate?: string } | null;

  const seconds =
    user?.studyTimeDate === today ? (user.studyTimeToday ?? 0) : 0;

  return NextResponse.json({ seconds });
}

/**
 * POST /api/study-time
 * Body: { seconds: number }
 *
 * Stores the client's absolute accumulated seconds for today.
 * Resets to the new value if the date changed.
 * Accepts both fetch and sendBeacon (Blob with application/json).
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const seconds: number =
    typeof body.seconds === "number" ? Math.max(0, Math.floor(body.seconds)) : 0;

  await dbConnect();
  const today = getVietnamDateStr();

  await User.updateOne(
    { username: session.user.name },
    { $set: { studyTimeToday: seconds, studyTimeDate: today } }
  );

  return NextResponse.json({ ok: true, seconds });
}
