import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { sanitizeBookHtml } from './sanitize';
import { getDb, isFirebaseConfigured } from './firebase-admin';

/**
 * 무료 도서 데이터 레이어.
 *
 * 원본은 `content/books/<책-id>/` 폴더에 저장한다 (임포터가 생성).
 *  - book.json  : 메타데이터 + 마당 > 장 > 절 목차
 *  - sections/  : 절 단위 마크다운 원고
 *
 * 관리자 패널의 수정사항은 로드맵과 같은 패턴으로 저장한다:
 *  - 운영(Firestore 설정 시): bookOverrides/{bookId} 문서(공개 여부) +
 *    bookOverrides/{bookId}/sections/{sectionId} 문서(절 마크다운) 오버레이.
 *    파일 원본 위에 덮어씌워 재배포 없이 즉시 반영된다.
 *  - 개발(Firestore 미설정): content/books/ 파일을 직접 수정한다.
 */

const BOOKS_DIR = path.join(process.cwd(), 'content', 'books');
/** URL 파라미터로 들어오는 id는 소문자/숫자/하이픈만 허용 (경로 탈출 방지) */
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;

export interface BookSectionMeta {
  id: string; // 책 안에서 유일, URL에 사용 (예: "1-2")
  title: string;
  file: string; // sections/ 아래 마크다운 파일명
}

export interface BookChapter {
  id: string;
  title: string;
  sections: BookSectionMeta[];
}

export interface BookPart {
  id: string;
  title: string;
  chapters: BookChapter[];
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  author: string;
  publishedAt?: string; // YYYY-MM-DD
  cover?: string; // public/ 기준 경로 (선택)
  tags?: string[];
  isPublished?: boolean; // false면 사이트에서 숨김 (기본 공개)
  parts: BookPart[];
  /** 종이책·전자책 구매처. 일부만 공개한 책은 마지막 절과 목차에서 안내한다 */
  purchase?: { label: string; url: string }[];
  /** 일부만 공개한 책: 공개 범위 설명과, 책에서 이어지는 목차(링크 없음) */
  preview?: { note: string; badge?: string; rest: { title: string; items: string[] }[] };
}

export interface FlatSection {
  part: BookPart;
  chapter: BookChapter;
  section: BookSectionMeta;
}

// ── 파일 원본 읽기 ───────────────────────────────────────────

function readLocalBook(id: string): Book | null {
  try {
    const file = path.join(BOOKS_DIR, id, 'book.json');
    if (!fs.existsSync(file)) return null;
    const book = JSON.parse(fs.readFileSync(file, 'utf-8')) as Book;
    book.id = id; // 폴더명이 곧 책 id
    return book;
  } catch (error) {
    console.error(`도서 메타데이터 읽기 실패 (${id}):`, error);
    return null;
  }
}

function listLocalBooks(): Book[] {
  if (!fs.existsSync(BOOKS_DIR)) return [];
  return fs
    .readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SAFE_ID.test(entry.name))
    .map((entry) => readLocalBook(entry.name))
    .filter((book): book is Book => book !== null)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

// ── Firestore 오버레이 ───────────────────────────────────────

interface BookOverride {
  isPublished?: boolean;
}

async function getOverride(bookId: string): Promise<BookOverride | null> {
  if (!isFirebaseConfigured()) return null;
  try {
    const snap = await getDb().doc(`bookOverrides/${bookId}`).get();
    return snap.exists ? (snap.data() as BookOverride) : null;
  } catch (error) {
    console.error(`도서 오버라이드 읽기 실패 (${bookId}):`, error);
    return null;
  }
}

async function getAllOverrides(): Promise<Map<string, BookOverride>> {
  const map = new Map<string, BookOverride>();
  if (!isFirebaseConfigured()) return map;
  try {
    const snap = await getDb().collection('bookOverrides').get();
    snap.docs.forEach((d) => map.set(d.id, d.data() as BookOverride));
  } catch (error) {
    console.error('도서 오버라이드 목록 읽기 실패:', error);
  }
  return map;
}

function applyOverride(book: Book, override: BookOverride | null | undefined): Book {
  if (!override) return book;
  return { ...book, isPublished: override.isPublished ?? book.isPublished };
}

// ── 공개 조회 API ────────────────────────────────────────────

export function isBookPublished(book: Book): boolean {
  return book.isPublished !== false;
}

/** 책 목록 (최신 출간순). 기본은 공개된 책만 */
export async function listBooks(includeUnpublished = false): Promise<Book[]> {
  const overrides = await getAllOverrides();
  const books = listLocalBooks().map((b) => applyOverride(b, overrides.get(b.id)));
  return includeUnpublished ? books : books.filter(isBookPublished);
}

export async function getBook(bookId: string, includeUnpublished = false): Promise<Book | null> {
  if (!SAFE_ID.test(bookId)) return null;
  const local = readLocalBook(bookId);
  if (!local) return null;
  const book = applyOverride(local, await getOverride(bookId));
  if (!includeUnpublished && !isBookPublished(book)) return null;
  return book;
}

/** 책 페이지의 공유 미리보기(Open Graph). 이미지는 scripts/make-og-images.py가 만든 public/og/<책-id>.jpg */
export function bookShareMetadata(book: Book, opts: { title: string; description: string; path: string }) {
  const image = { url: `/og/${book.id}.jpg`, width: 1200, height: 630, alt: `${book.title} 표지` };
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: opts.path },
    openGraph: {
      siteName: '편집자P의 AI 서재',
      title: opts.title,
      description: opts.description,
      url: opts.path,
      locale: 'ko_KR',
      type: 'article' as const,
      images: [image],
    },
    twitter: { card: 'summary_large_image' as const, title: opts.title, description: opts.description, images: [image.url] },
  };
}

/** 마당 > 장 > 절 트리를 읽기 순서대로 평탄화 — 이전/다음 절 내비게이션용 */
export function flattenSections(book: Book): FlatSection[] {
  return book.parts.flatMap((part) =>
    part.chapters.flatMap((chapter) =>
      chapter.sections.map((section) => ({ part, chapter, section }))
    )
  );
}

/** 목차 밖(이어 읽기, 이전·다음)에서 쓰는 절 이름. "들어가며"처럼 장마다 반복되는 제목에는 장 번호를 붙인다 */
export function sectionLabel(flat: FlatSection): string {
  const { section, chapter } = flat;
  return /^\d/.test(section.title) ? section.title : `${chapter.title.match(/^\d+장/)?.[0] ?? ''} ${section.title}`.trim();
}

export function countSections(book: Book): number {
  return flattenSections(book).length;
}

// ── 절 본문 ─────────────────────────────────────────────────

function sectionFilePath(bookId: string, section: BookSectionMeta): string | null {
  if (!SAFE_ID.test(bookId)) return null;
  const sectionsDir = path.join(BOOKS_DIR, bookId, 'sections');
  const filePath = path.resolve(sectionsDir, section.file);
  // book.json이 잘못 작성돼도 책 폴더 밖의 파일은 절대 읽지 않는다
  if (!filePath.startsWith(sectionsDir + path.sep)) return null;
  return filePath;
}

/** 절 마크다운 (Firestore 오버레이 우선, 없으면 파일 원본). 둘 다 없으면 null */
export async function getSectionMarkdown(
  bookId: string,
  section: BookSectionMeta
): Promise<string | null> {
  if (isFirebaseConfigured()) {
    try {
      const snap = await getDb().doc(`bookOverrides/${bookId}/sections/${section.id}`).get();
      const markdown = snap.data()?.markdown;
      if (typeof markdown === 'string') return markdown;
    } catch (error) {
      console.error(`절 오버라이드 읽기 실패 (${bookId}/${section.id}):`, error);
    }
  }
  const filePath = sectionFilePath(bookId, section);
  if (!filePath || !fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

/** 절 마크다운을 정화된 HTML로 변환. 없으면 null */
export async function renderSectionHtml(
  bookId: string,
  section: BookSectionMeta
): Promise<string | null> {
  const markdown = await getSectionMarkdown(bookId, section);
  if (markdown === null) return null;
  const html = marked.parse(markdown, { async: false, gfm: true, breaks: false });
  return sanitizeBookHtml(html);
}

// ── 관리자 저장 API (운영: Firestore 오버레이 / 개발: 파일 직접 수정) ──

export async function setBookPublished(bookId: string, isPublished: boolean): Promise<string> {
  if (!SAFE_ID.test(bookId) || !readLocalBook(bookId)) {
    throw new Error(`존재하지 않는 책입니다: ${bookId}`);
  }
  if (isFirebaseConfigured()) {
    await getDb().doc(`bookOverrides/${bookId}`).set({ isPublished }, { merge: true });
    return '저장되었습니다. 재배포 없이 바로 반영됩니다.';
  }
  if (process.env.NODE_ENV === 'development') {
    const file = path.join(BOOKS_DIR, bookId, 'book.json');
    const book = JSON.parse(fs.readFileSync(file, 'utf-8'));
    book.isPublished = isPublished;
    fs.writeFileSync(file, JSON.stringify(book, null, 2) + '\n');
    return '개발 모드: 로컬 book.json에 저장되었습니다.';
  }
  throw new Error('Firebase 환경 변수가 설정되지 않아 저장할 수 없습니다.');
}

export async function saveSectionMarkdown(
  bookId: string,
  sectionId: string,
  markdown: string
): Promise<string> {
  const book = await getBook(bookId, true);
  const flat = book ? flattenSections(book).find((f) => f.section.id === sectionId) : null;
  if (!book || !flat) {
    throw new Error(`존재하지 않는 절입니다: ${bookId}/${sectionId}`);
  }
  if (isFirebaseConfigured()) {
    await getDb()
      .doc(`bookOverrides/${bookId}/sections/${sectionId}`)
      .set({ markdown, updatedAt: new Date().toISOString() });
    return '저장되었습니다. 재배포 없이 바로 반영됩니다.';
  }
  if (process.env.NODE_ENV === 'development') {
    const filePath = sectionFilePath(bookId, flat.section);
    if (!filePath) throw new Error('잘못된 절 파일 경로입니다.');
    fs.writeFileSync(filePath, markdown.trimEnd() + '\n');
    return '개발 모드: 로컬 마크다운 파일에 저장되었습니다.';
  }
  throw new Error('Firebase 환경 변수가 설정되지 않아 저장할 수 없습니다.');
}

/** 절 오버레이 삭제 → 파일 원본으로 복원 (Firestore 모드에서만 의미 있음) */
export async function revertSectionMarkdown(bookId: string, sectionId: string): Promise<string> {
  if (!SAFE_ID.test(bookId) || !/^[\w-]+$/.test(sectionId)) {
    throw new Error('잘못된 식별자입니다.');
  }
  if (!isFirebaseConfigured()) {
    throw new Error('개발 모드에서는 파일이 곧 원본이라 되돌릴 수 없습니다. git을 사용하세요.');
  }
  await getDb().doc(`bookOverrides/${bookId}/sections/${sectionId}`).delete();
  return '수정사항을 버리고 파일 원본으로 되돌렸습니다.';
}

// ── 리더에서 블록 하나 바로 고치기 (관리자) ──────────────────────
// 리더가 블록마다 붙인 data-src(원고 marked 토큰 번호)로 원고의 그 부분만 읽고 바꾼다.

/** 다른 곳에서 먼저 고쳐 원고가 달라졌을 때 */
export class BlockConflictError extends Error {}

async function sectionSource(bookId: string, sectionId: string) {
  const book = await getBook(bookId, true);
  const flat = book ? flattenSections(book).find((f) => f.section.id === sectionId) : null;
  if (!book || !flat) throw new Error(`존재하지 않는 절입니다: ${bookId}/${sectionId}`);
  const markdown = await getSectionMarkdown(bookId, flat.section);
  if (markdown === null) throw new Error('절 본문을 읽을 수 없습니다.');
  return { markdown, tokens: marked.lexer(markdown) };
}

/** 블록의 원고(마크다운) */
export async function getSectionBlock(bookId: string, sectionId: string, index: number): Promise<string> {
  const { tokens } = await sectionSource(bookId, sectionId);
  const token = tokens[index];
  if (!token || token.type === 'space') throw new BlockConflictError('원고가 바뀌었습니다. 새로고침한 뒤 다시 시도해 주세요.');
  return token.raw;
}

/**
 * 블록 하나를 새 마크다운으로 바꿔 절 전체를 저장한다. 비우면 그 블록을 지운다.
 * original은 편집을 시작할 때 받은 원고 — 그새 달라졌으면 덮어쓰지 않는다.
 */
export async function replaceSectionBlock(
  bookId: string,
  sectionId: string,
  index: number,
  original: string,
  replacement: string,
): Promise<string> {
  const { markdown, tokens } = await sectionSource(bookId, sectionId);
  const token = tokens[index];
  const conflict = new BlockConflictError('그새 이 절이 수정되었습니다. 새로고침한 뒤 다시 고쳐 주세요.');
  if (!token || token.type === 'space' || token.raw !== original) throw conflict;

  // 앞 토큰 길이의 합이 원고 위치. 어긋나면(드문 경우) 원고에서 한 번만 나오는지로 찾는다
  let offset = tokens.slice(0, index).reduce((n, t) => n + t.raw.length, 0);
  if (markdown.slice(offset, offset + original.length) !== original) {
    offset = markdown.indexOf(original);
    if (offset < 0 || markdown.indexOf(original, offset + 1) >= 0) throw conflict;
  }
  const body = replacement.replace(/\r\n?/g, '\n').trim();
  const trailing = original.match(/\s*$/)![0];   // 블록 뒤 줄바꿈은 원고 그대로 둔다
  const before = markdown.slice(0, offset);
  const after = markdown.slice(offset + original.length);
  // 지울 때는 앞뒤 빈 줄을 하나로 모은다
  const next = body
    ? before + body + trailing + after
    : before.replace(/\n*$/, '') + (before.trim() && after.trim() ? '\n\n' : '') + after.replace(/^\n*/, '');
  return saveSectionMarkdown(bookId, sectionId, next);
}
