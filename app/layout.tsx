import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: '편집자P의 AI & 에이전트 무료 강의 로드맵',
  description: '편집자P의 AI, 에이전트, 바이브 코딩 무료 유튜브 강의를 입문자도 순서대로 따라갈 수 있게 정리한 학습 로드맵입니다.',
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
            <Header />

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
                      무료 강의가 많아도 헤매지 않도록, 입문자의 눈높이에 맞춰 볼 순서와 흐름을 정리했습니다.
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
                      함께 보기
                    </h4>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <li>
                        <a href="https://www.youtube.com/@editorp89" target="_blank" rel="noopener noreferrer">
                          편집자P 유튜브 채널
                        </a>
                      </li>
                      <li>
                        <a href="https://open.kakao.com/o/ggK7EAJh" target="_blank" rel="noopener noreferrer">
                          내 코드를 부탁해 오픈카톡방
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
                  <span>무료 강의를 헤매지 않도록 차근차근 엮었습니다.</span>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
