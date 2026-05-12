import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import { GeoFeature } from '@/models/GeoFeature';
import User from '@/models/User';

type Params = { params: Promise<{ id: string }> };

async function requireAdmin(sessionUserName: string | null | undefined) {
  if (!sessionUserName) return null;
  const user = await User.findOne({ username: sessionUserName });
  if (!user || user.role !== 1) return null;
  return user;
}

// ── GET: lấy một GeoFeature theo _id ─────────────────────────────────────────
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await dbConnect();
  const feature = await GeoFeature.findById(id).lean();
  if (!feature) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ feature });
}

// ── PATCH: cập nhật một GeoFeature theo _id (chỉ admin role=1) ───────────────
export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;

  await dbConnect();
  const admin = await requireAdmin(session?.user?.name);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const updated = await GeoFeature.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ feature: updated });
}

// ── DELETE: xoá một GeoFeature theo _id (chỉ admin role=1) ──────────────────
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  const { id } = await params;

  await dbConnect();
  const admin = await requireAdmin(session?.user?.name);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await GeoFeature.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
