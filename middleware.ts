import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        // Only allow hgpark@goldenrabbit.co.kr to access admin routes
        return token?.email === 'hgpark@goldenrabbit.co.kr';
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
