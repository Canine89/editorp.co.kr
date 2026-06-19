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

/**
 * 도서 본문 HTML 정화 정책.
 * 저장소 안의 마크다운(저자 직접 작성)을 marked로 변환한 결과에 적용한다.
 * 게시글보다 넓은 허용 범위: h4, 이미지, 표까지 허용.
 */
const BOOK_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'em', 'u', 's', 'del',
    'h2', 'h3', 'h4',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'hr', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'figure', 'figcaption',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'style'],
    code: ['class'],
    pre: ['class'],
    th: ['align'],
    td: ['align'],
    ol: ['start'],
  },
  // 에디터의 이미지 크기 조정이 style="width: NN%"로 저장되므로 width(%)만 허용
  allowedStyles: {
    img: {
      width: [/^\d{1,3}(\.\d+)?%$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

export function sanitizeBookHtml(html: string): string {
  return sanitizeHtml(html, BOOK_OPTIONS).trim();
}

/** HTML에서 텍스트만 추출 (길이 검증용) */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}
