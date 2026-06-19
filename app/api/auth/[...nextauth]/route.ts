import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { ADMIN_EMAIL, isAdminEmail } from '@/lib/admin';

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
              email: { label: "이메일", type: "email", placeholder: ADMIN_EMAIL },
              password: { label: "비밀번호 ('admin' 입력)", type: "password" }
            },
            async authorize(credentials) {
              if (
                credentials?.email === ADMIN_EMAIL &&
                credentials?.password === 'admin'
              ) {
                return {
                  id: 'dev-admin',
                  name: 'Master Admin',
                  email: ADMIN_EMAIL,
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
        // 클라이언트에서 이메일 문자열 비교 없이 관리자 UI를 분기할 수 있도록 플래그 제공
        session.user.isAdmin = isAdminEmail(token.email as string);
      }
      return session;
    }
  },
  pages: {
    error: '/auth/unauthorized',
  },
  // 운영 환경에서 AUTH_SECRET이 없으면 NextAuth가 기동을 거부하도록 fallback은 개발 모드에만 허용
  secret:
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === 'development' ? 'dev-only-secret-not-for-production' : undefined),
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
