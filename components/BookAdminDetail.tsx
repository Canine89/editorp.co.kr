'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Save, RotateCcw, ExternalLink } from 'lucide-react';
import type { Book } from '@/lib/books';
import { BookSectionEditor } from './BookSectionEditor';

interface SelectedSection {
  sectionId: string;
  title: string;
}

/** 책 한 권의 관리 화면: 공개 토글 + 절 트리 + 본문 에디터 */
export function BookAdminDetail({ initialBook }: { initialBook: Book }) {
  const [book, setBook] = useState(initialBook);
  const [selected, setSelected] = useState<SelectedSection | null>(null);
  const [html, setHtml] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const published = book.isPublished !== false;

  const notify = (text: string, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  const confirmDiscard = () =>
    !dirty || window.confirm('저장하지 않은 수정사항이 있습니다. 버리고 이동할까요?');

  const togglePublish = async () => {
    const next = !published;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/books/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, isPublished: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBook((prev) => ({ ...prev, isPublished: next }));
      notify(`${next ? '공개' : '비공개'} 처리. ${data.message}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '공개 설정 변경 실패', true);
    } finally {
      setBusy(false);
    }
  };

  const openSection = async (sectionId: string, title: string) => {
    if (!confirmDiscard()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/books/section?bookId=${encodeURIComponent(book.id)}&sectionId=${encodeURIComponent(sectionId)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelected({ sectionId, title });
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
        body: JSON.stringify({ bookId: book.id, sectionId: selected.sectionId, html }),
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
        body: JSON.stringify({ bookId: book.id, sectionId: selected.sectionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      notify(data.message);
      setDirty(false);
      await openSection(selected.sectionId, selected.title);
    } catch (error) {
      notify(error instanceof Error ? error.message : '되돌리기에 실패했습니다.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="container" style={{ paddingTop: '28px' }}>
        {/* 헤더: 책 정보 + 공개 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/admin/books" className="btn btn-secondary" style={{ height: '34px', padding: '0 12px', fontSize: '13px', gap: '5px' }}>
              <ArrowLeft size={14} /> 도서 목록
            </Link>
            <h1 style={{ fontSize: '20px', margin: 0, wordBreak: 'keep-all' }}>{book.title}</h1>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              onClick={togglePublish}
              disabled={busy}
              className="btn btn-secondary"
              style={{ height: '34px', padding: '0 12px', fontSize: '12.5px', gap: '5px' }}
            >
              {published ? <EyeOff size={13} /> : <Eye size={13} />}
              {published ? '비공개로 전환' : '공개로 전환'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
          {/* 왼쪽: 이 책의 절 트리 */}
          <aside className="card-cream" style={{ padding: '16px', position: 'sticky', top: '88px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            {book.parts.map((part) => (
              <div key={part.id}>
                {part.title && (
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--colors-primary)', margin: '10px 0 2px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {part.title}
                  </div>
                )}
                {part.chapters.map((chapter) => (
                  <div key={chapter.id} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--colors-body-strong)', marginBottom: '2px', wordBreak: 'keep-all' }}>
                      {chapter.title}
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {chapter.sections.map((section) => {
                        const active = selected?.sectionId === section.id;
                        return (
                          <li key={section.id}>
                            <button
                              type="button"
                              onClick={() => openSection(section.id, section.title)}
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
                  key={`${book.id}/${selected.sectionId}`}
                  initialHtml={html}
                  onChange={(nextHtml, nextDirty) => {
                    setHtml(nextHtml);
                    setDirty(nextDirty);
                  }}
                />
                <p style={{ fontSize: '12px', color: 'var(--colors-muted-soft)', marginTop: '10px' }}>
                  저장하면 사이트에 바로 반영됩니다. 본문은 마크다운으로 변환되어 보관되며, 글자색 등
                  여기서 지원하지 않는 서식은 저장 시 제거됩니다. 이미지 삽입은 업로드가 아니라 경로
                  참조입니다 (예: /books/{book.id}/04.png — 새 이미지는 저장소 public 폴더에 추가).
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
