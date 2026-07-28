# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어

항상 한글로만 답한다 (`AGENTS.md`).

## 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드 — 커밋 전 통과 확인
npm run start        # 빌드 결과 실행
npm run lint         # eslint (eslint-config-next)
npm run import:book  # scripts/import-book.mjs — .docx 원고 → content/books/ 변환
```

테스트 러너는 없다. 검증은 `npm run build` + dev 서버에서 라우트 200 확인으로 한다
(도서 임포트 검증 절차는 `.claude/skills/import-book/SKILL.md` 참고).

## 환경 변수

| 변수 | 용도 |
| --- | --- |
| `FIREBASE_PROJECT_ID` / `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` | Firestore 접속. **셋 다 있어야** Firestore 모드로 동작 (`isFirebaseConfigured()`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | 구글 로그인 |
| `AUTH_SECRET` | NextAuth 서명 키. 운영에서 없으면 기동 실패 (개발 모드에만 폴백 존재) |
| `ADMIN_EMAIL` | 관리자 계정. 미설정 시 `lib/admin.ts`의 기본값 |

로컬에서 Firebase 변수 없이 띄우면 파일 폴백 모드로 동작하고, `/api/auth/signin`에서
개발 전용 Credentials 프로바이더(관리자 이메일 + 비밀번호 `admin`)로 로그인할 수 있다.

## 아키텍처

Next.js 16 App Router + React 19, TypeScript. 스타일은 `app/globals.css`의 CSS 변수
디자인 토큰 + 컴포넌트 인라인 스타일(CSS Modules는 `app/page.module.css` 하나뿐).

### 이중 저장소 패턴 (이 저장소의 핵심 개념)

모든 콘텐츠 레이어가 **Firestore(운영) / 로컬 파일(개발 폴백)** 두 모드로 동작한다.
새 콘텐츠 기능을 만들 때도 이 패턴을 따를 것.

- **로드맵** (`lib/roadmap-data.ts`): Firestore `roadmaps/{id}` 문서 + `settings/roadmap`(카테고리).
  읽기 실패·미설정·빈 컬렉션이면 `data/roadmap.json`으로 폴백. 저장은 batch로 삭제분까지 반영.
  `validateRoadmapData()`가 저장 전 스키마 게이트 — 저장 경로는 반드시 이걸 통과시킨다.
- **무료 도서** (`lib/books.ts`): 원본은 `content/books/<id>/book.json`(마당>장>절) +
  `sections/*.md` 파일. 그 **위에** Firestore `bookOverrides/{bookId}`(공개 여부)와
  `bookOverrides/{bookId}/sections/{sectionId}`(절 마크다운) 오버레이가 덮인다.
  → 원고를 재임포트해도 옛 오버레이가 남아 있으면 새 원고가 보이지 않는다. 관리자 패널의
  "원본으로 되돌리기"로 오버레이를 비워야 한다.
- **Q&A 게시판** (`lib/qna.ts`): Firestore 전용(폴백 없음). `questions/{id}` + 하위 `comments/`.
  전문 검색이 없어 최신 500개(`MAX_SCAN`)를 서버 메모리에서 필터링·페이징한다.
  `userActivity/{email}` 문서로 도배 방지(글 60초/일 20개, 댓글 10초) — 트랜잭션 안에서
  검사하며 관리자는 면제. 한도 초과는 `RateLimitError` → API에서 429.
- **편집 도서 목록** (`lib/edited-books.ts`): `data/edited-books.json` 정적 읽기만.

Firestore는 서버(서버 컴포넌트 / 라우트 핸들러)에서만 접근한다. 클라이언트에 Firebase SDK를
싣지 않으며 권한은 NextAuth 세션으로 검사한다 (`lib/firebase-admin.ts`).

### 인증 · 권한

관리자 판별은 `lib/admin.ts`의 `ADMIN_EMAIL` / `isAdminEmail()` **단일 출처**만 쓴다.
이메일을 다른 곳에 하드코딩하지 말 것. 이 파일은 edge 런타임(middleware)에서도 import되므로
Node 전용 모듈을 넣지 말 것.

방어는 2겹이다:
1. `middleware.ts` — `/admin/*`, `/api/admin/*`에 대해 관리자 이메일 검사 + 상태 변경
   메서드(POST/PUT/PATCH/DELETE)의 same-origin 강제(CSRF 완화).
2. 각 `app/api/admin/**/route.ts`의 `requireAdmin()` — `getServerSession`으로 재검사.

새 관리자 API를 추가할 때 두 겹 모두 유지한다. 세션에는 `session.user.isAdmin` 플래그가
실려 있어 클라이언트에서 이메일 비교 없이 UI를 분기할 수 있다 (`types/next-auth.d.ts`).

### 사용자 입력 HTML

Tiptap 리치 텍스트로 들어온 HTML은 저장·렌더 전에 `lib/sanitize.ts`를 반드시 거친다.
정책이 두 가지다 — 게시글용 `sanitizePostHtml()`(좁은 허용), 도서 본문용
`sanitizeBookHtml()`(이미지·표·`style="width:%"`까지 허용). 관리자 도서 편집은
`lib/html-to-md.ts`(turndown)로 HTML→마크다운 역변환해 저장한다.

### 경로 안전

`content/books` 아래를 읽을 때 book id는 `SAFE_ID`(`^[a-z0-9][a-z0-9-]*$`)로,
절 파일 경로는 `path.resolve` 후 `sections/` 접두 확인으로 경로 탈출을 막는다.
로드맵 id는 Firestore 문서 ID로 그대로 쓰이므로 `SAFE_DOC_ID` 검증을 거친다.

### 배포 주의

도서 페이지는 런타임에 파일을 읽는 동적 렌더링이라, 새 도서 관련 라우트를 만들면
`next.config.ts`의 `outputFileTracingIncludes`에 해당 라우트를 추가해야 서버리스 번들에
`content/books/**`가 포함된다.

## 디자인

`DESIGN.md`가 사이트 디자인 시스템(warm-editorial: 크림 캔버스 + 코랄 액센트 + 다크 네이비)의
단일 출처다. 색·타이포·간격·반경은 전부 `app/globals.css`의 CSS 변수 토큰을 쓰고 hex를
인라인하지 않는다. 다크 모드는 `html[data-theme='dark']`로 전환된다 (`components/ThemeToggle.tsx`).

## Git 운영 규칙 (AGENTS.md)

1. `git status --short --branch`로 상태 확인
2. 필요한 변경 커밋 (커밋 메시지는 한글)
3. `git pull --rebase origin main`
4. 충돌 없으면 `git push origin main`

원격에 새 커밋이 있어도 merge commit을 만들지 말고 rebase로 올린다.
