import { cookies } from 'next/headers';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  // Xóa tất cả cookie Next Auth v5 (authjs.*)
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    cookieStore.delete(cookie.name);
  }

  // Hard redirect về /login dùng URL tuyệt đối theo origin của request
  const origin = request.nextUrl.origin;
  return Response.redirect(`${origin}/login`, 302);
}
