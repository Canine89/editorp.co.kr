import { withAuth, type NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse, type NextFetchEvent } from 'next/server';
import { isAdminEmail } from '@/lib/admin';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const adminMiddleware = withAuth(
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
    // authOptions와 같은 규칙: 운영은 AUTH_SECRET 필수, 개발 모드에만 같은 대체 키
    secret:
      process.env.AUTH_SECRET ||
      (process.env.NODE_ENV === 'development' ? 'dev-only-secret-not-for-production' : undefined),
  }
);

export default function middleware(req: NextRequestWithAuth, event: NextFetchEvent) {
  if (req.nextUrl.pathname === '/_next/image') {
    // 옛 HTML이 최적화 주소를 요청해도 허용된 원본으로만 보낸다.
    const source = req.nextUrl.searchParams.get('url');
    if (source) {
      try {
        const target = new URL(source, req.nextUrl.origin);
        const localPath = /^\/(covers|character|learning|selected-books|articles|books|icons|og)\//.test(target.pathname) ||
          /^\/(cursor-ambassador|hero|p|icon)\.png$/.test(target.pathname);
        const local = target.origin === req.nextUrl.origin && localPath;
        const remote = target.protocol === 'https:' && (
          (target.hostname === 'i.ytimg.com' && target.pathname.startsWith('/vi/')) ||
          (target.hostname === 'image.yes24.com' && target.pathname.startsWith('/goods/'))
        );
        if (local || remote) return NextResponse.redirect(target, 307);
      } catch { /* 잘못된 URL은 아래에서 거절한다. */ }
    }
    return new NextResponse('지원하지 않는 이미지 주소입니다.', { status: 400 });
  }
  return adminMiddleware(req, event);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/_next/image'],
};
