import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from './utils/db';
import User from './models/User';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        await dbConnect();
        
        const user = await User.findOne({ username: credentials.username });
        
        if (!user || !user.password) {
          throw new Error('User not found.');
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordMatch) {
          throw new Error('Invalid password.');
        }

        try {
          const headersList = await headers();
          const ip = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || 'Unknown';
          if (ip !== 'Unknown') {
            await User.findByIdAndUpdate(user._id, { ipAddress: ip });
          }
        } catch (error) {
          console.error("Lỗi khi cập nhật IP lúc đăng nhập:", error);
        }

        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          image: user.avatar,
          role: user.role,
        };
      }
    })
  ],
});
