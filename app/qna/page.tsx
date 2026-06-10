import Link from 'next/link';
import { Search } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { listPosts, POST_CATEGORIES, PAGE_SIZE, type PostListResult } from '@/lib/qna';

export const revalidate = 0;

function formatListDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  }
  return new Intl.DateTimeFormat('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).format(d);
}

function buildQuery(params: { page?: number; q?: string; cat?: string }): string {
  const sp = new URLSearchParams();
  if (params.cat) sp.set('cat', params.cat);
  if (params.q) sp.set('q', params.q);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export default async function QnaListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; cat?: string }>;
}) {
  const { page: pageParam, q = '', cat = '' } = await searchParams;
  const pageNum = Number.parseInt(pageParam || '1', 10) || 1;

  let result: PostListResult = { posts: [], total: 0, page: 1, totalPages: 1 };
  let boardReady = isFirebaseConfigured();
  if (boardReady) {
    try {
      result = await listPosts({ page: pageNum, q, cat });
    } catch (error) {
      console.error('QnA list read failed:', error);
      boardReady = false;
    }
  }

  const { posts, total, page, totalPages } = result;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => Math.abs(n - page) <= 2 || n === 1 || n === totalPages
  );

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100%', paddingBottom: '80px' }}>
      <style>{`
        .board-table {
          width: 100%;
          border-collapse: collapse;
          border-top: 2px solid var(--colors-ink);
          font-size: 14px;
        }
        .board-table th {
          padding: 10px 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--colors-muted);
          border-bottom: 1px solid var(--colors-hairline);
          background-color: var(--colors-surface-soft);
          white-space: nowrap;
        }
        .board-table td {
          padding: 11px 8px;
          border-bottom: 1px solid var(--colors-hairline-soft);
          color: var(--colors-body);
          vertical-align: middle;
        }
        .board-table tbody tr:hover {
          background-color: var(--colors-surface-soft);
        }
        .board-col-num, .board-col-views { width: 56px; text-align: center; color: var(--colors-muted-soft); }
        .board-col-cat { width: 64px; text-align: center; }
        .board-col-author { width: 120px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .board-col-date { width: 80px; text-align: center; color: var(--colors-muted-soft); white-space: nowrap; }
        .board-title-link {
          color: var(--colors-ink);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 100%;
        }
        .board-title-link:hover { text-decoration: underline; text-underline-offset: 3px; }
        .board-title-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .board-comment-count {
          color: var(--colors-primary);
          font-weight: 600;
          font-size: 12px;
          flex-shrink: 0;
        }
        .board-cat-chip {
          font-size: 12px;
          color: var(--colors-muted);
        }
        .board-tab {
          padding: 7px 14px;
          border-radius: var(--rounded-md);
          font-size: 13px;
          font-weight: 500;
          color: var(--colors-muted);
          border: 1px solid transparent;
          transition: background-color var(--transition-fast), color var(--transition-fast);
        }
        .board-tab:hover:not(.active) { background-color: var(--colors-surface-soft); color: var(--colors-ink); }
        .board-tab.active {
          color: var(--colors-primary);
          font-weight: 600;
          background-color: color-mix(in srgb, var(--colors-primary) 10%, transparent);
        }
        .board-page-link {
          min-width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
          border-radius: var(--rounded-md);
          font-size: 13px;
          color: var(--colors-body);
          border: 1px solid transparent;
          transition: background-color var(--transition-fast);
        }
        .board-page-link:hover:not(.active) { background-color: var(--colors-surface-soft); }
        .board-page-link.active {
          background-color: var(--colors-primary);
          color: var(--colors-on-primary);
          font-weight: 600;
        }
        @media (max-width: 640px) {
          .board-col-num, .board-col-views, .board-col-author { display: none; }
          .board-col-date { width: 64px; }
        }
      `}</style>

      <section style={{ padding: '48px 0 0 0' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <h1 className="serif-display" style={{ fontSize: '28px', margin: '0 0 6px 0' }}>
            질문 게시판
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--colors-muted)', margin: '0 0 24px 0' }}>
            강의 질문부터 자유로운 이야기까지, 편하게 글을 남겨 주세요.
          </p>

          {!boardReady ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed var(--colors-hairline)', borderRadius: 'var(--rounded-lg)' }}>
              <p style={{ color: 'var(--colors-muted)', margin: 0 }}>게시판을 준비하고 있어요. 조금만 기다려 주세요!</p>
            </div>
          ) : (
            <>
              {/* 말머리 탭 + 검색 + 글쓰기 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <Link href={`/qna${buildQuery({ q })}`} className={`board-tab${!cat ? ' active' : ''}`}>
                    전체
                  </Link>
                  {POST_CATEGORIES.map((c) => (
                    <Link key={c} href={`/qna${buildQuery({ cat: c, q })}`} className={`board-tab${cat === c ? ' active' : ''}`}>
                      {c}
                    </Link>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <form method="GET" action="/qna" style={{ display: 'flex', gap: '6px' }}>
                    {cat && <input type="hidden" name="cat" value={cat} />}
                    <input
                      type="text"
                      name="q"
                      defaultValue={q}
                      placeholder="제목 검색"
                      className="input-text"
                      style={{ height: '36px', width: '180px', fontSize: '13px' }}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ height: '36px', padding: '0 12px' }} aria-label="검색">
                      <Search size={15} />
                    </button>
                  </form>
                  <Link href="/qna/new" className="btn btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
                    글쓰기
                  </Link>
                </div>
              </div>

              {/* 게시글 테이블 */}
              <table className="board-table">
                <thead>
                  <tr>
                    <th className="board-col-num">번호</th>
                    <th className="board-col-cat">말머리</th>
                    <th>제목</th>
                    <th className="board-col-author">글쓴이</th>
                    <th className="board-col-date">날짜</th>
                    <th className="board-col-views">조회</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '56px 8px', color: 'var(--colors-muted)' }}>
                        {q || cat ? '조건에 맞는 글이 없습니다.' : '아직 등록된 글이 없습니다. 첫 글을 남겨 보세요!'}
                      </td>
                    </tr>
                  ) : (
                    posts.map((post, idx) => (
                      <tr key={post.id}>
                        <td className="board-col-num">{total - (page - 1) * PAGE_SIZE - idx}</td>
                        <td className="board-col-cat">
                          <span className="board-cat-chip">[{post.category}]</span>
                        </td>
                        <td style={{ maxWidth: 0 }}>
                          <Link href={`/qna/${post.id}`} className="board-title-link">
                            <span className="board-title-text">{post.title}</span>
                            {post.commentCount > 0 && (
                              <span className="board-comment-count">[{post.commentCount}]</span>
                            )}
                          </Link>
                        </td>
                        <td className="board-col-author">{post.authorName}</td>
                        <td className="board-col-date">{formatListDate(post.createdAt)}</td>
                        <td className="board-col-views">{post.views}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '24px', alignItems: 'center' }}>
                  {page > 1 && (
                    <Link href={`/qna${buildQuery({ page: page - 1, q, cat })}`} className="board-page-link">
                      이전
                    </Link>
                  )}
                  {pageNumbers.map((n, i) => (
                    <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {i > 0 && pageNumbers[i - 1] !== n - 1 && (
                        <span style={{ color: 'var(--colors-muted-soft)', fontSize: '12px' }}>…</span>
                      )}
                      <Link
                        href={`/qna${buildQuery({ page: n, q, cat })}`}
                        className={`board-page-link${n === page ? ' active' : ''}`}
                      >
                        {n}
                      </Link>
                    </span>
                  ))}
                  {page < totalPages && (
                    <Link href={`/qna${buildQuery({ page: page + 1, q, cat })}`} className="board-page-link">
                      다음
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
