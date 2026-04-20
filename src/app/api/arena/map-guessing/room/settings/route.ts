import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import MapGuessRoom from "@/models/MapGuessRoom";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const username = session.user.name;
    const body = await req.json();
    const { roomCode, topic, questions } = body;

    await dbConnect();
    const room = await MapGuessRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return NextResponse.json({ success: false, message: "Room not found" }, { status: 404 });

    // Only host can change settings in WAITING status
    if (room.host !== username) {
       return NextResponse.json({ success: false, message: "Not permitted" }, { status: 403 });
    }
    if (room.status !== 'WAITING') {
       return NextResponse.json({ success: false, message: "Game already started" }, { status: 400 });
    }

    room.topic = topic;
    room.questions = questions;
    room.markModified('questions');
    await room.save();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}
