import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        backgroundColor: 'var(--colors-canvas)',
        padding: 'var(--spacing-lg)',
      }}
    >
      <div
        className="card-cream"
        style={{
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(20, 20, 19, 0.03)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '48px',
            color: 'var(--colors-primary)',
            display: 'block',
            marginBottom: 'var(--spacing-md)',
          }}
        >
          ✦
        </span>
        <h1
          className="serif-display"
          style={{
            fontSize: '28px',
            marginBottom: 'var(--spacing-md)',
            color: 'var(--colors-ink)',
          }}
        >
          접근 권한이 없습니다
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--colors-muted)',
            lineHeight: 1.6,
            marginBottom: 'var(--spacing-lg)',
          }}
        >
          이 대시보드는 마스터 관리자 계정(<strong>hgpark@goldenrabbit.co.kr</strong>)으로 로그인한 사용자만 접근할 수 있습니다. 다른 구글 계정으로는 관리자 기능을 이용하실 수 없습니다.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary">
            홈으로 이동
          </Link>
          <Link href="/api/auth/signin" className="btn btn-secondary">
            다른 계정으로 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
