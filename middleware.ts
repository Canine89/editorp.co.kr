import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default withAuth(
  function middleware(req) {
    // CSRF 완화: 관리자 API의 상태 변경 요청은 same-origin에서 온 것만 허용
    if (req.nextUrl.pathname.startsWith('/api/admin') && MUTATING_METHODS.has(req.method)) {
      const origin = req.headers.get('origin');
      let sameOrigin = false;
      try {
        sameOrigin = Boolean(origin) && new URL(origin!).host === req.nextUrl.host;
      } catch {
        sameOrigin = false;
      }
      if (!sameOrigin) {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
      }
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // 관리자 라우트는 지정된 관리자 계정만 접근 허용
        return isAdminEmail(token?.email);
      },
    },
    pages: {
      signIn: '/api/auth/signin',
      error: '/auth/unauthorized',
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
