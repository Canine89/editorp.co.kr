---
name: import-pdf-book
description: 저장소 루트에 둔 인쇄용 PDF와 표지로 서재에 '앞부분 무료 공개 + 구매 안내' 도서를 올린다. "PDF랑 표지 넣었다, 서재에 올려줘", "앞부분 35% 공개" 같은 요청에 쓴다. 글은 PDF에서 추출하고 그림만 쪽 이미지에서 잘라 코너만 구분한다.
---

# 인쇄용 PDF → 서재 일부 공개 도서

골든래빗 '바로바로' 시리즈 같은 InDesign 인쇄용 PDF를 `/books/<id>`의 무료 도서로 만든다.
원칙(사용자 지시): **글은 텍스트로 추출하고, 그림만 캡처해서 올리고, 코너(NOTE·프롬프트 등)만 구분한다.**
앞부분 약 35%만 공개하고, 마지막 공개 절 끝과 책 소개 페이지에 YES24·교보문고 구매 안내를 붙인다.

예시 설정: `scripts/pdf-book/books/barobaro-chatgpt-codex.json`(쪽 범위 절 + 목차 제목),
`scripts/pdf-book/books/barobaro-vibe-cursor.json`(roles 재정의 + 장 묶음 part).

## 0. 입력물 확인

- 루트의 원본: `*.pdf`(내지), `cover*.jpg`(앞표지). **원본은 커밋하지 않는다** — `.gitignore`의
  `/*.pdf`, `/cover(*`, `/cover_*`가 막는다. 새 표지 파일명이 이 패턴에 안 맞으면 패턴을 더한다
  (`git check-ignore -v <파일>`로 확인).
- 필요 도구: poppler(`pdftohtml`, `pdftoppm`, `pdfinfo`), `pip install pillow numpy`.
- 책 id: 소문자-하이픈(`SAFE_ID`), 예 `barobaro-vibe-cursor`.
- '검판용' 같은 교정본이면 사용자에게 최종본 여부를 보고할 때 언급한다.

## 1. 목차 읽고 공개 범위 정하기

```bash
pdfinfo 원본.pdf | grep Pages
pdftotext -f 1 -l 12 -layout 원본.pdf - | less     # 목차 쪽
```

- 전체 쪽 수 × 0.35 근처에서 **장(또는 절)이 끝나는 경계**로 자른다. 정확히 35%가 아니어도
  경계를 우선하고, 실제 비율(예: 1~139쪽, 약 33%)을 `preview.note`·`badge`에 적는다.
- 빼는 쪽: 장 표지(도입 그림 쪽), 장 끝 총정리 퀴즈, 광고·빈 쪽. 앞부분의 학습 가이드·설치 안내는
  '들어가며' 장의 절로 넣을 수 있다.
- 쪽 번호는 **PDF 쪽 번호**(인쇄 쪽 번호와 다를 수 있음) — `pdftoppm -f N -l N -r 40`으로 몇 쪽 확인.

## 2. 설정 파일 `scripts/pdf-book/books/<id>.json`

```jsonc
{
  "id": "barobaro-xxx",
  "pdf": "루트의 PDF 파일명.pdf",
  "cover": "루트의 표지 파일명.jpg",
  "pages": [4, 138],                       // 변환할 PDF 쪽 범위 (첫 쪽~마지막 공개 쪽)
  "roles": [ /* 3단계에서 채움, 없으면 [] */ ],
  "chapters": [
    // (가) 쪽 범위로 절을 직접 정함 — 앞부분 안내처럼 h2 제목이 일정치 않은 곳
    { "title": "들어가며", "sections": [ { "pages": [4, 5], "title": "학습 가이드와 실습 자료" } ] },
    // (나) 쪽 범위 + 목차 제목 — 본문 h2(또는 '바로 NN 제목')와 순서대로 맞춰 절을 자른다
    { "part": "01장 바이브 코딩 시작하기",    // 선택: 장 묶음(책의 'NN장'), book.json parts가 된다
      "title": "01.1 바이브 코딩을 하기 전에 꼭 알아두면 좋은 지식", "pages": [28, 33],
      "headings": ["IDE가 뭔가요?", "에이전트가 뭔가요?", "바로 01"] }   // '바로 NN'은 번호만 써도 맞는다
  ],
  "book": {
    "title": "…", "subtitle": "…", "description": "…", "author": "박현규",
    "publishedAt": "YYYY-MM-DD", "cover": "/covers/<id>.jpg",
    "purchase": [
      { "label": "YES24", "url": "https://www.yes24.com/product/goods/<번호>" },
      { "label": "교보문고", "url": "https://product.kyobobook.co.kr/detail/<S번호>" }
    ],
    "preview": {
      "note": "책 앞부분(1~4장, 1~139쪽, 전체 416쪽의 약 33%)을 무료로 공개합니다. …",
      "badge": "앞부분 약 33% 무료 공개",      // 서재 카드·공유 썸네일에 쓰인다
      "rest": [ { "title": "05장 …", "items": ["05.1 …", "05.2 …"] } ]   // 책에서 이어지는 목차
    }
  }
}
```

**구매 링크 찾기**
- YES24: 검색 결과(`https://www.yes24.com/Product/Search?query=<제목>`) HTML의 `goods/<번호>`.
- 교보문고: 상품 페이지가 JS로 그려져 본문을 못 읽는다. 검색 결과 HTML
  (`https://search.kyobobook.co.kr/search?keyword=<제목>`)의 `data-pid="S…"`와 `data-name`으로 확인한다.
- 링크는 WebFetch/curl로 200과 제목이 맞는지 확인한다.

## 3. 글꼴 조사와 역할표(roles)

```bash
python3 scripts/pdf-book/fonts.py scripts/pdf-book/books/<id>.json --min 5
```

글꼴·크기·색 조합별로 조각 수, 쪽, 예시 글, (extract 후라면) 지금 매겨진 역할을 보여준다.
`extract.py`의 `role_of()` 기본표는 바로바로 시리즈 판면 기준이다. 책마다 다른 조합은 설정의
`roles`에 규칙을 더한다(위에서부터 먼저 맞는 규칙이 이긴다):

```json
{ "font": "NotoSansKR", "size": 14, "color": "#231f20", "role": "box_text" }
{ "font": "UniversNextPro*", "size": 27, "color": "accent", "text": "\\d{2}", "role": "step" }
```

- `font`: 정확히 같거나, `*`로 끝나면 접두사. `size`·`color`는 생략하면 아무거나.
  `color`: `"accent"`(채도 높은 강조색) 또는 hex. `text`: 조각 글 전체가 맞아야 하는 정규식.
- 주요 역할: `body`(본문) `label`(본문 속 굵은 말·글머리 용어) `annot`(영문 병기 → `(Agent)`)
  `kbd`/`code`(인라인 코드) `h2`/`h3`/`h4` `step`(실습 단계 번호) `note_label`/`small`(NOTE)
  `box_label`/`box_text`(프롬프트·AI 답변 상자) `quiz_label`/`quiz_answer`(잠깐 퀴즈)
  `coach_tag`/`coach_title`(1:1 코칭) `side_title`/`side_text`(미리 알아두세요·기억하고 있나요 곁단)
  `summary_label`/`summary`(바로 핵심 요약) `decor`(버림) `fig`(그림 속 글자 → 그림에 남김).
- 본문 크기(≥14)의 원문자(❶)는 기본으로 본문에 남는다.

## 4. 실행

```bash
python3 scripts/pdf-book/extract.py  scripts/pdf-book/books/<id>.json   # /tmp/pdf-book/<id>: 역할·그림 검출
python3 scripts/pdf-book/assemble.py scripts/pdf-book/books/<id>.json   # content/books/<id>, public/books/<id>, public/covers/<id>.jpg
node scripts/book-image-sizes.mjs <id>                                  # content/books/<id>/images.json
python3 scripts/make-og-images.py                                       # public/og/<id>.jpg (공유 썸네일)
```

`extract.py`는 첫 실행 때 PDF를 XML·216dpi PNG로 풀어 `/tmp/pdf-book/<id>/`에 캐시한다
(쪽 범위를 늘렸으면 그 폴더를 지우고 다시 돌린다). assemble이 목차 제목을 못 맞추면 멈추며
어떤 제목인지 알려준다 → `headings`를 본문 표기에 맞게 고친다.

## 5. 검수 (반복)

1. **그림 검출**: `/tmp/pdf-book/<id>/debug/pNNN.png`(빨간 상자 = 그림, 색 상자 = 역할별 글).
   장식(제목 띠·마스코트·알약)이 그림으로 잡히거나, 표가 쪼개지거나, 본문 줄이 그림 상자에 먹히면
   `extract.py`의 `figures()` 필터를 고친다.
2. **끊긴 문단 찾기**:
   ```bash
   python3 - <<'EOF'
   import glob,re
   for f in sorted(glob.glob('content/books/<id>/sections/*.md')):
       for p in open(f).read().split('\n\n'):
           p=p.strip(); last=p.split('\n')[-1]
           if not p or p.startswith(('!','```','>','#','|')): continue
           if not re.search(r'[.?!:)\]”’」`>*]$|[다요]$', last) or len(p) < 25:
               print(f.split('/')[-1], '|', p[-80:])
   EOF
   ```
   목록·짧은 문장 외의 결과가 나오면 해당 쪽의 `pages/pNNN.json`을 찍어 원인(역할, 줄 묶기,
   그림 상자 겹침)을 찾는다. 곁단 질문과 정답, 코너 라벨도 눈으로 훑는다.
3. **다른 책 회귀 확인**: 파이프라인을 고쳤으면 기존 PDF 도서도 다시 돌려 차이를 본다.
   ```bash
   cp -r content/books/<기존-id> /tmp/before
   python3 scripts/pdf-book/extract.py scripts/pdf-book/books/<기존-id>.json && python3 scripts/pdf-book/assemble.py scripts/pdf-book/books/<기존-id>.json
   diff -r /tmp/before/sections content/books/<기존-id>/sections; git status --short public/books/<기존-id>
   ```
   의도한 개선만 남아야 한다.

## 6. 사이트 확인

- 코너는 인용문 첫 줄의 굵은 라벨로 적힌다: **NOTE**, **프롬프트**, **AI 답변**, **잠깐 퀴즈**,
  **1:1 코칭 · 제목**, **바로 핵심 요약**, **미리 알아두세요!**/**기억하고 있나요?**
  → `lib/reader-render.ts`의 `CORNERS`와 `app/books/reader.css`의 `blockquote.corner-*`.
  새 코너 종류가 생기면 두 곳에 더한다.
- dev 서버(`npm run dev`)에서 전부 200인지:
  ```bash
  for s in $(python3 -c "import json;b=json.load(open('content/books/<id>/book.json'));print(' '.join(s['id'] for p in b['parts'] for c in p['chapters'] for s in c['sections']))"); do
    curl -s -o /dev/null -w "%{http_code} $s\n" localhost:3000/books/<id>/$s; done | grep -v '^200' ; echo 절-끝
  for f in public/books/<id>/*; do curl -s -o /dev/null -w "%{http_code} $f\n" "localhost:3000/${f#public/}"; done | grep -v '^200'; echo 그림-끝
  ```
- 화면 확인: `/books`(서재 카드·배지·구매처), `/books/<id>`(소개 + '책에서 이어지는 내용'),
  마지막 공개 절 끝의 구매 안내(`PreviewEnd`), 모바일 폭.
- `npm run build` 통과.

## 7. 커밋

- `git status`로 **루트 원본 PDF·표지가 빠졌는지** 확인한다.
- 커밋 대상: `scripts/pdf-book/books/<id>.json`, `content/books/<id>/`, `public/books/<id>/`,
  `public/covers/<id>.jpg`, `public/og/<id>.jpg`, 고친 파이프라인·리더 파일.
- 커밋 메시지는 한글, 푸시는 사용자 확인 후 `git pull --rebase origin main` → `git push origin main`.
- 운영에 이미 올라간 책을 재생성했다면: 관리자 패널에서 절을 고친 적이 있으면 Firestore 오버레이가
  새 원고를 가린다 → `/admin/books`의 "원본으로 되돌리기"를 안내한다.

## 한계 (사용자에게 보고)

- 표, 그림이 들어간 프롬프트 상자, 말풍선·화살표가 붙은 화면은 그림(WebP)으로 들어간다.
- 장 끝 총정리 퀴즈는 넣지 않는다(책에서 풀도록 안내).
- 글꼴 역할이 판면마다 달라 새 시리즈는 3단계 역할표 작업이 대부분이다.
