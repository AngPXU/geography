import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/utils/db";
import MapGuessRoom from "@/models/MapGuessRoom";
import { GeoFeature } from "@/models/GeoFeature";

function buildServerQuestions(topic: string, pool: any[]) {
  let subPool = pool;
  if (topic === 'mountain') subPool = subPool.filter((f: any) => f.subCategory === 'mountain');
  if (topic === 'river')    subPool = subPool.filter((f: any) => f.subCategory === 'river');
  if (topic === 'country' || topic.startsWith('country_')) {
    subPool = subPool.filter((f: any) => f.subCategory === 'country_economy');
    if (topic === 'country_pop')  subPool = subPool.filter((f: any) => f.attributes?.population || f.population);
    if (topic === 'country_gdp')  subPool = subPool.filter((f: any) => f.attributes?.gdpTotal || f.gdpTotal);
    if (topic === 'country_life') subPool = subPool.filter((f: any) => f.attributes?.lifeExpectancy || f.lifeExpectancy);
  }
  const shuffled = [...subPool].sort(() => Math.random() - 0.5).slice(0, 10);
  return shuffled.map((t: any) => {
    const attrs = t.attributes || t;
    return {
      lat: t.lat, lng: t.lng,
      name: t.name || attrs.name,
      subCategory: t.subCategory,
      qText: t.name || attrs.name,
      qTitle: t.subCategory || 'Địa điểm',
      qDesc: '',
      population: attrs.population,
      gdpTotal: attrs.gdpTotal,
      lifeExpectancy: attrs.lifeExpectancy,
      region: attrs.region,
      elevation: attrs.elevation,
      length: attrs.length,
      country: attrs.country,
      continent: attrs.continent,
      incomeLevel: attrs.incomeLevel,
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { topic = 'all', password = '' } = body;

    await dbConnect();

    // Build questions server-side from DB — no client fetch needed
    const features = await GeoFeature.find({}).lean();
    const pool = features.map((f: any) => ({ ...f, ...f.attributes })).filter((f: any) => f.lat && f.lng);
    const questions = buildServerQuestions(topic, pool);

    if (questions.length < 5) {
      return NextResponse.json({ success: false, message: "Không đủ dữ liệu câu hỏi. Vui lòng seed dữ liệu bản đồ trước!" }, { status: 400 });
    }

    // Generate random 6 character room code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomCode = '';
    let isUnique = false;
    while (!isUnique) {
      roomCode = '';
      for (let i = 0; i < 6; i++) {
        roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const existing = await MapGuessRoom.findOne({ roomCode });
      if (!existing) isUnique = true;
    }

    const room = await MapGuessRoom.create({
      roomCode,
      password,
      host: session.user.name,
      status: 'WAITING',
      topic,
      questions,
      currentRound: 0,
      hostScore: 0,
      guestScore: 0,
      hostGuesses: [],
      guestGuesses: [],
    });

    return NextResponse.json({ success: true, roomCode: room.roomCode });
  } catch (error: any) {
    console.error("Error creating room:", error);
    return NextResponse.json({ success: false, message: "Internal server error: " + error.message }, { status: 500 });
  }
}
