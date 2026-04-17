import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import HomeClass from '@/models/HomeClass';

// GET /api/admin/classrooms
// ?page=1&limit=14&search=...&grade=6&sort=name|grade|members|createdAt&sortDir=asc|desc
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 1) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page    = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit   = Math.min(50, Number(searchParams.get('limit') ?? '14'));
    const search  = searchParams.get('search')?.trim() ?? '';
    const grade   = searchParams.get('grade');
    const sort    = searchParams.get('sort') ?? 'createdAt';
    const sortDir = searchParams.get('sortDir') === 'asc' ? 1 : -1;

    const match: Record<string, unknown> = {};
    if (search) {
      match.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { teacherName: { $regex: search, $options: 'i' } },
      ];
    }
    if (grade) match.grade = Number(grade);

    // Map UI sort key → aggregation field (use $size for members count)
    const sortField = sort === 'members' ? 'memberCount' : (
      ['name', 'grade', 'createdAt'].includes(sort) ? sort : 'createdAt'
    );

    const [classes, countResult] = await Promise.all([
      HomeClass.aggregate([
        { $match: match },
        { $addFields: { memberCount: { $size: '$members' } } },
        { $sort: { [sortField]: sortDir } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
      HomeClass.aggregate([
        { $match: match },
        { $count: 'total' },
      ]),
    ]);

    const total = countResult[0]?.total ?? 0;
    return NextResponse.json({ classes, total });
  } catch (err) {
    console.error('[admin/classrooms GET]', err);
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}
