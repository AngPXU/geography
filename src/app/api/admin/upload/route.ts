import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role > 2) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}
    
    await writeFile(join(uploadDir, uniqueName), buffer);
    return NextResponse.json({ url: `/uploads/${uniqueName}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
