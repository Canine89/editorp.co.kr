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
import path from 'path';

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

const raw = fs.readFileSync(inputFile, 'utf-8');

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

for (const line of lines) {
  const m = line.match(headingRe);
  if (m) {
    const level = m[1].length;
    const title = cleanTitle(m[2]);

    if (!title) continue; // 빈 제목 줄 제거

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

  // 일반 본문 줄
  if (currentSection) {
    currentSection.body.push(line);
  } else if (currentChapter) {
    // 장 도입부(절이 나오기 전 본문) → "들어가며" 절로 수집
    currentSection = { title: '들어가며', body: [line], isIntro: true };
    currentChapter.sections.push(currentSection);
  }
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

console.log(`완료: ${bookDir}`);
console.log(`  마당 ${parts.length}개 / 장 ${parts.reduce((n, p) => n + p.chapters.length, 0)}개 / 절 ${sectionTotal}개`);
console.log('생성된 book.json의 제목·소개를 확인하고 필요하면 다듬어 주세요.');
