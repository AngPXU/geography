import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import { OldTest } from '@/models/OldTest';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Chỉ admin (1) và giáo viên (2) mới dùng chức năng này
    if (session.user.role !== 1 && session.user.role !== 2) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();
    // Giáo viên chỉ thấy test của mình, admin thấy hết
    const query = session.user.role === 1 ? {} : { authorId: session.user.id };
    const tests = await OldTest.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ tests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== 1 && session.user.role !== 2)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Thiếu tên bài kiểm tra' }, { status: 400 });
    }

    await dbConnect();
    const newTest = await OldTest.create({
      title: body.title,
      subject: body.subject,
      grade: body.grade,
      description: body.description,
      authorId: session.user.id as string,
      authorName: session.user.name || (session.user as any).username || 'Giáo viên',
      questions: [],
    });

    return NextResponse.json({ test: newTest });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
