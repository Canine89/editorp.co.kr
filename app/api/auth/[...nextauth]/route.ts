import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || 'placeholder',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || 'placeholder',
    }),
    // Dev credentials provider to make local testing simple
    ...(process.env.NODE_ENV === 'development'
      ? [
          CredentialsProvider({
            name: '로컬 관리자 로그인 (개발 모드 전용)',
            credentials: {
              email: { label: "이메일", type: "email", placeholder: "hgpark@goldenrabbit.co.kr" },
              password: { label: "비밀번호 ('admin' 입력)", type: "password" }
            },
            async authorize(credentials) {
              if (
                credentials?.email === 'hgpark@goldenrabbit.co.kr' &&
                credentials?.password === 'admin'
              ) {
                return {
                  id: 'dev-admin',
                  name: 'Master Admin',
                  email: 'hgpark@goldenrabbit.co.kr',
                };
              }
              return null;
            }
          })
        ]
      : [])
  ],
  callbacks: {
    async signIn({ user }) {
      // 일반 사용자도 구글 로그인 허용 (Q&A 게시판 작성용).
      // 관리자 영역(/admin, /api/admin)은 middleware에서 이메일로 별도 차단한다.
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
      }
      return session;
    }
  },
  pages: {
    error: '/auth/unauthorized',
  },
  secret: process.env.AUTH_SECRET || 'fallback-secret-for-development-purposes-only-12345',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
