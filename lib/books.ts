import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { sanitizeBookHtml } from './sanitize';

/**
 * 무료 도서 데이터 레이어.
 * 책은 `content/books/<책-id>/` 폴더에 저장한다.
 *  - book.json  : 메타데이터 + 마당 > 장 > 절 목차
 *  - sections/  : 절 단위 마크다운 원고
 * 저장소에 함께 버전 관리되므로 빌드 시점에 정적으로 읽는다.
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
  parts: BookPart[];
}

export interface FlatSection {
  part: BookPart;
  chapter: BookChapter;
  section: BookSectionMeta;
}

function readBook(id: string): Book | null {
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

/** 공개된 모든 책 목록 (최신 출간순) */
export function listBooks(): Book[] {
  if (!fs.existsSync(BOOKS_DIR)) return [];
  return fs
    .readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SAFE_ID.test(entry.name))
    .map((entry) => readBook(entry.name))
    .filter((book): book is Book => book !== null)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}

export function getBook(bookId: string): Book | null {
  if (!SAFE_ID.test(bookId)) return null;
  return readBook(bookId);
}

/** 마당 > 장 > 절 트리를 읽기 순서대로 평탄화 — 이전/다음 절 내비게이션용 */
export function flattenSections(book: Book): FlatSection[] {
  return book.parts.flatMap((part) =>
    part.chapters.flatMap((chapter) =>
      chapter.sections.map((section) => ({ part, chapter, section }))
    )
  );
}

export function countSections(book: Book): number {
  return flattenSections(book).length;
}

/** 절 마크다운을 읽어 정화된 HTML로 변환. 파일이 없으면 null */
export function renderSectionHtml(bookId: string, section: BookSectionMeta): string | null {
  if (!SAFE_ID.test(bookId)) return null;
  const sectionsDir = path.join(BOOKS_DIR, bookId, 'sections');
  const filePath = path.resolve(sectionsDir, section.file);
  // book.json이 잘못 작성돼도 책 폴더 밖의 파일은 절대 읽지 않는다
  if (!filePath.startsWith(sectionsDir + path.sep)) return null;
  if (!fs.existsSync(filePath)) return null;

  const markdown = fs.readFileSync(filePath, 'utf-8');
  const html = marked.parse(markdown, { async: false, gfm: true, breaks: false });
  return sanitizeBookHtml(html);
}
