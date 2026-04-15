import { NextResponse } from 'next/server';

/**
 * Vercel Cron Job Endpoint — tự động kích hoạt lúc 0h00 và 12h00 UTC+7
 * Config trong vercel.json:
 * "crons": [
 *   { "path": "/api/cron/geo-questions", "schedule": "0 17 * * *" },   <- 0h00 UTC+7
 *   { "path": "/api/cron/geo-questions", "schedule": "0 5 * * *"  }    <- 12h00 UTC+7
 * ]
 */
export async function GET(request: Request) {
  // Xác thực Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hour = new Date().getUTCHours();
  const session: '00:00' | '12:00' = hour < 6 ? '00:00' : '12:00';

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const headers = {
    'Content-Type': 'application/json',
    'x-cron-secret': process.env.CRON_SECRET ?? '',
  };
  const body = JSON.stringify({ session });

  // Gọi song song cả 2 API generate nội bộ
  const [resQuestions, resFunFacts] = await Promise.all([
    fetch(`${baseUrl}/api/geo-questions/generate`, { method: 'POST', headers, body }),
    fetch(`${baseUrl}/api/geo-funfacts/generate`, { method: 'POST', headers, body })
  ]);

  const jsonQuestions = await resQuestions.json();
  const jsonFunFacts = await resFunFacts.json();

  return NextResponse.json({ 
    questions: jsonQuestions, 
    funfacts: jsonFunFacts 
  }, { 
    status: resQuestions.ok && resFunFacts.ok ? 200 : 500 
  });
}
