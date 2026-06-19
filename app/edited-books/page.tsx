import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { countEditedBooks, getEditedBooksData } from '@/lib/edited-books';

export const metadata = {
  title: '편집한 도서 | 편집자P의 AI 강의·편집실',
  description: '편집자P가 골든래빗·이지스퍼블리싱에서 기획하고 편집한 IT 도서를 소개합니다.',
};

export default function EditedBooksPage() {
  const data = getEditedBooksData();
  const total = countEditedBooks(data);

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '80px' }}>
      <style>{`
        .edited-book-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .edited-book-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .edited-book-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .edited-book-grid { grid-template-columns: 1fr; }
        }
        .edited-book-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background-color: var(--colors-surface-card);
          border: 1px solid var(--colors-hairline);
          border-radius: var(--rounded-lg);
          overflow: hidden;
          transition: all var(--transition-normal);
        }
        .edited-book-card:hover {
          transform: translateY(-4px);
          border-color: var(--publisher-color, var(--colors-primary));
          box-shadow: 0 12px 32px color-mix(in srgb, var(--publisher-color, var(--colors-primary)) 12%, transparent);
        }
        .edited-book-cover-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px 20px;
          background-color: color-mix(in srgb, var(--publisher-color) 18%, var(--colors-surface-soft));
          border-bottom: 1px solid var(--colors-hairline-soft);
        }
        .edited-book-cover {
          height: 180px;
          width: auto;
          border-radius: var(--rounded-sm);
          border: 1px solid var(--colors-hairline);
          box-shadow: 0 10px 24px rgba(20, 20, 19, 0.16);
          display: block;
        }
        .edited-book-body {
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 16px;
        }
        .edited-book-card .card-stretched-link::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: var(--rounded-lg);
        }
        .publisher-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 14px;
          margin-bottom: 24px;
          border-bottom: 2px solid var(--colors-hairline);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 48px;
        }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
        .stat-card {
          background-color: var(--colors-surface-card);
          border: 1px solid var(--colors-hairline);
          border-radius: var(--rounded-lg);
          padding: 20px 24px;
        }
      `}</style>

      <section style={{ padding: '72px 0 40px 0', textAlign: 'center' }}>
        <div className="container">
          <span className="badge badge-coral" style={{ marginBottom: '20px', fontWeight: 600 }}>
            ✦ 총 {total}권
          </span>
          <h1 className="serif-display" style={{ fontSize: '40px', margin: '16px 0 14px 0' }}>
            편집한 도서
          </h1>
          <p style={{ fontSize: '17px', color: 'var(--colors-body)', maxWidth: '640px', margin: '0 auto' }}>
            골든래빗·이지스퍼블리싱에서 기획하고 편집한 IT 도서들입니다.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 0 20px 0' }}>
        <div className="container">
          {data.publishers.map((publisher) => (
            <div key={publisher.id} style={{ marginBottom: '56px' }}>
              <div className="publisher-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span
                    aria-hidden
                    style={{
                      display: 'block',
                      width: '6px',
                      height: '40px',
                      borderRadius: 'var(--rounded-pill)',
                      backgroundColor: publisher.color,
                    }}
                  />
                  <div>
                    <h2 className="serif-display" style={{ fontSize: '24px', margin: 0, fontWeight: 600 }}>
                      {publisher.name}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--colors-muted)', margin: '4px 0 0 0' }}>
                      {publisher.period} · {publisher.books.length}권
                    </p>
                  </div>
                </div>
              </div>

              <div className="edited-book-grid">
                {publisher.books.map((book) => (
                  <article
                    key={book.title}
                    className="edited-book-card"
                    style={{ '--publisher-color': publisher.color } as CSSProperties}
                  >
                    <div className="edited-book-cover-wrap">
                      <img
                        className="edited-book-cover"
                        src={book.image}
                        alt={`${book.title} 표지`}
                        loading="lazy"
                      />
                    </div>
                    <div className="edited-book-body">
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#fff',
                            backgroundColor: publisher.color,
                            border: 'none',
                          }}
                        >
                          {book.role}
                        </span>
                        {book.note && (
                          <span className="badge badge-cream" style={{ fontSize: '10px', fontWeight: 600 }}>
                            {book.note}
                          </span>
                        )}
                      </div>
                      <h3
                        className="serif-display"
                        style={{ fontSize: '15px', lineHeight: 1.45, margin: '0 0 12px 0', fontWeight: 600, flex: 1 }}
                      >
                        {book.title}
                      </h3>
                      <a
                        href={book.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary card-stretched-link"
                        style={{
                          height: '32px',
                          padding: '0 14px',
                          fontSize: '12px',
                          gap: '4px',
                          alignSelf: 'flex-start',
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        예스24에서 보기 <ArrowRight size={13} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}

          <div className="stats-grid">
            <div className="stat-card">
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--colors-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Total
              </p>
              <p className="serif-display" style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0 0 0' }}>
                {total}
              </p>
            </div>
            {data.publishers.map((pub) => (
              <div key={pub.id} className="stat-card">
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--colors-muted)', margin: 0 }}>
                  {pub.name}
                </p>
                <p className="serif-display" style={{ fontSize: '32px', fontWeight: 700, margin: '8px 0 0 0', color: pub.color }}>
                  {pub.books.length}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
