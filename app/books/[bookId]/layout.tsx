import "../reader.css";

/** 책 안의 목차·리더·모바일 설정에 표지 팔레트를 함께 적용한다. */
export default async function BookLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  return (
    <div className="rd-book-theme" data-book={bookId}>
      {children}
    </div>
  );
}
