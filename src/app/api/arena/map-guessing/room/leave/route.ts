import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import MapGuessRoom from "@/models/MapGuessRoom";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const { roomCode, username: bodyUsername } = body;
    // Use session username if available, fallback to body username (for sendBeacon calls)
    const username = session?.user?.name || bodyUsername;
    if (!username) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const room = await MapGuessRoom.findOne({ roomCode: roomCode?.toUpperCase() });
    if (!room) return NextResponse.json({ success: true }); // Already gone

    const isHost = room.host === username;
    const isGuest = room.guest === username;

    if (!isHost && !isGuest) {
      return NextResponse.json({ success: true }); // Not in room, nothing to do
    }

    if (isHost) {
      // Host leaves: if guest exists in WAITING → promote guest to host
      if (room.guest && room.status === 'WAITING') {
        room.host = room.guest;
        room.guest = undefined;
        await room.save();
      } else {
        // No guest or game already started → delete room entirely
        await MapGuessRoom.deleteOne({ roomCode: room.roomCode });
      }
    } else if (isGuest) {
      // Guest leaves → always delete room immediately
      await MapGuessRoom.deleteOne({ roomCode: room.roomCode });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
