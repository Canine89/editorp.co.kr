'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Eye, EyeOff, ExternalLink, RotateCcw } from 'lucide-react';
import type { Book } from '@/lib/books';

type AdminBook = Book & { sectionCount: number; overridden: string[] };

/**
 * 도서 관리: 책 목록, 공개 토글, 사이트에서 고친 절 되돌리기.
 * 본문 수정은 리더에서 관리자로 로그인해 블록마다 한다(InlineBookEditor).
 */
export function BookAdminList({ initialBooks }: { initialBooks: AdminBook[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const notify = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  const togglePublish = async (book: Book) => {
    const next = book.isPublished === false;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/books/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, isPublished: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, isPublished: next } : b)));
      notify(`'${book.title}' ${next ? '공개' : '비공개'} 처리. ${data.message}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '공개 설정 변경 실패', true);
    } finally {
      setBusy(false);
    }
  };

  const revertBook = async (book: AdminBook) => {
    const list = book.overridden.map((title) => `· ${title}`).join('\n');
    if (!window.confirm(`'${book.title}'에서 사이트에서 고친 절을 모두 버리고 파일 원본으로 되돌릴까요?\n\n${list}`)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/books/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBooks((prev) => prev.map((b) => (b.id === book.id ? { ...b, overridden: [] } : b)));
      notify(`'${book.title}' ${data.message}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '되돌리기에 실패했습니다.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="container" style={{ paddingTop: '28px', maxWidth: '860px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/admin" className="btn btn-secondary" style={{ height: '34px', padding: '0 12px', fontSize: '13px', gap: '5px' }}>
              <ArrowLeft size={14} /> 로드맵 관리
            </Link>
            <h1 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BookOpen size={20} /> 도서 관리
            </h1>
            <Link href="/admin/comments" className="btn btn-secondary" style={{ height: '34px', padding: '0 12px', fontSize: '13px' }}>
              독자 댓글
            </Link>
          </div>
          {message && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                padding: '6px 14px',
                borderRadius: 'var(--rounded-pill)',
                backgroundColor: message.isError
                  ? 'color-mix(in srgb, var(--colors-error) 12%, transparent)'
                  : 'color-mix(in srgb, var(--colors-success) 14%, transparent)',
                color: message.isError ? 'var(--colors-error)' : 'var(--colors-success)',
              }}
            >
              {message.text}
            </span>
          )}
        </div>

        {books.length === 0 ? (
          <p style={{ color: 'var(--colors-muted)', fontSize: '14px' }}>
            등록된 책이 없습니다. 원고는 임포터(scripts/import-book.mjs)로 추가합니다.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {books.map((book) => {
              const published = book.isPublished !== false;
              return (
                <div
                  key={book.id}
                  className="card-cream"
                  style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}
                >
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt=""
                      style={{ height: '72px', width: 'auto', borderRadius: 'var(--rounded-xs)', border: '1px solid var(--colors-hairline)', flexShrink: 0 }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '72px',
                        width: '52px',
                        borderRadius: 'var(--rounded-xs)',
                        border: '1px solid var(--colors-hairline)',
                        backgroundColor: 'var(--colors-surface-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--colors-muted-soft)',
                        flexShrink: 0,
                      }}
                    >
                      <BookOpen size={20} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '15.5px', color: 'var(--colors-ink)', wordBreak: 'keep-all' }}>
                        {book.title}
                      </strong>
                      <span
                        className="badge"
                        style={{
                          fontSize: '11px',
                          padding: '2px 9px',
                          backgroundColor: published
                            ? 'color-mix(in srgb, var(--colors-success) 15%, transparent)'
                            : 'var(--colors-surface-cream-strong)',
                          color: published ? 'var(--colors-success)' : 'var(--colors-muted)',
                        }}
                      >
                        {published ? '공개' : '비공개'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12.5px', color: 'var(--colors-muted)' }}>
                      {book.author} · 총 {book.sectionCount}개 절
                      {book.overridden.length > 0 && (
                        <span title={book.overridden.join('\n')} style={{ color: 'var(--colors-warning)' }}>
                          {' '}· 사이트에서 고친 절 {book.overridden.length}개
                        </span>
                      )}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Link
                      href={`/books/${book.id}`}
                      target="_blank"
                      className="btn btn-secondary"
                      style={{ height: '34px', padding: '0 12px', fontSize: '12.5px', gap: '5px' }}
                    >
                      <ExternalLink size={13} /> 사이트에서 보기
                    </Link>
                    <button
                      type="button"
                      onClick={() => togglePublish(book)}
                      disabled={busy}
                      className="btn btn-secondary"
                      style={{ height: '34px', padding: '0 12px', fontSize: '12.5px', gap: '5px' }}
                    >
                      {published ? <EyeOff size={13} /> : <Eye size={13} />}
                      {published ? '비공개로 전환' : '공개로 전환'}
                    </button>
                    {book.overridden.length > 0 && (
                      <button
                        type="button"
                        onClick={() => revertBook(book)}
                        disabled={busy}
                        className="btn btn-secondary"
                        style={{ height: '34px', padding: '0 12px', fontSize: '12.5px', gap: '5px' }}
                      >
                        <RotateCcw size={13} /> 원본으로 되돌리기
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
