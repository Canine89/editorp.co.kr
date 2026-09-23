import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Character } from "@/components/Character";
import { ScrollEffects } from "@/components/ScrollEffects";

export const metadata: Metadata = {
  metadataBase: new URL("https://editorp.co.kr"),
  title: "편집자P의 AI 서재",
  description:
    "IT 도서 편집자 박현규(편집자P)가 AI 강의를 배울 순서대로 엮은 로드맵, 무료로 읽는 책, 강의 이력을 모았습니다.",
  openGraph: {
    title: "편집자P의 AI 서재",
    description: "AI 강의 로드맵, 무료로 읽는 책, 강의 이력.",
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
              <Character id="footer-back" height={92} />
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
                    href="https://open.kakao.com/o/ggK7EAJh"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    내 코드를 부탁해 오픈카톡방
                  </a>
                  <a href="mailto:hgpark@goldenrabbit.co.kr">hgpark@goldenrabbit.co.kr</a>
                </nav>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
