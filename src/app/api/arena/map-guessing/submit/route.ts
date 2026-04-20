import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import ArenaMatchHistory from "@/models/ArenaMatchHistory";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { topic, score } = body;

    if (typeof score !== 'number' || !topic) {
      return NextResponse.json({ success: false, message: "Invalid payload" }, { status: 400 });
    }

    await dbConnect();

    // Calculate EXP reward
    const expEarned = score >= 5000 ? 50 : 0;

    // Create match history
    await ArenaMatchHistory.create({
      username: session.user.name,
      gameMode: 'map-guessing',
      topic,
      score,
      expEarned,
    });

    // Award EXP if any
    if (expEarned > 0) {
      await User.updateOne({ username: session.user.name }, { $inc: { exp: expEarned } });
    }

    return NextResponse.json({ success: true, expEarned });
  } catch (error: any) {
    console.error("Error submitting match history:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
