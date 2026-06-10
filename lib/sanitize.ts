import sanitizeHtml from 'sanitize-html';

/**
 * 게시글 본문 HTML 정화 정책.
 * 에디터(Tiptap)가 생성하는 태그만 허용하고 나머지는 전부 제거한다 (XSS 방지).
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's',
    'h2', 'h3',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // 링크는 항상 새 탭 + noopener로 강제
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}

/** HTML에서 텍스트만 추출 (길이 검증용) */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}
