import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import ArenaMatchHistory from "@/models/ArenaMatchHistory";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch the 20 most recent matches (solo + duo)
    const history = await ArenaMatchHistory.find({ 
      username: session.user.name, 
      gameMode: { $in: ['map-guessing', 'map-guessing-duo'] }
    })
      .sort({ playedAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error("Error fetching match history:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
