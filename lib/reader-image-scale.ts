import { marked, type Tokens } from 'marked';

export const READER_IMAGE_SCALES = [100, 75, 50, 25] as const;
export type ReaderImageScale = (typeof READER_IMAGE_SCALES)[number];
const SCALE_MARKER = /\s*\[reader-scale=(100|75|50|25)\]\s*$/;

/** 일반 마크다운 이미지 제목 끝에 표시 배율만 보관한다. 경로·대체 텍스트·제목은 유지한다. */
export function readerImageScale(title: string | null | undefined): ReaderImageScale {
  const value = title?.match(SCALE_MARKER)?.[1];
  return value ? Number(value) as ReaderImageScale : 100;
}

export function editableReaderImage(raw: string): Tokens.Image | null {
  const blocks = marked.lexer(raw).filter((token) => token.type !== 'space');
  if (blocks.length !== 1 || blocks[0].type !== 'paragraph') return null;
  const inline = (blocks[0] as Tokens.Paragraph).tokens;
  return inline.length === 1 && inline[0].type === 'image' ? inline[0] as Tokens.Image : null;
}

export function setReaderImageScale(raw: string, scale: ReaderImageScale): string {
  const image = editableReaderImage(raw);
  if (!image || !READER_IMAGE_SCALES.includes(scale)) return raw;
  const originalTitle = (image.title || '').replace(SCALE_MARKER, '').trim();
  const title = [originalTitle, scale === 100 ? '' : `[reader-scale=${scale}]`].filter(Boolean).join(' ');
  const alt = image.text.replace(/[\\[\]]/g, '\\$&');
  const href = image.href.replace(/</g, '%3C').replace(/>/g, '%3E');
  const quotedTitle = title ? ` "${title.replace(/[\\"]/g, '\\$&')}"` : '';
  return raw.replace(image.raw, `![${alt}](<${href}>${quotedTitle})`);
}
