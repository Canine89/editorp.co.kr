import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "image.yes24.com", pathname: "/goods/**" },
    ],
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
    "/api/admin/books/section": ["./content/books/**"],
    "/api/admin/books/publish": ["./content/books/**"],
    // 문단 댓글 API는 책·절이 있는지만 확인한다 (book.json만 필요)
    "/api/books/[bookId]/[sectionId]/comments": ["./content/books/*/book.json"],
    "/api/books/[bookId]/[sectionId]/comments/[commentId]": ["./content/books/*/book.json"],
  },
};

export default nextConfig;
