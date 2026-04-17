import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== 1) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page    = Math.max(1, parseInt(searchParams.get('page')    || '1'));
  const limit   = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '14')));
  const search  = (searchParams.get('search') || '').trim();
  const role    = searchParams.get('role')    || 'all';
  const sort    = searchParams.get('sort')    || 'createdAt';
  const sortDir = searchParams.get('sortDir') === 'asc' ? 1 : -1;
  const skip    = (page - 1) * limit;

  const query: Record<string, unknown> = {};
  if (role !== 'all' && ['1', '2', '3'].includes(role)) {
    query.role = parseInt(role);
  }
  if (search) {
    query.$or = [
      { username: { $regex: search, $options: 'i' } },
      { email:    { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
    ];
  }

  const ALLOWED_SORTS = ['username', 'email', 'exp', 'streak', 'createdAt'];
  const sortField = ALLOWED_SORTS.includes(sort) ? sort : 'createdAt';

  const [users, total] = await Promise.all([
    User.find(query)
      .select('username email role fullName exp streak createdAt provider avatar')
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return NextResponse.json({ users, total, page, limit });
}
