import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Character } from "@/components/Character";
import { ScrollEffects } from "@/components/ScrollEffects";
import { BUSINESS, BUSINESS_LOOKUP_URL, OPEN_CHAT_URL } from "@/lib/business";

export const metadata: Metadata = {
  metadataBase: new URL("https://editorp.co.kr"),
  title: "편집자P의 AI 서재",
  description:
    "IT 도서 편집자 박현규(편집자P)가 AI 강의를 배울 순서대로 엮은 로드맵, 무료로 읽는 책, 강의 이력을 모았습니다.",
  // 공유 미리보기: 카카오톡 등은 200px 미만 이미지를 무시하므로 1200×630 전용 이미지를 쓴다 (scripts/make-og-images.py)
  openGraph: {
    siteName: "편집자P의 AI 서재",
    title: "편집자P의 AI 서재",
    description: "AI 강의 로드맵, 무료로 읽는 책, 강의 이력.",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og/site.jpg", width: 1200, height: 630, alt: "편집자P의 AI 서재" }],
  },
  twitter: { card: "summary_large_image", images: ["/og/site.jpg"] },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/EditorPSans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('reader-size');if(s==='s'||s==='l')document.documentElement.dataset.size=s}catch(e){}})()`,
          }}
        />
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        <Providers>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100dvh",
            }}
          >
            <Header />
            <ScrollEffects />
            <main
              id="main-content"
              tabIndex={-1}
              style={{ flex: 1, minWidth: 0 }}
            >
              {children}
            </main>
            <footer className="site-footer">
              <Character id="footer-back" height={72} />
              <div className="container">
                <span>© {new Date().getFullYear()} 편집자P · 박현규</span>
                <nav aria-label="바깥 링크">
                  <Link href="/videos">전체 영상</Link>
                  <Link href="/edited-books">참여한 책</Link>
                  <a
                    className="ext"
                    href="https://www.youtube.com/channel/UC4PwAtNhPsuBYdavDJb4F0g"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    유튜브
                  </a>
                  <a
                    className="ext"
                    href={OPEN_CHAT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    내 코드를 부탁해 오픈카톡방
                  </a>
                  <a href="mailto:hgpark@goldenrabbit.co.kr">hgpark@goldenrabbit.co.kr</a>
                </nav>
              </div>
              {/* 사업자 정보 (전자상거래법 제10조). 값은 lib/business.ts 한 곳에서 관리한다 */}
              <div className="container site-biz">
                <nav aria-label="약관과 정책">
                  <Link href="/terms">이용약관</Link>
                  <Link href="/privacy">
                    <b>개인정보처리방침</b>
                  </Link>
                  <Link href="/refund">환불 규정</Link>
                </nav>
                <p>
                  <span>상호 {BUSINESS.name}</span>
                  <span>대표 {BUSINESS.owner}</span>
                  <span>사업자등록번호 {BUSINESS.registrationNo}</span>
                  {BUSINESS.mailOrderNo && <span>통신판매업 신고 {BUSINESS.mailOrderNo}</span>}
                  <a className="ext" href={BUSINESS_LOOKUP_URL} target="_blank" rel="noopener noreferrer">
                    사업자정보 확인
                  </a>
                </p>
                <p>
                  <span>주소 {BUSINESS.address}</span>
                  {BUSINESS.phone && <span>고객센터 {BUSINESS.phone}</span>}
                  <span>이메일 {BUSINESS.email}</span>
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
