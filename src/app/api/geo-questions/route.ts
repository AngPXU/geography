import { NextResponse } from 'next/server';
import dbConnect from '@/utils/db';
import GeoQuestion from '@/models/GeoQuestion';

export async function GET(request: Request) {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const limit  = Math.min(parseInt(searchParams.get('limit')  ?? '10'), 50);
  const page   = Math.max(parseInt(searchParams.get('page')   ?? '1'), 1);
  const topic  = searchParams.get('topic');
  const region = searchParams.get('region');

  const filter: Record<string, any> = {};
  if (topic)  filter.topic  = topic;
  if (region) filter.region = region;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    GeoQuestion.find(filter)
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    GeoQuestion.countDocuments(filter),
  ]);

  return NextResponse.json({ items, total, page, limit });
}
