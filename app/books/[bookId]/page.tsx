import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen, ArrowRight, List } from 'lucide-react';
import { getBook, listBooks, flattenSections } from '@/lib/books';

export function generateStaticParams() {
  return listBooks().map((book) => ({ bookId: book.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = getBook(bookId);
  if (!book) return {};
  return {
    title: `${book.title} | 무료 도서`,
    description: book.description,
  };
}

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date(iso));
}

export default async function BookTocPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = getBook(bookId);
  if (!book) notFound();

  const flat = flattenSections(book);
  const firstSection = flat[0]?.section;
  const published = formatDate(book.publishedAt);

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 책 표지 헤더 */}
      <section
        style={{
          padding: '72px 0 56px 0',
          textAlign: 'center',
          borderBottom: '1px solid var(--colors-hairline)',
          background:
            'radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--colors-primary) 8%, transparent) 0%, transparent 60%)',
        }}
      >
        <div className="container" style={{ maxWidth: '760px' }}>
          <span className="badge badge-coral" style={{ marginBottom: '20px', fontWeight: 600 }}>
            무료 공개 도서
          </span>
          <h1 className="serif-display" style={{ fontSize: '38px', margin: '16px 0 10px 0' }}>
            {book.title}
          </h1>
          {book.subtitle && (
            <p style={{ fontSize: '17px', color: 'var(--colors-muted)', margin: '0 0 18px 0' }}>
              {book.subtitle}
            </p>
          )}
          <p style={{ fontSize: '15px', lineHeight: 1.75, color: 'var(--colors-body)', margin: '0 auto 14px auto', maxWidth: '620px' }}>
            {book.description}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--colors-muted)', margin: '0 0 28px 0' }}>
            {book.author}
            {published && ` 지음 · ${published} 공개`}
            {` · 총 ${flat.length}개 절`}
          </p>
          {firstSection && (
            <Link
              href={`/books/${book.id}/${firstSection.id}`}
              className="btn btn-primary"
              style={{ height: '46px', padding: '0 28px', fontSize: '15px', gap: '8px' }}
            >
              <BookOpen size={17} /> 처음부터 읽기 <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </section>

      {/* 전체 목차: 마당 > 장 > 절 */}
      <section style={{ padding: '48px 0 0 0' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <h2 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <List size={20} /> 목차
          </h2>

          {book.parts.map((part) => (
            <div key={part.id} style={{ marginBottom: '36px' }}>
              {/* 마당 없이 장만 있는 책은 마당 제목 줄을 생략한다 */}
              {part.title && (
                <h3
                  className="serif-display"
                  style={{
                    fontSize: '17px',
                    color: 'var(--colors-primary)',
                    borderBottom: '2px solid var(--colors-primary)',
                    paddingBottom: '10px',
                    marginBottom: '4px',
                  }}
                >
                  {part.title}
                </h3>
              )}
              {part.chapters.map((chapter) => (
                <div key={chapter.id} style={{ marginTop: '18px' }}>
                  <h4
                    style={
                      part.title
                        ? { fontSize: '15px', fontWeight: 600, color: 'var(--colors-ink)', margin: '0 0 6px 0' }
                        : {
                            fontSize: '16px',
                            fontWeight: 600,
                            color: 'var(--colors-ink)',
                            margin: '0 0 6px 0',
                            borderBottom: '2px solid var(--colors-primary)',
                            paddingBottom: '8px',
                          }
                    }
                  >
                    {chapter.title}
                  </h4>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {chapter.sections.map((section) => (
                      <li key={section.id}>
                        <Link
                          href={`/books/${book.id}/${section.id}`}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '9px 10px',
                            borderRadius: 'var(--rounded-sm)',
                            fontSize: '14.5px',
                            color: 'var(--colors-body)',
                            transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                          }}
                          className="book-toc-row"
                        >
                          <span>{section.title}</span>
                          <ArrowRight size={14} style={{ color: 'var(--colors-muted-soft)', flexShrink: 0 }} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}

          <style>{`
            .book-toc-row:hover {
              background-color: var(--colors-surface-soft);
              color: var(--colors-ink);
            }
          `}</style>

          <div style={{ marginTop: '8px' }}>
            <Link href="/books" className="btn btn-secondary" style={{ gap: '6px' }}>
              <List size={15} /> 도서 목록
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
