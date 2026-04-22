import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

// In-memory rate limiting map for basic protection on Serverless/Edge
// Giới hạn Request theo IP (Map sẽ làm mới trên từng Lambda runtime)
type RateLimitData = { count: number; lastReset: number };
const rateLimitMap = new Map<string, RateLimitData>();

export default auth((req) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const path = req.nextUrl.pathname;

  // 1. Rate Limiting (Trạm gác chống Spam/DDoS cơ bản)
  // Chỉ khoá các route nhạy cảm để không làm nghẽn người dùng bình thường
  if (path.startsWith('/api/auth/register') || path === '/login') {
    const windowMs = 60 * 1000; // 1 phút
    const maxRequests = 20; // Tối đa 20 lượt thử đăng ký/login mỗi phút

    let rateData = rateLimitMap.get(ip);
    if (!rateData || now - rateData.lastReset > windowMs) {
      rateData = { count: 1, lastReset: now };
    } else {
      rateData.count++;
    }
    rateLimitMap.set(ip, rateData);

    if (rateData.count > maxRequests) {
      return new NextResponse('Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.', { status: 429 });
    }
  }

  // 2. Chốt chặn RBAC (Chống IDOR - Unauthorized)
  // /admin và /api/admin chỉ dành cho role 1 (Admin)
  if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
    const isLoggedIn = !!req.auth;
    const userRole = req.auth?.user?.role as number | undefined;

    if (!isLoggedIn || userRole !== 1) {
      // Nếu là lời gọi API, trả JSON Error
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden. Khu vực này chỉ dành cho Quản trị viên (Role 1).' }, { status: 403 });
      }
      // Nếu là load UI, đá về trang chủ
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  }

  // Khởi tạo response mặc định cho Request đi qua
  const response = NextResponse.next();

  // 3. Security Headers (Giáp gai Frontend)

  // (a) HSTS: Bắt ép chạy HTTPS
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // (b) X-Frame-Options: Chống Clickjacking bằng Iframe
  response.headers.set('X-Frame-Options', 'DENY');

  // (c) X-Content-Type-Options: Chống MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // (d) CSP - Content Security Policy
  // * Cho phép script dạng inline/eval cho các thư viện đặc biệt.
  // * Cho phép LiveKit (wss/ws), Mapbox (api.mapbox).
  // * Hình ảnh tải thoải mái từ mọi URL.
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://unpkg.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com https://unpkg.com;
    img-src 'self' blob: data: https://* http://*;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' wss: ws: https://* http://*;
    frame-src 'self' https://*;
    media-src 'self' blob: https://*;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
});

// Matcher config: Chỉ chạy middleware trên những router nhất định
export const config = {
  matcher: [
    /*
     * Kích hoạt trên tất cả API và Router giao diện. 
     * Bỏ qua các file tĩnh (CSS, Hình ảnh, Next.js core)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
