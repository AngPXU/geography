import { cookies } from 'next/headers';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  // Xóa tất cả cookie trong session (bao gồm mọi cookie của Next Auth)
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name);
  }

  // Redirect về login với URL tuyệt đối
  const origin = request.nextUrl.origin;
  return Response.redirect(`${origin}/login`, 302);
}
