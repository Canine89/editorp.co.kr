import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://editorp.co.kr"),
  title: "편집자P의 AI 학습 로드맵 | 배움에도 좋은 순서가 있습니다",
  description:
    "편집자P의 AI·클로드·커서·코덱스 유튜브 강의를 목표별 학습 경로로 만나보세요. 기초 개념부터 웹사이트 만들기와 업무 자동화까지, 책과 영상으로 차근차근 안내합니다.",
  openGraph: {
    title: "편집자P의 AI 학습 로드맵",
    description: "흩어진 강의를 하나의 흐름으로, 배운 것을 나의 결과물로.",
    locale: "ko_KR",
    type: "website",
    images: ["/p.png"],
  },
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
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`,
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
            <main
              id="main-content"
              tabIndex={-1}
              style={{ flex: 1, minWidth: 0 }}
            >
              {children}
            </main>
            <footer className="site-footer">
              <div className="container">
                <div className="footer-main">
                  <div>
                    <Link href="/" className="footer-brand">
                      <Image src="/p.png" alt="" width={30} height={30} />
                      편집자P의 AI 강의·편집실
                    </Link>
                    <p>
                      책을 만들고, 기술을 배우고, 경험을 나눕니다.
                      <br />
                      당신의 다음 배움에 좋은 순서가 되어드릴게요.
                    </p>
                  </div>
                  <nav aria-label="학습 바로가기">
                    <strong>함께 배우기</strong>
                    <Link href="/#roadmap-list">학습 로드맵</Link>
                    <Link href="/videos">전체 영상</Link>
                    <Link href="/books">무료 도서</Link>
                    <Link href="/qna">질문 게시판</Link>
                  </nav>
                  <nav aria-label="편집자P 연결">
                    <strong>편집자P와 연결하기</strong>
                    <Link href="/about">소개와 강의 문의</Link>
                    <Link href="/edited-books">편집한 도서</Link>
                    <a
                      href="https://www.youtube.com/channel/UC4PwAtNhPsuBYdavDJb4F0g"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      유튜브 채널 ↗
                    </a>
                    <a
                      href="https://open.kakao.com/o/ggK7EAJh"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      내 코드를 부탁해 오픈카톡방 ↗
                    </a>
                  </nav>
                </div>
                <div className="footer-bottom">
                  <span>
                    © {new Date().getFullYear()} 편집자P. 모든 권리 보유.
                  </span>
                  <span>배움을 쌓고, 나의 가능성을 넓히는 공간.</span>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
