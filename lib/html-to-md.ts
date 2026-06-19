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

// 크기 지정(style="width: NN%")이 있는 이미지는 마크다운 문법으로 표현할 수 없으므로
// raw HTML로 보존한다. 크기 미지정 이미지는 기존처럼 ![alt](src)로 변환된다.
// keep()은 내장 이미지 규칙보다 우선순위가 낮아 addRule로 등록한다.
turndown.addRule('imgWithWidth', {
  filter: (node) => node.nodeName === 'IMG' && node.getAttribute('style') !== null,
  replacement: (_content, node) => (node as HTMLElement).outerHTML,
});

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html).trim();
}
