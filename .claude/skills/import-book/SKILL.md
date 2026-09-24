---
name: import-book
description: 구글 독스/워드(.docx) 원고와 이미지를 무료 도서(content/books)로 변환해 사이트에 올린다. 사용 시점 - 사용자가 책 원고(.docx, 구글 독스 URL)나 이미지 zip을 주며 "책 올려줘/임포트해줘/변환해줘"라고 할 때, 기존 책의 원고·이미지를 갱신할 때.
---

# 도서 원고 임포트

구글 독스에서 받은 원고를 마당-장-절 구조의 무료 도서로 변환해 `/books`에 올리는 절차.
변환기는 `scripts/import-book.mjs`이며 `npm run import:book`으로도 실행할 수 있다.

## 입력물

| 입력 | 필수 | 비고 |
| ---- | ---- | ---- |
| 원고 .docx | ✅ | 구글 독스 → 파일 > 다운로드 > Microsoft Word. (MCP 내보내기는 10MB 제한이 있어 이미지 있는 원고는 반드시 로컬 .docx로 받을 것) |
| 이미지 zip/폴더 | 선택 | 저자가 따로 준비한 이미지. **내용 해시로 자동 매칭**되므로 파일명·순서는 자유 |
| 책 메타데이터 | ✅ | id(소문자-하이픈), 제목. 부제/소개/저자/공개일은 선택 — 없으면 사용자에게 묻기 |

마크다운(.md) 원고도 받지만 이미지가 없는 경우에만 권장 (구글 독스 → 다운로드 > Markdown).

## 절차

1. **이미지 준비**: zip이면 임시 폴더에 unzip.
2. **기존 책 갱신이면** 먼저 삭제(사용자에게 확인): `rm -rf content/books/<id> public/books/<id>`
3. **변환 실행**:
   ```bash
   node scripts/import-book.mjs "원고.docx" \
     --id <책-id> --title "제목" --subtitle "부제" \
     --description "소개" --author "저자" --date YYYY-MM-DD \
     --images <이미지폴더>
   ```
4. **출력 경고 확인** (그대로 사용자에게 보고):
   - `이미지 해시 매칭: N개 일치` — 일치율이 낮으면 저자 이미지가 편집본일 수 있음 → 순서 대응으로 넘어가므로 순서 검수 필요
   - `그리기 그룹 N곳 오버레이 생략` — 화살표·라벨 오버레이는 합성 불가. 상세는 `content/books/<id>/import-report.json`
   - `텍스트 상자 N개` — 이미지에 겹친 캡션 텍스트는 소실됨
5. **검증** (dev 서버 필요, 포트 3000):
   - 모든 절: book.json의 절 id 순회하며 `curl -s -o /dev/null -w "%{http_code}" localhost:3000/books/<id>/<절id>` 전부 200
   - 모든 이미지: `public/books/<id>/*` 각각 200
   - 코드 블록: 코드 많은 절 HTML에서 `language-python` 존재 확인
   - 목차: book.json의 장/절 제목에 이미지 참조나 깨진 제목이 없는지
6. **눈 검수 요청**: 코드 오분류(산문이 코드로/코드가 산문으로), 이미지 위치, [실행 결과] 출력부는 평문임을 안내.
7. **공유 미리보기 이미지**: 표지가 있는 책이면 `python scripts/make-og-images.py`로 `public/og/<id>.jpg`(1200×630)를
   만든다. 없으면 카카오톡·페이스북 공유 썸네일이 비거나 사이트 기본 이미지로 나온다.
   이미 공유된 주소는 카카오 공유 디버거(developers.kakao.com/tool/debugger/sharing)에서 캐시를 지워야 새 썸네일이 보인다.
8. **빌드 확인 후 커밋**: dev 서버 끄고 `npm run build` 통과 확인. 커밋 메시지는 한글, 푸시 전 `git pull --rebase origin main` (AGENTS.md 규칙).

## 변환기가 자동 처리하는 것 (다시 구현하지 말 것)

- `NN장`/`마당` 제목 인식, 장 도입부 → "들어가며" 절 분리
- REPL(`>>>`)·할당문·제어문·들여쓴 줄 → 파이썬 코드 펜스 병합
- docx의 mc:AlternateContent(그리기 개체) 이미지 마커 치환 (pandoc 누락 보완, 중첩 균형 파싱)
- 그리기 그룹은 최대 크기 파일(본체)만 사용, 나머지는 import-report.json에 기록
- 제목 스타일 입혀진 이미지 문단 → 일반 문단 강등
- 이미지 해시 매칭 교체 + `public/books/<id>/` 복사

## 인쇄용 PDF에서 가져오기 (일부 공개 + 구매 안내)

InDesign으로 만든 인쇄용 PDF(재단선 포함)는 docx 변환기 대신 `scripts/pdf-book/`을 쓴다.
글은 PDF의 글꼴 정보로 추출하고, 그림은 쪽을 216dpi로 렌더링해 잘라낸다(스크린샷 위 말풍선·화살표 보존).

1. **설정 파일**: `scripts/pdf-book/books/<책-id>.json`을 기존 파일을 본떠 만든다.
   - `pdf`, `cover`: 저장소 루트의 원본 파일명(루트의 `*.pdf`, `cover(*`는 .gitignore로 커밋되지 않음)
   - `pages`: 변환할 쪽 범위. 공개 비율은 쪽 수로 계산해 절이 끝나는 경계에서 자른다
   - `chapters`: 쪽 범위로 정한 절(`sections`) 또는 쪽 범위 + 목차 제목(`headings`, 본문 h2·'바로 NN'과 순서대로 맞춤)
   - `book`: 제목·부제·소개·저자·공개일·표지 + `purchase`(구매처 버튼) + `preview`(공개 범위 설명, 책에서 이어지는 목차)
2. **실행** (poppler, pillow, numpy 필요):
   ```bash
   python scripts/pdf-book/extract.py scripts/pdf-book/books/<id>.json   # 쪽 역할·그림 검출 (/tmp/pdf-book/<id>)
   python scripts/pdf-book/assemble.py scripts/pdf-book/books/<id>.json  # 원고·그림·표지 생성
   node scripts/book-image-sizes.mjs <id>
   ```
3. **검수**: `/tmp/pdf-book/<id>/debug/pNNN.png`(빨간 상자 = 그림)로 그림 검출을 확인한다.
   장식(제목 띠·마스코트)이 그림으로 잡히거나 표가 쪼개지면 `extract.py`의 그림 필터를 고친다.
   글꼴 역할표(`role_of`)는 골든래빗 '바로바로' 시리즈 판면 기준이다.
4. 위 "검증" 절차(모든 절·이미지 200, 빌드)를 그대로 따른다.

코너(NOTE·프롬프트·1:1 코칭·바로 핵심 요약·미리 알아두세요)는 인용문 첫 줄 라벨로 적히고,
리더가 라벨을 보고 코너 스타일을 붙인다. AI 답변은 원서에서도 화면 이미지라 그림으로 들어간다.
마지막 공개 절 끝과 책 소개 목차 아래에 `purchase`·`preview`로 구매 안내가 자동으로 나온다.

## 관리자 패널과의 관계

- `/admin/books`에서 공개 여부 토글과 절 본문 리치 텍스트 수정이 가능하다.
- 관리자 수정은 Firestore `bookOverrides/` 오버레이에 저장되어 **파일 원본을 가린다**.
- 따라서 **재임포트 후에는** 관리자 패널에서 해당 절의 "원본으로 되돌리기"를 눌러
  옛 오버레이를 비워야 새 원고가 보인다. 재임포트 시 사용자에게 이를 안내할 것.

## 한계 (사용자에게 미리 안내)

- 이미지 위 오버레이(화살표·번호 라벨)와 겹친 텍스트 상자는 옮겨지지 않음 → 중요한 그림은 저자가 합성본 이미지로 교체
- 표 안의 복잡한 서식, 글자색·하이라이트는 보존되지 않음
- 마당 없는 원고는 단일 마당으로 들어가며 화면에는 마당 표기가 숨겨짐 (정상)
