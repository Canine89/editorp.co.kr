import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "image.yes24.com", pathname: "/goods/**" },
    ],
  },
  // 질문 게시판은 닫았다(독자 질문은 서재 문단 댓글로). 옛 주소로 오면 서재로 보낸다
  async redirects() {
    return [
      { source: "/qna", destination: "/books", permanent: false },
      { source: "/qna/:path*", destination: "/books", permanent: false },
    ];
  },
  // 도서 원본(content/books)을 서버리스 함수 번들에 포함시킨다.
  // 도서 페이지가 동적 렌더링으로 런타임에 파일을 읽기 때문에 필요하다.
  outputFileTracingIncludes: {
    "/": ["./content/books/**"],
    "/books": ["./content/books/**"],
    "/books/[bookId]": ["./content/books/**"],
    "/books/[bookId]/[sectionId]": ["./content/books/**"],
    "/admin/books": ["./content/books/**"],
    "/admin/books/[bookId]": ["./content/books/**"],
    // 댓글 수신함은 어느 문단인지 보이려고 절을 렌더링한다
    "/admin/comments": ["./content/books/**"],
    "/api/admin/books/section": ["./content/books/**"],
    "/api/admin/books/publish": ["./content/books/**"],
    "/api/admin/books/block": ["./content/books/**"],
    // 문단 댓글 API는 책·절이 있는지만 확인한다 (book.json만 필요)
    "/api/books/[bookId]/[sectionId]/comments": ["./content/books/*/book.json"],
    "/api/books/[bookId]/[sectionId]/comments/[commentId]": ["./content/books/*/book.json"],
  },
};

export default nextConfig;
