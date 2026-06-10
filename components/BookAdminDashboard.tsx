'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Eye, EyeOff, Save, RotateCcw, ExternalLink } from 'lucide-react';
import type { Book } from '@/lib/books';
import { BookSectionEditor } from './BookSectionEditor';

interface SelectedSection {
  bookId: string;
  sectionId: string;
  title: string;
}

/**
 * 도서 관리 대시보드.
 * 왼쪽: 책 목록(공개 토글) + 마당/장/절 트리, 오른쪽: 절 본문 에디터.
 */
export function BookAdminDashboard({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [selected, setSelected] = useState<SelectedSection | null>(null);
  const [html, setHtml] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const notify = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  const confirmDiscard = () =>
    !dirty || window.confirm('저장하지 않은 수정사항이 있습니다. 버리고 이동할까요?');

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

  const openSection = async (bookId: string, sectionId: string, title: string) => {
    if (!confirmDiscard()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/books/section?bookId=${encodeURIComponent(bookId)}&sectionId=${encodeURIComponent(sectionId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected({ bookId, sectionId, title });
      setHtml(data.html);
      setDirty(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : '절 본문을 불러오지 못했습니다.', true);
    } finally {
      setBusy(false);
    }
  };

  const saveSection = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/books/section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: selected.bookId, sectionId: selected.sectionId, html }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDirty(false);
      notify(data.message);
    } catch (error) {
      notify(error instanceof Error ? error.message : '저장에 실패했습니다.', true);
    } finally {
      setBusy(false);
    }
  };

  const revertSection = async () => {
    if (!selected) return;
    if (!window.confirm('이 절의 모든 수정사항을 버리고 임포트된 파일 원본으로 되돌릴까요?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/books/section', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: selected.bookId, sectionId: selected.sectionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setDirty(false);
      await openSection(selected.bookId, selected.sectionId, selected.title);
    } catch (error) {
      notify(error instanceof Error ? error.message : '되돌리기에 실패했습니다.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="container" style={{ paddingTop: '28px' }}>
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href="/admin" className="btn btn-secondary" style={{ height: '34px', padding: '0 12px', fontSize: '13px', gap: '5px' }}>
              <ArrowLeft size={14} /> 로드맵 관리
            </Link>
            <h1 style={{ fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <BookOpen size={20} /> 도서 관리
            </h1>
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

        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
          {/* 왼쪽: 책 + 절 트리 */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {books.length === 0 && (
              <p style={{ color: 'var(--colors-muted)', fontSize: '14px' }}>
                등록된 책이 없습니다. 원고는 임포터(scripts/import-book.mjs)로 추가합니다.
              </p>
            )}
            {books.map((book) => {
              const published = book.isPublished !== false;
              return (
                <div key={book.id} className="card-cream" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '14.5px', color: 'var(--colors-ink)', wordBreak: 'keep-all' }}>
                      {book.title}
                    </strong>
                    <button
                      type="button"
                      onClick={() => togglePublish(book)}
                      disabled={busy}
                      title={published ? '클릭하면 비공개로 전환' : '클릭하면 공개로 전환'}
                      className="badge"
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        gap: '4px',
                        flexShrink: 0,
                        backgroundColor: published
                          ? 'color-mix(in srgb, var(--colors-success) 15%, transparent)'
                          : 'var(--colors-surface-cream-strong)',
                        color: published ? 'var(--colors-success)' : 'var(--colors-muted)',
                      }}
                    >
                      {published ? <Eye size={12} /> : <EyeOff size={12} />}
                      {published ? '공개' : '비공개'}
                    </button>
                  </div>
                  <Link
                    href={`/books/${book.id}`}
                    target="_blank"
                    style={{ fontSize: '12px', color: 'var(--colors-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '10px' }}
                  >
                    사이트에서 보기 <ExternalLink size={11} />
                  </Link>

                  {book.parts.map((part) => (
                    <div key={part.id}>
                      {part.title && (
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--colors-primary)', margin: '10px 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {part.title}
                        </div>
                      )}
                      {part.chapters.map((chapter) => (
                        <div key={chapter.id} style={{ marginTop: '8px' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--colors-body-strong)', marginBottom: '2px', wordBreak: 'keep-all' }}>
                            {chapter.title}
                          </div>
                          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                            {chapter.sections.map((section) => {
                              const active =
                                selected?.bookId === book.id && selected?.sectionId === section.id;
                              return (
                                <li key={section.id}>
                                  <button
                                    type="button"
                                    onClick={() => openSection(book.id, section.id, section.title)}
                                    disabled={busy}
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      textAlign: 'left',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '12.5px',
                                      padding: '4px 8px',
                                      borderRadius: 'var(--rounded-sm)',
                                      wordBreak: 'keep-all',
                                      backgroundColor: active
                                        ? 'color-mix(in srgb, var(--colors-primary) 12%, transparent)'
                                        : 'transparent',
                                      color: active ? 'var(--colors-primary)' : 'var(--colors-muted)',
                                      fontWeight: active ? 600 : 400,
                                    }}
                                  >
                                    {section.title}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </aside>

          {/* 오른쪽: 에디터 */}
          <main style={{ minWidth: 0 }}>
            {!selected ? (
              <div
                style={{
                  border: '1px dashed var(--colors-hairline)',
                  borderRadius: 'var(--rounded-lg)',
                  padding: '80px 24px',
                  textAlign: 'center',
                  color: 'var(--colors-muted)',
                  fontSize: '14px',
                }}
              >
                왼쪽에서 수정할 절을 선택하세요.
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '17px', margin: 0, wordBreak: 'keep-all' }}>
                    {selected.title}
                    {dirty && <span style={{ color: 'var(--colors-warning)', fontSize: '12px', marginLeft: '8px' }}>● 수정됨</span>}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={revertSection}
                      disabled={busy}
                      className="btn btn-secondary"
                      style={{ height: '34px', padding: '0 12px', fontSize: '13px', gap: '5px' }}
                    >
                      <RotateCcw size={13} /> 원본으로 되돌리기
                    </button>
                    <button
                      type="button"
                      onClick={saveSection}
                      disabled={busy || !dirty}
                      className="btn btn-primary"
                      style={{ height: '34px', padding: '0 16px', fontSize: '13px', gap: '5px' }}
                    >
                      <Save size={13} /> {busy ? '처리 중…' : '저장'}
                    </button>
                  </div>
                </div>
                {/* key로 절 전환 시 에디터를 새로 마운트 */}
                <BookSectionEditor
                  key={`${selected.bookId}/${selected.sectionId}`}
                  initialHtml={html}
                  onChange={(next) => {
                    setHtml(next);
                    setDirty(true);
                  }}
                />
                <p style={{ fontSize: '12px', color: 'var(--colors-muted-soft)', marginTop: '10px' }}>
                  저장하면 사이트에 바로 반영됩니다. 본문은 마크다운으로 변환되어 보관되며, 글자색 등
                  여기서 지원하지 않는 서식은 저장 시 제거됩니다.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
