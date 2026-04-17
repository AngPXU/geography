import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import User from '@/models/User';

// GET /api/homeclass/search-students
// ?q=...&className=...&sort=username|exp|streak&sortDir=asc|desc&limit=5
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q         = searchParams.get('q')?.trim()         || '';
    const className = searchParams.get('className')?.trim() || '';
    const sort      = searchParams.get('sort')              || 'username';
    const sortDir   = searchParams.get('sortDir') === 'desc' ? -1 : 1;
    const limit     = Math.min(Number(searchParams.get('limit') || '5'), 20);

    // Build filter — only students (role=3)
    const filter: Record<string, unknown> = { role: 3 };
    if (q) {
      filter.$or = [
        { username: { $regex: q, $options: 'i' } },
        { fullName: { $regex: q, $options: 'i' } },
      ];
    }
    if (className) filter.className = className;

    const allowedSort: Record<string, string> = { username: 'username', exp: 'exp', streak: 'streak' };
    const sortField = allowedSort[sort] ?? 'username';

    const [students, allClasses] = await Promise.all([
      User.find(filter)
        .sort({ [sortField]: sortDir })
        .limit(limit)
        .select('_id username fullName avatar className')
        .lean(),
      // Distinct classNames for filter pills (only students)
      User.distinct('className', { role: 3, className: { $nin: [null, ''] } }),
    ]);

    return NextResponse.json({ students, classNames: allClasses.sort() });
  } catch (err) {
    console.error('[search-students GET]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
