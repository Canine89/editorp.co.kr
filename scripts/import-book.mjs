#!/usr/bin/env node
/**
 * 구글 독스 원고(마크다운 덤프) → 무료 도서 폴더 변환기
 *
 * 사용법:
 *   node scripts/import-book.mjs <원고.md> --id <책-id> --title "책 제목" \
 *     [--subtitle "부제"] [--author "저자"] [--description "소개"] [--date YYYY-MM-DD]
 *
 * 원고를 얻는 방법 (둘 다 동작):
 *   1. 구글 독스에서 파일 > 다운로드 > Markdown(.md)
 *   2. 클로드 코드에서 "이 구글 독스 원고 임포트해줘" + 문서 URL
 *
 * 변환 규칙:
 *   - "NN장 ..." 제목(레벨 무관)  → 장
 *   - "...마당" 제목              → 마당 (없으면 책 전체가 단일 마당)
 *   - 그 외 ## 제목               → 절 (장 번호-순번 으로 id 부여)
 *   - 본문 내 ###/####/#####      → 한 단계 승격 (절 페이지의 h1은 절 제목이므로)
 *   - ">>>" 로 시작하는 문단      → 파이썬 코드 블록으로 감싸기
 *   - 빈 제목 줄                  → 제거
 *   - 백슬래시 이스케이프(\!, \[ 등)는 유효한 마크다운이므로 본문에서는 그대로 둔다
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';

// ── CLI 인자 파싱 ────────────────────────────────────────────
const args = process.argv.slice(2);
const inputFile = args[0];
const opt = (name, fallback = '') => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

if (!inputFile || !opt('id') || !opt('title')) {
  console.error('사용법: node scripts/import-book.mjs <원고.md> --id <책-id> --title "책 제목" [--author ...] [--description ...]');
  process.exit(1);
}

const bookId = opt('id');
if (!/^[a-z0-9][a-z0-9-]*$/.test(bookId)) {
  console.error(`책 id는 소문자/숫자/하이픈만 사용할 수 있습니다: ${bookId}`);
  process.exit(1);
}

// ── .docx 입력 지원 ──────────────────────────────────────────
// 구글 독스에서 파일 > 다운로드 > Microsoft Word(.docx)로 받으면
// 본문 속 이미지가 제 위치에 함께 들어온다.
//
// 단, 구글 독스는 이미지 상당수를 mc:AlternateContent(그리기 개체)로
// 감싸는데 pandoc이 이를 누락하므로, pandoc에 넘기기 전에 document.xml의
// 이미지 자리를 ⟦IMG:파일명⟧ 텍스트 마커로 치환해 위치를 보존한다.
let sourceFile = inputFile;
let mediaSrcDir = null;
let lostTextboxes = 0;
/** 그리기 그룹에서 생략한 오버레이 이미지 기록: { kept, dropped[] } */
const droppedOverlays = [];

if (inputFile.endsWith('.docx')) {
  for (const cmd of ['pandoc', 'unzip', 'zip']) {
    try {
      execSync(`${cmd} ${cmd === 'pandoc' ? '--version' : '-v'}`, { stdio: 'ignore' });
    } catch {
      console.error(`.docx 변환에는 ${cmd}가 필요합니다.`);
      process.exit(1);
    }
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'book-import-'));
  const xDir = path.join(tmpDir, 'x');
  execSync(
    `unzip -q -o ${JSON.stringify(path.resolve(inputFile))} -d ${JSON.stringify(xDir)} word/document.xml word/_rels/document.xml.rels 'word/media/*'`
  );

  // rId → media 파일명 매핑
  const rels = fs.readFileSync(path.join(xDir, 'word/_rels/document.xml.rels'), 'utf-8');
  const ridToMedia = {};
  for (const rel of rels.matchAll(/<Relationship\b[^>]*\/?>/g)) {
    const id = rel[0].match(/\bId="([^"]+)"/)?.[1];
    const target = rel[0].match(/\bTarget="media\/([^"]+)"/)?.[1];
    if (id && target) ridToMedia[id] = target;
  }

  // 이미지 구조를 마커 텍스트로 치환.
  // mc:AlternateContent는 중첩될 수 있어(그리기 개체 안의 그리기 개체)
  // 정규식 대신 여닫는 태그의 짝을 추적해 가장 바깥 블록을 통째로 바꾼다.
  const replaceBlocks = (xml, name, fn) => {
    const open = `<${name}`;
    const close = `</${name}>`;
    const isTagBoundary = (ch) => ch === '>' || ch === ' ' || ch === '/';
    let out = '';
    let i = 0;
    while (true) {
      const start = xml.indexOf(open, i);
      if (start === -1) {
        out += xml.slice(i);
        break;
      }
      if (!isTagBoundary(xml[start + open.length])) {
        out += xml.slice(i, start + open.length);
        i = start + open.length;
        continue;
      }
      let depth = 1;
      let j = start + open.length;
      while (depth > 0) {
        const nextOpen = xml.indexOf(open, j);
        const nextClose = xml.indexOf(close, j);
        if (nextClose === -1) {
          j = -1;
          break;
        }
        if (nextOpen !== -1 && nextOpen < nextClose && isTagBoundary(xml[nextOpen + open.length])) {
          depth += 1;
          j = nextOpen + open.length;
        } else {
          depth -= 1;
          j = nextClose + close.length;
        }
      }
      if (j === -1) {
        out += xml.slice(i);
        break;
      }
      const block = xml.slice(start, j);
      out += xml.slice(i, start) + (fn(block) ?? block);
      i = j;
    }
    return out;
  };

  let xml = fs.readFileSync(path.join(xDir, 'word/document.xml'), 'utf-8');

  // 그리기 그룹(이미지 + 화살표·라벨 같은 주석 오버레이)은 합성할 수 없으므로
  // 블록에서 가장 큰 파일(본체 이미지)만 쓰고 나머지는 보고 목록에 남긴다.
  const mediaSize = (f) => {
    try {
      return fs.statSync(path.join(xDir, 'word/media', f)).size;
    } catch {
      return 0;
    }
  };
  const markerFor = (block) => {
    const rids = [...new Set([...block.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]))];
    const files = [...new Set(rids.map((id) => ridToMedia[id]).filter(Boolean))];
    if (files.length === 0) return null;
    if (block.includes('<w:txbxContent>')) lostTextboxes += 1;
    const main = files.reduce((a, b) => (mediaSize(b) > mediaSize(a) ? b : a));
    if (files.length > 1) {
      droppedOverlays.push({ kept: main, dropped: files.filter((f) => f !== main) });
    }
    return `<w:t xml:space="preserve">⟦IMG:${main}⟧</w:t>`;
  };
  xml = replaceBlocks(xml, 'mc:AlternateContent', markerFor);
  xml = replaceBlocks(xml, 'w:drawing', markerFor);
  fs.writeFileSync(path.join(xDir, 'word/document.xml'), xml);

  // 수정된 document.xml로 docx를 다시 묶어 pandoc에 전달
  const modDocx = path.join(tmpDir, 'mod.docx');
  fs.copyFileSync(inputFile, modDocx);
  execSync(`zip -q ${JSON.stringify(modDocx)} word/document.xml`, { cwd: xDir });
  const mdPath = path.join(tmpDir, 'manuscript.md');
  execSync(`pandoc ${JSON.stringify(modDocx)} -t gfm --wrap=none -o ${JSON.stringify(mdPath)}`);

  sourceFile = mdPath;
  mediaSrcDir = path.join(xDir, 'word/media');
}

let raw = fs.readFileSync(sourceFile, 'utf-8');

// ── 이미지 처리 ──────────────────────────────────────────────
// 기본: docx에 박혀 있던 이미지를 그대로 사용.
// --images <폴더>: 저자가 따로 준비한 이미지로 교체.
//   1순위 내용 해시 매칭(파일명·순서 무관), 매칭 실패 시 등장 순서로 대응.
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

/** 복사할 이미지 목록: 배포 파일명 → 원본 절대경로 */
const imageCopies = new Map();

const imagesDir = opt('images');
let suppliedByHash = new Map();
let suppliedOrdered = [];
if (imagesDir) {
  const { createHash } = await import('crypto');
  const hashOf = (p) => createHash('md5').update(fs.readFileSync(p)).digest('hex');
  suppliedOrdered = fs
    .readdirSync(imagesDir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  for (const f of suppliedOrdered) suppliedByHash.set(hashOf(path.join(imagesDir, f)), f);
  if (mediaSrcDir) {
    // 내장 이미지 파일명 → 해시가 같은 제공 이미지 파일명
    const mediaToSupplied = new Map();
    for (const m of fs.readdirSync(mediaSrcDir)) {
      const match = suppliedByHash.get(hashOf(path.join(mediaSrcDir, m)));
      if (match) mediaToSupplied.set(m, match);
    }
    suppliedByHash = mediaToSupplied; // 이후 단계에서 media명 → 제공명 매핑으로 사용
    console.log(`이미지 해시 매칭: 내장 ${fs.readdirSync(mediaSrcDir).length}개 중 ${mediaToSupplied.size}개가 제공 이미지와 일치`);
  }
}

// ⟦IMG:파일명⟧ 마커 → 마크다운 이미지 참조
let imageSlot = 0;
raw = raw.replace(/⟦IMG:([^⟧]+)⟧/g, (_, mediaName) => {
  imageSlot += 1;
  let outName = mediaName;
  let srcPath = mediaSrcDir ? path.join(mediaSrcDir, mediaName) : null;
  if (imagesDir) {
    const matched = suppliedByHash.get(mediaName) ?? suppliedOrdered[imageSlot - 1];
    if (matched) {
      outName = matched;
      srcPath = path.join(imagesDir, matched);
    }
  }
  if (srcPath && fs.existsSync(srcPath)) imageCopies.set(outName, srcPath);
  return `![](/books/${bookId}/${outName})`;
});

if (imageSlot > 0) console.log(`이미지 자리 ${imageSlot}개 처리`);
if (lostTextboxes > 0) {
  console.warn(`주의: 이미지에 겹쳐 있던 텍스트 상자 ${lostTextboxes}개는 옮기지 못했습니다 (이미지에 글자가 포함된 경우는 무관)`);
}
if (droppedOverlays.length > 0) {
  console.warn(`주의: 그리기 그룹 ${droppedOverlays.length}곳에서 본체 이미지만 쓰고 오버레이(화살표·라벨 등)는 생략했습니다. 상세: <책 폴더>/import-report.json`);
}

// ── 유틸 ────────────────────────────────────────────────────
/** 제목 텍스트 정리: ** 제거 + 이스케이프 해제 + 공백 정리 (book.json용 일반 텍스트) */
function cleanTitle(text) {
  return text
    .replace(/\*\*/g, '')
    .replace(/\\([!-/:-@[-`{-~])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 코드 블록 내부용: 모든 백슬래시 이스케이프 해제 (펜스 안에서는 이스케이프가 처리되지 않으므로) */
function unescapeAll(text) {
  return text.replace(/\\([!-/:-@[-`{-~])/g, '$1');
}

const headingRe = /^(#{1,6})\s*(.*)$/;
const isPartTitle = (t) => /마당/.test(t) && t.length < 40;
const isChapterTitle = (t) => /^\d{1,2}\s*장(\s|$)/.test(t);

// ── 1단계: 줄 단위로 마당/장/절 분리 ─────────────────────────
const lines = raw.split('\n');

/** @type {{title:string, chapters:{num:number|null, title:string, sections:{title:string, body:string[]}[]}[]}[]} */
const parts = [];
let currentPart = null;
let currentChapter = null;
let currentSection = null;

const ensurePart = () => {
  if (!currentPart) {
    currentPart = { title: '', chapters: [] };
    parts.push(currentPart);
  }
  return currentPart;
};

/** 본문 줄 추가. 장은 시작됐지만 절이 없으면 "들어가며" 절을 만들어 담는다 */
const pushBody = (text) => {
  if (currentSection) {
    currentSection.body.push(text);
  } else if (currentChapter) {
    currentSection = { title: '들어가며', body: [text], isIntro: true };
    currentChapter.sections.push(currentSection);
  }
};

/** 이미지 참조만 있는 줄 (제목 스타일이 입혀진 이미지 문단 감지용) */
const isImageOnly = (text) => /^(\s*!\[[^\]]*\]\([^)]+\)\s*)+$/.test(text);

for (const line of lines) {
  const m = line.match(headingRe);
  if (m) {
    const level = m[1].length;
    const title = cleanTitle(m[2]);

    if (!title) continue; // 빈 제목 줄 제거

    // 구글 독스는 이미지 문단에 제목 스타일을 입히기도 한다 → 일반 이미지 문단으로
    if (isImageOnly(m[2])) {
      pushBody(m[2].trim());
      continue;
    }

    if (isPartTitle(title) && level <= 2) {
      currentPart = { title, chapters: [] };
      parts.push(currentPart);
      currentChapter = null;
      currentSection = null;
      continue;
    }

    if (isChapterTitle(title)) {
      const num = parseInt(title.match(/^(\d{1,2})/)[1], 10);
      currentChapter = { num, title, sections: [] };
      ensurePart().chapters.push(currentChapter);
      currentSection = null;
      continue;
    }

    if (level <= 2 && currentChapter) {
      // 장 아래의 ## 제목 = 절
      currentSection = { title, body: [] };
      currentChapter.sections.push(currentSection);
      continue;
    }

    // 본문 내 하위 제목: 한 단계 승격해서 본문에 포함
    if (currentSection) {
      const promoted = '#'.repeat(Math.max(2, level - 1));
      currentSection.body.push(`${promoted} ${cleanTitle(m[2])}`);
      continue;
    }
    continue; // 절이 생기기 전의 떠도는 하위 제목은 버린다
  }

  // 일반 본문 줄 (장 도입부는 pushBody가 "들어가며" 절로 수집)
  pushBody(line);
}

// ── 2단계: 본문 다듬기 ───────────────────────────────────────
/**
 * 구글 독스 덤프는 코드도 한 줄 = 한 문단으로 내보내므로,
 * 코드로 보이는 문단을 감지해 연속 구간을 하나의 ```python 펜스로 합친다.
 */
const CODE_LINE_RE = new RegExp(
  [
    /^>>>/, // REPL 프롬프트
    /^#\s/, // 코드 주석 (실제 제목은 1단계에서 이미 분리됨)
    /^(def|class|import|from|if|elif|for|while|with|return|del|assert|raise|lambda)\s/,
    /^(else|elif|try|except|finally)\s*:/,
    /^(break|continue|pass)$/,
    /^[A-Za-z_][\w.]*(\[[^\]]*\])?\s*([+\-*/%]|\*\*|\/\/)?=(?!=)/, // 변수 할당
    /^[A-Za-z_][\w.]*\(.*\)\s*:?$/, // 함수 호출 한 줄
    /^(public|private|static|void|System\.|\}|\{)/, // 자바 예제용
  ]
    .map((r) => `(${r.source})`)
    .join('|')
);

function isCodeBlock(block) {
  const line = unescapeAll(block).trim();
  if (!line) return false;
  // 들여쓴 줄 = 코드 블록 내부 (이 덤프 형식에서 일반 문단은 들여쓰지 않는다)
  if (/^[ \t]{2,}\S/.test(unescapeAll(block).replace(/\n[\s\S]*/, ''))) return true;
  return CODE_LINE_RE.test(line);
}

function transformBody(body) {
  const blocks = body.join('\n').split(/\n{2,}/);
  const out = [];
  let codeRun = [];

  const flushCode = () => {
    if (codeRun.length === 0) return;
    out.push('```python\n' + codeRun.join('\n').replace(/\s+$/, '') + '\n```');
    codeRun = [];
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block.trim()) {
      // 공백 문단: 코드 구간 사이에 끼어 있으면 코드 안의 빈 줄로 유지
      if (codeRun.length > 0 && blocks.slice(i + 1).find((b) => b.trim()) && isCodeBlock(blocks.slice(i + 1).find((b) => b.trim()))) {
        codeRun.push('');
      }
      continue;
    }
    if (isCodeBlock(block)) {
      codeRun.push(unescapeAll(block).replace(/\s+$/, ''));
    } else {
      flushCode();
      out.push(block);
    }
  }
  flushCode();

  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

// 내용 없는 "들어가며" 절 제거
for (const part of parts) {
  for (const chapter of part.chapters) {
    chapter.sections = chapter.sections.filter(
      (s) => !s.isIntro || s.body.join('').trim().length > 0
    );
  }
}

// ── 3단계: 파일 쓰기 ────────────────────────────────────────
const bookDir = path.join(process.cwd(), 'content', 'books', bookId);
const sectionsDir = path.join(bookDir, 'sections');

if (fs.existsSync(bookDir)) {
  console.error(`이미 존재하는 책입니다: ${bookDir}\n덮어쓰려면 폴더를 먼저 삭제하세요.`);
  process.exit(1);
}
fs.mkdirSync(sectionsDir, { recursive: true });

let sectionTotal = 0;
const jsonParts = parts.map((part, pi) => ({
  id: `part-${pi + 1}`,
  title: part.title,
  chapters: part.chapters.map((chapter, ci) => {
    const chNum = chapter.num ?? ci + 1;
    return {
      id: `ch-${chNum}`,
      title: chapter.title,
      sections: chapter.sections.map((section, si) => {
        const id = `${chNum}-${si + 1}`;
        const file = `${id}.md`;
        fs.writeFileSync(path.join(sectionsDir, file), transformBody(section.body) + '\n');
        sectionTotal += 1;
        return { id, title: section.title, file };
      }),
    };
  }),
}));

const book = {
  title: opt('title'),
  ...(opt('subtitle') && { subtitle: opt('subtitle') }),
  description: opt('description', opt('title')),
  author: opt('author', '편집자P'),
  publishedAt: opt('date', new Date().toISOString().slice(0, 10)),
  parts: jsonParts,
};

fs.writeFileSync(path.join(bookDir, 'book.json'), JSON.stringify(book, null, 2) + '\n');

// 변환 과정에서 생략된 요소 보고서 (검수용, 사이트에는 노출되지 않음)
if (droppedOverlays.length > 0 || lostTextboxes > 0) {
  fs.writeFileSync(
    path.join(bookDir, 'import-report.json'),
    JSON.stringify({ lostTextboxes, droppedOverlays }, null, 2) + '\n'
  );
}

// 본문에서 참조하는 이미지를 public/books/<책-id>/로 복사
if (imageCopies.size > 0) {
  const publicDir = path.join(process.cwd(), 'public', 'books', bookId);
  fs.mkdirSync(publicDir, { recursive: true });
  for (const [name, src] of imageCopies) {
    fs.copyFileSync(src, path.join(publicDir, name));
  }
  console.log(`  이미지 ${imageCopies.size}개 → public/books/${bookId}/`);
}

console.log(`완료: ${bookDir}`);
console.log(`  마당 ${parts.length}개 / 장 ${parts.reduce((n, p) => n + p.chapters.length, 0)}개 / 절 ${sectionTotal}개`);
console.log('생성된 book.json의 제목·소개를 확인하고 필요하면 다듬어 주세요.');
