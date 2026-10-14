'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUp, ArrowDown, BookOpen, Eye, EyeOff, ExternalLink, Pencil, RotateCcw } from 'lucide-react';
import type { Book, BookDetails } from '@/lib/books';
import styles from './BookAdminList.module.css';

type AdminBook = Book & { sectionCount: number; overridden: string[] };

export function BookAdminList({ initialBooks }: { initialBooks: AdminBook[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [savedOrder, setSavedOrder] = useState(initialBooks.map((book) => book.id));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookDetails>({ title: '', subtitle: '', author: '', description: '' });
  const orderChanged = books.some((book, index) => book.id !== savedOrder[index]);
  const notify = (text: string, isError = false) => setMessage({ text, isError });

  const request = async (url: string, body: unknown, method = 'PUT') => {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장에 실패했습니다.');
    return data;
  };

  const move = (index: number, offset: number) => {
    setBooks((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
    setMessage(null);
  };

  const saveOrder = async () => {
    setBusy(true);
    try {
      const ids = books.map((book) => book.id);
      const data = await request('/api/admin/books/order', { bookIds: ids });
      setSavedOrder(ids);
      notify(data.message);
    } catch (error) {
      notify(error instanceof Error ? error.message : '순서 저장에 실패했습니다.', true);
    } finally { setBusy(false); }
  };

  const togglePublish = async (book: Book) => {
    const next = book.isPublished === false;
    setBusy(true);
    try {
      const data = await request('/api/admin/books/publish', { bookId: book.id, isPublished: next });
      setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, isPublished: next } : b));
      notify(`‘${book.title}’ ${next ? '공개' : '비공개'} 처리. ${data.message}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '공개 설정 변경 실패', true);
    } finally { setBusy(false); }
  };

  const saveDetails = async (bookId: string) => {
    setBusy(true);
    try {
      const data = await request('/api/admin/books/details', { bookId, details: draft });
      setBooks((prev) => prev.map((book) => book.id === bookId ? { ...book, ...data.details } : book));
      setEditId(null);
      notify(data.message);
    } catch (error) {
      notify(error instanceof Error ? error.message : '소개 저장에 실패했습니다.', true);
    } finally { setBusy(false); }
  };

  const revertBook = async (book: AdminBook) => {
    if (!window.confirm(`‘${book.title}’에서 사이트에서 고친 절을 모두 버리고 파일 원본으로 되돌릴까요?\n\n${book.overridden.map((title) => `· ${title}`).join('\n')}`)) return;
    setBusy(true);
    try {
      const data = await request('/api/admin/books/revert', { bookId: book.id }, 'POST');
      setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, overridden: [] } : b));
      notify(`‘${book.title}’ ${data.message}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : '되돌리기에 실패했습니다.', true);
    } finally { setBusy(false); }
  };

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <div><h1><BookOpen size={24} aria-hidden="true" /> 도서 관리</h1><p>서재의 도서 순서와 소개, 공개 상태를 관리합니다.</p></div>
        <nav aria-label="관리자 메뉴">
          <Link className="btn btn-secondary" href="/admin">로드맵 관리</Link>
          <Link className="btn btn-secondary" href="/admin/comments">독자 댓글</Link>
          <Link className="btn btn-secondary" href="/books" target="_blank">서재 확인 <ExternalLink size={14} aria-hidden="true" /></Link>
        </nav>
      </header>
      <div className={styles.summary}>
        <span>등록 도서 <b>{books.length}</b></span>
        <span>공개 <b>{books.filter((b) => b.isPublished !== false).length}</b></span>
        <span>비공개 <b>{books.filter((b) => b.isPublished === false).length}</b></span>
        <span>수정된 원고 <b>{books.filter((b) => b.overridden.length > 0).length}권</b></span>
      </div>
      <div className={styles.orderBar}>
        <div><b>서재에 표시할 순서</b><p>위·아래 버튼으로 순서를 바꾼 뒤 저장하세요. 비공개 책은 순서를 유지한 채 서재에서 숨겨집니다.</p></div>
        <div className={styles.actions}>
          <span className={styles.orderState} role="status">{orderChanged ? '저장하지 않은 순서 변경' : '저장된 순서'}</span>
          <button className="btn btn-secondary" type="button" disabled={busy || !orderChanged} onClick={() => {
            setBooks((current) => savedOrder.map((id) => current.find((book) => book.id === id)!));
            setMessage(null);
          }}>순서 되돌리기</button>
          <button className="btn btn-primary" type="button" disabled={busy || !orderChanged} onClick={saveOrder}>{busy ? '처리 중…' : '순서 저장'}</button>
        </div>
      </div>
      {message && <p role={message.isError ? 'alert' : 'status'} className={`${styles.message} ${message.isError ? styles.error : ''}`}>{message.text}</p>}
      {books.length === 0 && <p>등록된 책이 없습니다.</p>}
      <ol className={styles.list} aria-label="서재 도서 관리 목록">
        {books.map((book, index) => {
          const published = book.isPublished !== false;
          return (
            <li key={book.id} className={styles.book}>
              <div className={styles.row}>
                <div className={styles.reorder}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <button type="button" disabled={busy || index === 0} aria-label={`${book.title} 위로 이동`} onClick={() => move(index, -1)}><ArrowUp size={18} aria-hidden="true" /></button>
                  <button type="button" disabled={busy || index === books.length - 1} aria-label={`${book.title} 아래로 이동`} onClick={() => move(index, 1)}><ArrowDown size={18} aria-hidden="true" /></button>
                </div>
                {book.cover ? <Image className={styles.cover} src={book.cover} alt="" width={60} height={82} unoptimized /> : <BookOpen size={32} aria-hidden="true" />}
                <div className={styles.info}>
                  <div className={styles.title}><h2>{book.title}</h2><span className={published ? styles.published : styles.unpublished}>{published ? '공개' : '비공개'}</span></div>
                  <p>{book.author} · 총 {book.sectionCount}개 절</p>
                  {book.id === 'free-book-guide' && <p>집필 예제 · 서재 목록에는 표시되지 않습니다.</p>}
                  {book.overridden.length > 0 && <p title={book.overridden.join('\n')}>사이트에서 고친 절 {book.overridden.length}개</p>}
                </div>
                <div className={styles.actions}>
                  <button type="button" className="btn btn-secondary" disabled={busy || editId !== null} onClick={() => {
                    setDraft({ title: book.title, subtitle: book.subtitle || '', author: book.author, description: book.description });
                    setEditId(book.id); setMessage(null);
                  }}><Pencil size={14} aria-hidden="true" /> 소개 수정</button>
                  <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => togglePublish(book)}>
                    {published ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />}{published ? '비공개로 전환' : '공개로 전환'}
                  </button>
                  {published && <Link className="btn btn-secondary" href={`/books/${book.id}`} target="_blank"><ExternalLink size={14} aria-hidden="true" /> 책 확인</Link>}
                  {book.overridden.length > 0 && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => revertBook(book)}><RotateCcw size={14} aria-hidden="true" /> 원고 되돌리기</button>}
                </div>
              </div>
              {editId === book.id && (
                <form className={styles.editor} onSubmit={(event) => { event.preventDefault(); void saveDetails(book.id); }}>
                  <h3>도서 소개 수정</h3>
                  <div className={styles.fields}>
                    <label>제목<input required maxLength={200} value={draft.title} disabled={busy} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
                    <label>부제<input maxLength={200} value={draft.subtitle} disabled={busy} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} /></label>
                    <label>저자<input required maxLength={200} value={draft.author} disabled={busy} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></label>
                    <label className={styles.description}>소개글<textarea required maxLength={3000} rows={5} value={draft.description} disabled={busy} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
                  </div>
                  <div className={styles.actions}><button className="btn btn-primary" disabled={busy}>{busy ? '저장 중…' : '소개 저장'}</button><button className="btn btn-secondary" type="button" disabled={busy} onClick={() => setEditId(null)}>취소</button></div>
                </form>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
