import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export const proxy = NextAuth(authConfig).auth;

export const config = {
  // Bỏ qua các đường dẫn API tĩnh, Next.js static files và file ảnh
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.json$|sw\\.js$).*)'],
};
