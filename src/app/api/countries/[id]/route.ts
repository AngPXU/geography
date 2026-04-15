import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import Country from '@/models/Country';
import User from '@/models/User';

type Params = { params: Promise<{ id: string }> };

async function requireAdmin(sessionUserName: string | null | undefined) {
  if (!sessionUserName) return null;
  const user = await User.findOne({ username: sessionUserName });
  if (!user || user.role !== 1) return null;
  return user;
}

// ── PATCH: update a country (role=1) ─────────────────────────────────────────
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;

  await dbConnect();
  const admin = await requireAdmin(session?.user?.name);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = await Country.findByIdAndUpdate(id, { $set: body }, { new: true });
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ country: updated });
}

// ── DELETE: remove a country (role=1) ─────────────────────────────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;

  await dbConnect();
  const admin = await requireAdmin(session?.user?.name);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await Country.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
