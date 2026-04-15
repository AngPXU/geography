import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import GeoFunFact from '@/models/GeoFunFact';

export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8'), 50);
  const page  = Math.max(parseInt(searchParams.get('page')  ?? '1'), 1);
  const topic = searchParams.get('topic');

  const filter: Record<string, any> = {};
  if (topic) filter.topic = topic;

  const [items, total] = await Promise.all([
    GeoFunFact.find(filter).sort({ generatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    GeoFunFact.countDocuments(filter),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
