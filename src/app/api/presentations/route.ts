import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/utils/db';
import Presentation from '@/models/Presentation';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const grade = url.searchParams.get('grade');
    const id = url.searchParams.get('id');

    await dbConnect();
    
    // Lấy 1 bài giảng cụ thể để soạn thảo
    if (id) {
      const presentation = await Presentation.findById(id);
      return NextResponse.json({ presentation }, { status: 200 });
    }

    // Lấy danh sách bài giảng theo khối lớp
    if (grade) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '15');
      const search = url.searchParams.get('search') || '';
      const sort = url.searchParams.get('sort') || 'newest';

      const query: any = { grade: parseInt(grade) };
      const userRole = (session.user as any).role;
      if (userRole !== 1 && userRole !== 2) {
        query.author = session.user.name;
      }
      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      let sortObj: any = { updatedAt: -1 };
      if (sort === 'oldest') sortObj = { updatedAt: 1 };
      else if (sort === 'az') sortObj = { title: 1 };
      else if (sort === 'za') sortObj = { title: -1 };

      const total = await Presentation.countDocuments(query);
      const presentations = await Presentation.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit);

      return NextResponse.json({ 
        presentations, 
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
      }, { status: 200 });
    }

    return NextResponse.json({ error: 'Missing id or grade parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching presentation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();

    if (body.id) {
      // Cập nhật bài giảng đã có
      const updateData: any = {
        title: body.title,
        updatedAt: Date.now()
      };
      if (body.blocks !== undefined) {
        updateData.blocks = body.blocks;
      }

      const updateQuery: any = { _id: body.id };
      const userRole = (session.user as any).role;
      if (userRole !== 1 && userRole !== 2) {
        updateQuery.author = session.user.name;
      }

      const presentation = await Presentation.findOneAndUpdate(
        updateQuery,
        updateData,
        { new: true }
      );
      
      if (!presentation) {
        return NextResponse.json({ error: 'Presentation not found or unauthorized' }, { status: 404 });
      }
      return NextResponse.json({ success: true, presentation }, { status: 200 });
    } else {
      // Tạo bài giảng mới
      const presentation = await Presentation.create({
        title: body.title || 'Bài giảng mới',
        grade: body.grade || 6,
        author: session.user.name,
        blocks: [],
      });
      return NextResponse.json({ success: true, presentation }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error creating presentation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    await dbConnect();
    
    const deleteQuery: any = { _id: id };
    const userRole = (session.user as any).role;
    if (userRole !== 1 && userRole !== 2) {
      deleteQuery.author = session.user.name;
    }
    
    const deleted = await Presentation.findOneAndDelete(deleteQuery);
    if (!deleted) {
      return NextResponse.json({ error: 'Presentation not found or unauthorized' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting presentation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
