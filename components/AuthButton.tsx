'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <span style={{ fontSize: '14px', color: 'var(--colors-muted-soft)' }}>
        불러오는 중...
      </span>
    );
  }

  const isAdmin = Boolean(session?.user?.isAdmin);

  if (session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isAdmin && (
          <Link
            href="/admin"
            className="btn btn-primary"
            style={{
              height: '32px',
              padding: '0 12px',
              fontSize: '13px',
              borderRadius: 'var(--rounded-md)',
            }}
          >
            관리자 패널
          </Link>
        )}
        <span
          style={{
            fontSize: '13px',
            color: 'var(--colors-body-strong)',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={session.user?.email || ''}
        >
          {session.user?.name || '관리자'}님
        </span>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="btn-text"
          style={{
            fontSize: '14px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="btn-text"
      style={{
        fontSize: '14px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontWeight: 500,
        fontFamily: 'inherit',
      }}
    >
      로그인
    </button>
  );
}
