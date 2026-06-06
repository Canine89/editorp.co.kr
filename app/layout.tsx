import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import Link from 'next/link';
import { AuthButton } from '@/components/AuthButton';

export const metadata: Metadata = {
  title: '편집자P의 AI & 에이전트 유튜브 로드맵',
  description: '편집자P의 AI, 에이전트, 바이브 코딩 강의를 로드맵으로 시각화하여 순서대로 따라올 수 있는 유튜브 학습 가이드입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <div className="layout-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Top Navigation */}
            <header
              style={{
                height: '64px',
                backgroundColor: 'var(--colors-canvas)',
                borderBottom: '1px solid var(--colors-hairline)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src="/p.png"
                    alt="편집자P 캐릭터"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid var(--colors-hairline)',
                    }}
                  />
                  <span
                    className="serif-display"
                    style={{
                      fontSize: '20px',
                      fontWeight: 500,
                      color: 'var(--colors-ink)',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    편집자P 로드맵
                  </span>
                </Link>

                <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <Link
                    href="/"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--colors-muted)',
                      transition: 'color var(--transition-fast)',
                    }}
                    className="nav-link"
                  >
                    로드맵 목록
                  </Link>
                  <Link
                    href="/about"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--colors-muted)',
                      transition: 'color var(--transition-fast)',
                    }}
                    className="nav-link"
                  >
                    소개 & 강의 문의
                  </Link>
                  <a
                    href="https://www.youtube.com/@editorp89"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--colors-muted)',
                      transition: 'color var(--transition-fast)',
                    }}
                    className="nav-link"
                  >
                    유튜브 채널
                  </a>
                  <AuthButton />
                </nav>
              </div>
            </header>

            {/* Main Content Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>

            {/* Dark Footer */}
            <footer
              style={{
                backgroundColor: 'var(--colors-surface-dark)',
                color: 'var(--colors-on-dark-soft)',
                padding: 'var(--spacing-xxl) 0',
                borderTop: '1px solid var(--colors-surface-dark-soft)',
              }}
            >
              <div className="container">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-xl)',
                    marginBottom: 'var(--spacing-xl)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src="/p.png"
                        alt="편집자P 캐릭터"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid var(--colors-surface-dark-soft)',
                        }}
                      />
                      <span className="serif-display" style={{ fontSize: '18px', color: 'var(--colors-on-dark)' }}>
                        편집자P (editorp.co.kr)
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--colors-on-dark-soft)', lineHeight: 1.6 }}>
                      편집자P의 AI, 에이전트, 바이브 코딩 강의를 누구나 쉽게 학습할 수 있도록 단계별 시각 자료로 정리한 교육 로드맵입니다.
                    </p>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: '14px',
                        color: 'var(--colors-on-dark)',
                        marginBottom: '16px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      강의 카테고리
                    </h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <li>
                        <Link href={`/?cat=${encodeURIComponent('AI 기초')}`} style={{ color: 'inherit' }}>
                          AI 기초 및 프롬프트 엔지니어링
                        </Link>
                      </li>
                      <li>
                        <Link href={`/?cat=${encodeURIComponent('AI 에이전트')}`} style={{ color: 'inherit' }}>
                          자율형 AI 에이전트 개발
                        </Link>
                      </li>
                      <li>
                        <Link href={`/?cat=${encodeURIComponent('바이브 코딩')}`} style={{ color: 'inherit' }}>
                          노코드 & 바이브 코딩 실습
                        </Link>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: '14px',
                        color: 'var(--colors-on-dark)',
                        marginBottom: '16px',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      추천 링크
                    </h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <li>
                        <a href="https://goldenrabbit.co.kr" target="_blank" rel="noopener noreferrer">
                          골든래빗 출판사
                        </a>
                      </li>
                      <li>
                        <a href="https://roadmap.sh" target="_blank" rel="noopener noreferrer">
                          roadmap.sh 공식 사이트
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  style={{
                    borderTop: '1px solid var(--colors-surface-dark-soft)',
                    paddingTop: 'var(--spacing-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    fontSize: '12px',
                  }}
                >
                  <span>© {new Date().getFullYear()} 편집자P. All rights reserved.</span>
                  <span>Designed in warm-editorial style.</span>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
