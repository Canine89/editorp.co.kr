import sanitizeHtml from 'sanitize-html';

/**
 * 도서 본문 HTML 정화 정책.
 * 원고 마크다운(저장소 파일·관리자가 리더에서 고친 오버레이)을 marked로 변환한 결과에 적용한다.
 * 허용 범위: 제목(h2~h4), 이미지, 표까지.
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
  // 원고의 이미지 크기가 <img style="width: NN%">로 들어 있으므로 width(%)만 허용
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
