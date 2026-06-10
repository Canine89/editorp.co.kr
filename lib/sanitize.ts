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
    'a', 'img', 'hr',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // 링크는 항상 새 탭 + noopener로 강제
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
  // 이미지는 http(s) 절대 URL만 허용 (상대 경로·빈 src는 깨진 이미지로 남으므로 제거)
  exclusiveFilter: (frame) =>
    frame.tag === 'img' && !/^https?:\/\//i.test(frame.attribs.src || ''),
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
