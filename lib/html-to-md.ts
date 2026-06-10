import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * 도서 에디터(Tiptap)가 내놓는 HTML을 절 마크다운으로 변환한다.
 * 저장 파이프라인: Tiptap HTML → sanitize → 이 변환 → content/books 마크다운.
 */
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
});

turndown.use(gfm); // 표, 취소선
turndown.keep(['u']); // 마크다운에 밑줄이 없으므로 <u>는 인라인 HTML로 보존

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}
