import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import GeoBook from '@/models/GeoBook';
import path from 'path';
import fs from 'fs';

// GET — lấy danh sách tất cả sách (có thể filter theo grade)
export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const grade = searchParams.get('grade');
  const filter = grade ? { grade: parseInt(grade) } : {};
  const books = await GeoBook.find(filter).sort({ grade: 1 }).lean();
  return NextResponse.json({ books });
}
