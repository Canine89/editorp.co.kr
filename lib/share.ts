/**
 * 페이지 공유 미리보기(Open Graph). 페이지에서 openGraph를 정하면 레이아웃 값을 통째로 대체하므로
 * 이미지·사이트 이름까지 함께 넣는다. 기본 이미지는 scripts/make-og-images.py가 만든 public/og/site.jpg
 */
export function pageShareMetadata(opts: { title: string; description: string; path: string; image?: string }) {
  const image = { url: opts.image ?? "/og/site.jpg", width: 1200, height: 630, alt: opts.title };
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      siteName: "편집자P의 AI 서재",
      title: opts.title,
      description: opts.description,
      url: opts.path,
      locale: "ko_KR",
      type: "website" as const,
      images: [image],
    },
    twitter: { card: "summary_large_image" as const, title: opts.title, description: opts.description, images: [image.url] },
  };
}
