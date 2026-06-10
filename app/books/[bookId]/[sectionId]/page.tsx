import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBook, listBooks, flattenSections, renderSectionHtml } from '@/lib/books';
import { BookToc } from '@/components/BookToc';

export function generateStaticParams() {
  return listBooks().flatMap((book) =>
    flattenSections(book).map((flat) => ({ bookId: book.id, sectionId: flat.section.id }))
  );
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ bookId: string; sectionId: string }>;
}) {
  const { bookId, sectionId } = await params;
  const book = getBook(bookId);
  const flat = book ? flattenSections(book).find((f) => f.section.id === sectionId) : null;
  if (!book || !flat) return {};
  return {
    title: `${flat.section.title} — ${book.title} | 무료 도서`,
    description: book.description,
  };
}

export default async function BookSectionPage({
  params,
}: {
  params: Promise<{ bookId: string; sectionId: string }>;
}) {
  const { bookId, sectionId } = await params;
  const book = getBook(bookId);
  if (!book) notFound();

  const flat = flattenSections(book);
  const index = flat.findIndex((f) => f.section.id === sectionId);
  if (index === -1) notFound();

  const current = flat[index];
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index < flat.length - 1 ? flat[index + 1] : null;

  const html = renderSectionHtml(book.id, current.section);
  if (html === null) notFound();

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh' }}>
      <div className="container book-layout">
        <BookToc book={book} currentSectionId={current.section.id} />

        <article style={{ minWidth: 0, paddingBottom: '80px' }}>
          {/* 위치 안내: 책 > 마당 > 장 */}
          <nav
            aria-label="현재 위치"
            style={{ fontSize: '12.5px', color: 'var(--colors-muted)', marginBottom: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}
          >
            <Link href={`/books/${book.id}`} className="text-link" style={{ fontSize: 'inherit' }}>
              {book.title}
            </Link>
            {current.part.title && (
              <>
                <span style={{ color: 'var(--colors-muted-soft)' }}>›</span>
                <span>{current.part.title}</span>
              </>
            )}
            <span style={{ color: 'var(--colors-muted-soft)' }}>›</span>
            <span>{current.chapter.title}</span>
          </nav>

          <header style={{ borderBottom: '2px solid var(--colors-ink)', paddingBottom: '18px', marginBottom: '28px' }}>
            <h1 className="serif-display" style={{ fontSize: '30px', margin: '0 0 10px 0', lineHeight: 1.3 }}>
              {current.section.title}
            </h1>
            <span style={{ fontSize: '13px', color: 'var(--colors-muted)' }}>
              {book.author} · {index + 1} / {flat.length} 절
            </span>
          </header>

          <div className="rich-content book-content" dangerouslySetInnerHTML={{ __html: html }} />

          {/* 이전/다음 절 내비게이션 */}
          <nav
            aria-label="절 이동"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginTop: '48px',
              borderTop: '1px solid var(--colors-hairline)',
              paddingTop: '24px',
            }}
          >
            {prev ? (
              <Link href={`/books/${book.id}/${prev.section.id}`} className="book-pager">
                <span className="book-pager-label">
                  <ChevronLeft size={14} /> 이전 절
                </span>
                <span className="book-pager-title">{prev.section.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/books/${book.id}/${next.section.id}`} className="book-pager" style={{ textAlign: 'right' }}>
                <span className="book-pager-label" style={{ justifyContent: 'flex-end' }}>
                  다음 절 <ChevronRight size={14} />
                </span>
                <span className="book-pager-title">{next.section.title}</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
