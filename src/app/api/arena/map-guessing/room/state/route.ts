import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import MapGuessRoom from "@/models/MapGuessRoom";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    
    const roomCode = req.nextUrl.searchParams.get('code');
    if (!roomCode) {
      return NextResponse.json({ success: false, message: "Missing room code" }, { status: 400 });
    }

    await dbConnect();
    const room = await MapGuessRoom.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      return NextResponse.json({ success: false, message: "Room not found" }, { status: 404 });
    }

    const isHost = room.host === session.user.name;
    const isGuest = room.guest === session.user.name;
    
    if (!isHost && !isGuest) {
       return NextResponse.json({ success: false, message: "Not permitted" }, { status: 403 });
    }

    // Auto-cleanup: delete SUMMARY rooms older than 5 minutes so old room codes can't be re-entered
    if (room.status === 'SUMMARY') {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const roomAge = room.updatedAt ? new Date(room.updatedAt).getTime() : 0;
      if (roomAge < fiveMinAgo) {
        await MapGuessRoom.deleteOne({ roomCode: room.roomCode });
        return NextResponse.json({ success: false, message: "Room expired" }, { status: 404 });
      }
    }

    // Auto-timeout check on the server
    let updated = false;
    if (room.status === 'PLAYING' && room.roundEndsAt && Date.now() > new Date(room.roundEndsAt).getTime()) {
      // Time is up! Check if host or guest missed
      const r = room.currentRound;
      
      const hostG = room.hostGuesses[r];
      if (!hostG) {
         room.hostGuesses.push({ lat: 0, lng: 0, dist: 99999, score: 0 });
         room.markModified('hostGuesses');
      }
      const guestG = room.guestGuesses[r];
      if (!guestG) {
         room.guestGuesses.push({ lat: 0, lng: 0, dist: 99999, score: 0 });
         room.markModified('guestGuesses');
      }

      if (!hostG || !guestG) {
         // Everyone who missed has 0. 
         // But we MUST advance the round immediately to signal the next state.
         // Actually, client uses "Both have guessed OR Time is up" to transition to RoundEnd (show answers).
         // Server doesn't increment currentRound here. It just registers the 0s. 
         // The Client triggers `POST /action` to go to NEXT round.
         updated = true;
      }
    }
    if (updated) await room.save();

    // Mask the remaining questions' exact answers from the state to prevent cheating, 
    // but we can just send the questions array as is because it's a casual educational game 
    // (the host sent them anyway).

    return NextResponse.json({ 
      success: true, 
      state: {
         status: room.status,
         isPrivate: !!room.password,
         host: room.host,
         guest: room.guest || null,
         topic: room.topic,
         questions: room.questions,
         currentRound: room.currentRound,
         roundEndsAt: room.roundEndsAt ? new Date(room.roundEndsAt).getTime() : null,
         serverTime: Date.now(),
         hostGuesses: room.hostGuesses,
         guestGuesses: room.guestGuesses,
         hostScore: room.hostScore,
         guestScore: room.guestScore,
         winner: room.winner || null,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
