import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import Country from '@/models/Country';
import User from '@/models/User';

// ── GET: fetch all countries (public) ─────────────────────────────────────────
export async function GET() {
  await dbConnect();
  const countries = await Country.find().sort({ name: 1 }).lean();
  return NextResponse.json({ countries });
}

// ── POST: create a new country (role=1 only) ──────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  await dbConnect();
  const user = await User.findOne({ username: session.user.name });
  if (!user || user.role !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const country = await Country.create(body);
  return NextResponse.json({ country }, { status: 201 });
}
