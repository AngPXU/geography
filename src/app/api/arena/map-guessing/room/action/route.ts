import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import MapGuessRoom from "@/models/MapGuessRoom";
import User from "@/models/User";
import ArenaMatchHistory from "@/models/ArenaMatchHistory";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    const username = session.user.name;
    const body = await req.json();
    const { roomCode, action, payload } = body;
    // actions: 'START_GAME', 'SUBMIT_GUESS', 'NEXT_ROUND'

    await dbConnect();
    const room = await MapGuessRoom.findOne({ roomCode: roomCode.toUpperCase() });
    if (!room) return NextResponse.json({ success: false, message: "Room not found" }, { status: 404 });

    const isHost = room.host === username;
    const isGuest = room.guest === username;
    if (!isHost && !isGuest) return NextResponse.json({ success: false, message: "Not permitted" }, { status: 403 });

    let requireSave = false;

    if (action === 'START_GAME' && isHost) {
      if (room.status === 'WAITING' && room.guest) {
        room.status = 'PLAYING';
        room.currentRound = 0;
        room.roundEndsAt = new Date(Date.now() + 12000 + 1000); // 12s + 1s buffer
        requireSave = true;
      }
    } 
    else if (action === 'SUBMIT_GUESS' && room.status === 'PLAYING') {
      const { lat, lng, dist, score } = payload;
      const r = room.currentRound;
      
      let changed = false;
      if (isHost && !room.hostGuesses[r]) {
         room.hostGuesses.push({ lat, lng, dist, score });
         room.hostScore += score;
         room.markModified('hostGuesses');
         changed = true;
      } else if (isGuest && !room.guestGuesses[r]) {
         room.guestGuesses.push({ lat, lng, dist, score });
         room.guestScore += score;
         room.markModified('guestGuesses');
         changed = true;
      }

      if (changed) requireSave = true;
    }
    else if (action === 'NEXT_ROUND' && isHost && room.status === 'PLAYING') {
      // Move to next round
      if (room.currentRound < 9) {
         room.currentRound += 1;
         room.roundEndsAt = new Date(Date.now() + 12000 + 1000); // Next 12s
      } else {
         room.status = 'SUMMARY';
         // Evaluate winner
         if (room.hostScore > room.guestScore) room.winner = room.host;
         else if (room.guestScore > room.hostScore) room.winner = room.guest;
         else room.winner = 'DRAW';

         // Award 50 XP to winner
         if (room.winner !== 'DRAW') {
             await User.updateOne({ username: room.winner }, { $inc: { exp: 50 } });
             await ArenaMatchHistory.create({
                 username: room.host,
                 gameMode: 'map-guessing-duo',
                 topic: room.topic,
                 score: room.hostScore,
                 expEarned: room.winner === room.host ? 50 : 0
             });
             await ArenaMatchHistory.create({
                 username: room.guest,
                 gameMode: 'map-guessing-duo',
                 topic: room.topic,
                 score: room.guestScore,
                 expEarned: room.winner === room.guest ? 50 : 0
             });
         }
      }
      requireSave = true;
    }

    if (requireSave) await room.save();
    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Internal server error", error: error.message }, { status: 500 });
  }
}
