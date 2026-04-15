import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnLogout = nextUrl.pathname.startsWith('/api/auth/logout');
      // Always allow the logout route
      if (isOnLogout) return true;
      // If we are on login and logged in, redirect to home
      if (isLoggedIn && isOnLogin) {
        return Response.redirect(new URL('/', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user && 'role' in user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role !== undefined) {
        session.user.role = token.role as number;
      }
      return session;
    },
  },
  providers: [], // Cấu hình providers ở file auth.ts
} satisfies NextAuthConfig;
