import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 도서 원본(content/books)을 서버리스 함수 번들에 포함시킨다.
  // 도서 페이지가 동적 렌더링으로 런타임에 파일을 읽기 때문에 필요하다.
  outputFileTracingIncludes: {
    '/books': ['./content/books/**'],
    '/books/[bookId]': ['./content/books/**'],
    '/books/[bookId]/[sectionId]': ['./content/books/**'],
    '/admin/books': ['./content/books/**'],
    '/api/admin/books/section': ['./content/books/**'],
    '/api/admin/books/publish': ['./content/books/**'],
  },
};

export default nextConfig;
