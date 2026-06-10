import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { listBooks, countSections } from '@/lib/books';

export const metadata = {
  title: '무료 도서 | 편집자P의 AI 강의·편집실',
  description: '공공의 이익을 위해 무료로 공개하는 책들을 블로그처럼 읽어 보세요.',
};

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date(iso));
}

export default function BooksPage() {
  const books = listBooks();

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '80px' }}>
      <style>{`
        .book-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .book-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .book-grid { grid-template-columns: 1fr; }
        }
        .book-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background-color: var(--colors-surface-card);
          border: 1px solid var(--colors-hairline);
          border-radius: var(--rounded-lg);
          padding: 24px;
          transition: all var(--transition-normal);
        }
        .book-card:hover {
          transform: translateY(-6px);
          border-color: var(--colors-primary);
          box-shadow: 0 12px 36px color-mix(in srgb, var(--colors-primary) 10%, transparent);
        }
        .book-card .card-stretched-link::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: var(--rounded-lg);
        }
        .book-cover-placeholder {
          width: calc(100% + 48px);
          margin: -24px -24px 16px -24px;
          aspect-ratio: 16 / 7;
          border-radius: var(--rounded-lg) var(--rounded-lg) 0 0;
          border-bottom: 1px solid var(--colors-hairline-soft);
          background:
            radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--colors-primary) 22%, transparent) 0%, transparent 60%),
            var(--colors-surface-soft);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--colors-primary);
        }
        .book-cover-img {
          width: calc(100% + 48px);
          margin: -24px -24px 16px -24px;
          aspect-ratio: 16 / 7;
          object-fit: cover;
          border-radius: var(--rounded-lg) var(--rounded-lg) 0 0;
          border-bottom: 1px solid var(--colors-hairline-soft);
          display: block;
        }
      `}</style>

      <section style={{ padding: '72px 0 40px 0', textAlign: 'center' }}>
        <div className="container">
          <span className="badge badge-coral" style={{ marginBottom: '20px', fontWeight: 600 }}>
            ✦ 모두를 위해 무료로 공개합니다
          </span>
          <h1 className="serif-display" style={{ fontSize: '40px', margin: '16px 0 14px 0' }}>
            무료 도서
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--colors-body)', maxWidth: '640px', margin: '0 auto' }}>
            직접 집필한 책을 마당-장-절 순서 그대로, 블로그처럼 편하게 읽어 보세요.
          </p>
        </div>
      </section>

      <section style={{ padding: '20px 0 0 0' }}>
        <div className="container">
          {books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', border: '1px dashed var(--colors-hairline)', borderRadius: 'var(--rounded-lg)' }}>
              <p style={{ color: 'var(--colors-muted)', margin: 0 }}>아직 공개된 책이 없습니다.</p>
            </div>
          ) : (
            <div className="book-grid">
              {books.map((book) => {
                const sectionCount = countSections(book);
                const published = formatDate(book.publishedAt);
                return (
                  <div key={book.id} className="book-card">
                    {book.cover ? (
                      <img className="book-cover-img" src={book.cover} alt={`${book.title} 표지`} loading="lazy" />
                    ) : (
                      <div className="book-cover-placeholder" aria-hidden="true">
                        <BookOpen size={36} strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{ flex: 1, marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
                        <span className="badge badge-cream" style={{ fontSize: '11px', fontWeight: 600 }}>
                          무료 공개
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--colors-muted-soft)', fontWeight: 500 }}>
                          총 {sectionCount}개 절
                        </span>
                      </div>
                      <h3 className="serif-display" style={{ fontSize: '21px', marginBottom: '6px', fontWeight: 600 }}>
                        {book.title}
                      </h3>
                      {book.subtitle && (
                        <p style={{ fontSize: '14px', color: 'var(--colors-muted)', margin: '0 0 10px 0' }}>
                          {book.subtitle}
                        </p>
                      )}
                      <p style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--colors-body)', margin: 0 }}>
                        {book.description}
                      </p>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid var(--colors-hairline-soft)',
                        paddingTop: '16px',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '12.5px', color: 'var(--colors-muted)' }}>
                        {book.author}
                        {published && ` · ${published}`}
                      </span>
                      <Link
                        href={`/books/${book.id}`}
                        className="btn btn-primary card-stretched-link"
                        style={{ height: '36px', padding: '0 16px', fontSize: '13px', gap: '4px' }}
                      >
                        읽어보기 <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
