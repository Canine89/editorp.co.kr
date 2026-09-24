#!/usr/bin/env node
/**
 * 무료 도서 이미지 크기 목록 생성기
 *
 * 사용법: node scripts/book-image-sizes.mjs [책-id ...]   (생략 시 전체)
 *
 * public/books/<책-id>/ 의 PNG·JPEG·WebP 크기를 읽어 content/books/<책-id>/images.json 에 기록한다.
 * 리더가 <img>에 width/height를 넣어 로딩 중 레이아웃이 밀리지 않게 하기 위함이다.
 * public/ 은 서버리스 번들에 포함되지 않으므로 크기는 content/books 쪽에 둔다.
 * 원고 이미지를 바꾸거나 새 책을 임포트한 뒤 다시 실행한다.
 */

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BOOKS = path.join(ROOT, 'content/books');

function imageSize(file) {
  const b = fs.readFileSync(file);
  // PNG: IHDR 청크의 가로·세로
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  // JPEG: SOF 마커를 찾는다
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  // WebP: VP8(손실) / VP8L(무손실) / VP8X(확장) 헤더
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  }
  return null;
}

const ids = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(BOOKS).filter((d) => fs.existsSync(path.join(BOOKS, d, 'book.json')));

for (const id of ids) {
  const dir = path.join(ROOT, 'public/books', id);
  if (!fs.existsSync(dir)) {
    console.log(`[${id}] 이미지 폴더 없음, 건너뜀`);
    continue;
  }
  const sizes = {};
  for (const name of fs.readdirSync(dir).sort()) {
    if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
    const size = imageSize(path.join(dir, name));
    if (size) sizes[`/books/${id}/${name}`] = size;
  }
  fs.writeFileSync(path.join(BOOKS, id, 'images.json'), JSON.stringify(sizes, null, 2) + '\n');
  console.log(`[${id}] ${Object.keys(sizes).length}개 → content/books/${id}/images.json`);
}
