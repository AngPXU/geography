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

    const { roomCode, password } = await req.json();
    if (!roomCode) {
      return NextResponse.json({ success: false, message: "Missing room code" }, { status: 400 });
    }

    await dbConnect();
    const room = await MapGuessRoom.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      return NextResponse.json({ success: false, message: "Phòng không tồn tại" }, { status: 404 });
    }

    if (room.status !== 'WAITING') {
      // Allow rejoin if already in room
      if (room.host === username || room.guest === username) {
        return NextResponse.json({ success: true, roomCode: room.roomCode });
      }
      return NextResponse.json({ success: false, message: "Phòng đã bắt đầu chơi" }, { status: 403 });
    }

    if (room.password && room.password !== password && room.host !== username) {
      return NextResponse.json({ success: false, message: "Sai mật khẩu" }, { status: 403 });
    }

    // Join room
    if (room.host !== username) {
       room.guest = username;
       await room.save();
    }

    return NextResponse.json({ success: true, roomCode: room.roomCode });
  } catch (error: any) {
    console.error("Error joining room:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
