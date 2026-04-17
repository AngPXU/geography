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
  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'));
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({})
      .select('username email role fullName exp streak createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(),
  ]);

  return NextResponse.json({ users, total, page, limit });
}
