import fs from 'fs';
import path from 'path';
import { marked, type Token, type Tokens, type TokensList } from 'marked';
import { createHighlighter, type Highlighter, type ThemeRegistration } from 'shiki';
import { getSectionMarkdown, type BookSectionMeta } from './books';
import { sanitizeBookHtml } from './sanitize';
import { removeEmptyStudyLabels } from './reader-presentation';

/**
 * 리더 전용 절 렌더러.
 *
 * 관리자 편집기는 renderSectionHtml()의 단순 HTML을 받아 편집·역변환하므로 그대로 두고,
 * 독자 화면만 이 렌더러로 꾸민다.
 *  - 코드 블록: Shiki 서버 구문 강조(바로바로 팔레트 전용 테마)
 *  - "01 ..." 로 시작하는 실습 단계 문단과 뒤따르는 이미지를 번호 절차로 묶음 (책의 번호를 그대로 표시)
 *  - 코너 박스: 인용문 첫 줄이 **NOTE**·**프롬프트**·**AI 답변**·**잠깐 퀴즈**·**1:1 코칭 · …**·**바로 핵심 요약** 등이면 종류별 스타일
 *  - 이미지만 있는 문단: 크기(images.json)를 넣은 figure
 *  - h2: 앵커 id, "[연습 NN]"·"바로 NN" 은 번호 라벨로 분리
 * 사용자 원고에서 온 HTML은 토큰 단위로 sanitizeBookHtml()을 거친다.
 */

export interface ReaderHeading {
  id: string;
  text: string;
}

export interface ReaderSection {
  html: string;
  headings: ReaderHeading[];
  codeCount: number;
  readMinutes: number;
}

const BOOKS_DIR = path.join(process.cwd(), 'content', 'books');

const mkTheme = (c: Record<string, string>): ThemeRegistration => ({
  name: 'barobaro-light',
  type: 'light',
  colors: { 'editor.background': c.bg, 'editor.foreground': c.fg },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.comment, fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'keyword.operator.logical', 'constant.language'], settings: { foreground: c.keyword, fontStyle: 'bold' } },
    { scope: ['string', 'punctuation.definition.string', 'constant.character.escape'], settings: { foreground: c.string } },
    { scope: ['constant.numeric'], settings: { foreground: c.keyword } },
    { scope: ['support.function', 'entity.name.function', 'meta.function-call.generic'], settings: { foreground: c.fg } },
    { scope: ['meta.format', 'constant.character.format', 'storage.type.string', 'meta.fstring punctuation'], settings: { foreground: c.keyword } },
    { scope: ['keyword.operator', 'punctuation'], settings: { foreground: c.punct } },
  ],
});

// 문자열 황토 #8A5A00은 흰 바탕 대비 5.9:1 (DESIGN.md 팔레트)
const THEME = mkTheme({ bg: '#F5F7FB', fg: '#0E1733', comment: '#6B7388', keyword: '#1F4292', string: '#8A5A00', punct: '#5D6577' });
const LANGS = ['python', 'javascript', 'typescript', 'bash', 'json', 'html', 'css'];
const LANG_LABEL: Record<string, string> = {
  python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript', bash: 'Bash', json: 'JSON', html: 'HTML', css: 'CSS',
};

let highlighter: Promise<Highlighter> | null = null;
function getHighlighter() {
  highlighter ??= createHighlighter({ themes: [THEME], langs: LANGS });
  return highlighter;
}

const imageSizeCache = new Map<string, Record<string, { width: number; height: number }>>();
function imageSizes(bookId: string) {
  if (!imageSizeCache.has(bookId)) {
    const file = path.join(BOOKS_DIR, bookId, 'images.json');
    imageSizeCache.set(bookId, fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : {});
  }
  return imageSizeCache.get(bookId)!;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
/** 원고 이미지 경로는 사이트 내부 경로 또는 https만 허용 */
const safeSrc = (src: string) => /^\/(?!\/)[\w\-./%]+$/.test(src) || /^https:\/\//.test(src);

const CORNERS: [RegExp, string][] = [
  [/^NOTE$/, 'note'],
  [/^프롬프트$/, 'prompt'],
  [/^AI 답변$/, 'answer'],
  [/^잠깐 퀴즈$/, 'quiz'],
  [/^1:1 코칭/, 'coach'],
  [/^바로 핵심 요약$/, 'summary'],
  [/^(미리 알아두세요|기억하고 있나요)/, 'side'],
];
/** 인용문 첫 줄의 굵은 라벨로 코너 종류를 정해 class를 붙인다 (정화가 끝난 HTML에만 적용) */
function corner(quoteHtml: string): string {
  const m = quoteHtml.match(/^<blockquote>\s*<p><strong>([^<]+)<\/strong><\/p>/);
  const kind = m && CORNERS.find(([re]) => re.test(m[1].trim()))?.[1];
  if (!m || !kind) return quoteHtml;
  return quoteHtml.replace(m[0], `<blockquote class="corner corner-${kind}"><p class="corner-label">${m[1]}</p>`);
}

export async function renderReaderSection(
  bookId: string,
  section: BookSectionMeta,
): Promise<ReaderSection | null> {
  const raw = await getSectionMarkdown(bookId, section);
  if (raw === null) return null;
  const markdown = raw
    // "print( )" 처럼 괄호 사이 공백에서 줄이 끊기지 않게
    .replace(/\( \)/g, '( )')
    // 워드 원고의 자동 링크: [<u>test.py</u>](http://test.py) → `test.py` (운영 오버레이 원고에도 남아 있다)
    .replace(/\[(?:<u>)?([\w-]+\.(?:py|js|ts|txt|csv|json|html|css|md))(?:<\/u>)?\]\(http:\/\/\1\/?\)/gi, '`$1`');
  const tokens = marked.lexer(markdown);
  const hl = await getHighlighter();
  const sizes = imageSizes(bookId);

  const parse = (list: Token[]) =>
    sanitizeBookHtml(marked.parser(Object.assign(list, { links: (tokens as TokensList).links }) as TokensList));
  const isImageOnly = (t: Token): t is Tokens.Paragraph =>
    t.type === 'paragraph' && (t as Tokens.Paragraph).tokens.length === 1 && (t as Tokens.Paragraph).tokens[0].type === 'image';

  let imageNo = 0;
  const figure = (img: Tokens.Image) => {
    if (!safeSrc(img.href)) return '';
    imageNo++;
    const size = sizes[img.href];
    const alt = img.text?.trim() || `실습 화면 ${imageNo}`;
    return `<figure><img src="${escapeHtml(img.href)}" alt="${escapeHtml(alt)}"${size ? ` width="${size.width}" height="${size.height}"` : ''} loading="lazy" decoding="async"></figure>`;
  };

  const headings: ReaderHeading[] = [];
  let codeCount = 0;
  let html = '';
  let steps: { no: string; html: string }[] | null = null;
  const closeSteps = () => {
    if (steps) html += `<ol class="steps">${steps.map((s) => `<li data-no="${s.no}">${s.html}</li>`).join('')}</ol>`;
    steps = null;
  };

  for (const t of tokens) {
    if (t.type === 'space') continue;

    // 실습 단계: "01 설명..." 문단 + 뒤따르는 이미지
    const stepNo = t.type === 'paragraph' ? (t as Tokens.Paragraph).text.match(/^(\d{2})\s/) : null;
    if (stepNo) {
      const text = (t as Tokens.Paragraph).text.replace(/^\d{2}\s+/, '');
      steps ??= [];
      steps.push({ no: stepNo[1], html: parse([{ ...(t as Tokens.Paragraph), text, tokens: marked.Lexer.lexInline(text) }]) });
      continue;
    }
    if (steps && isImageOnly(t)) {
      steps[steps.length - 1].html += figure(t.tokens[0] as Tokens.Image);
      continue;
    }
    closeSteps();

    if (isImageOnly(t)) {
      html += figure(t.tokens[0] as Tokens.Image);
      continue;
    }
    if (t.type === 'code') {
      const code = t as Tokens.Code;
      const lang = LANGS.includes(code.lang ?? '') ? code.lang! : 'text';
      const lines = code.text.split('\n').length;
      codeCount++;
      const body = hl.codeToHtml(code.text, { lang, theme: 'barobaro-light' });
      html += `<div class="code"><div class="code-head"><span>${LANG_LABEL[lang] ?? '코드'} · ${lines}줄</span><button type="button" data-copy>복사</button></div>${body}</div>`;
      continue;
    }
    if (t.type === 'heading' && (t as Tokens.Heading).depth === 2) {
      const heading = t as Tokens.Heading;
      const m = heading.text.match(/^\\?\[연습 (\d+)\\?\]\s*(.*)$/) ?? heading.text.match(/^(바로) (\d+)\s+(.*)$/);
      const label = m ? (m.length === 4 ? `바로 ${m[2]}` : `연습 ${m[1]}`) : null;
      const rest = m ? m[m.length - 1] : heading.text;
      const id = label ? `ex-${label.replace(/\D/g, '')}` : `h-${headings.length + 1}`;
      const inner = sanitizeBookHtml(marked.parseInline(rest, { async: false }) as string);
      headings.push({ id, text: (label ? `${label} ` : '') + stripTags(inner) });
      html += `<h2 id="${id}">${label ? `<span class="no mark">${label}</span>` : ''}${inner}</h2>`;
      continue;
    }
    if (t.type === 'blockquote') {
      html += corner(parse([t]));
      continue;
    }
    html += parse([t]);
  }
  closeSteps();

  html = removeEmptyStudyLabels(html);
  const readMinutes = Math.max(1, Math.round(stripTags(html).length / 500));
  return { html, headings, codeCount, readMinutes };
}
