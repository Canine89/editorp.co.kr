# 무료 도서 콘텐츠 폴더

이 폴더 아래에 책 한 권당 폴더 하나를 만들면 사이트 `/books`에 자동으로 노출됩니다.

```
content/books/
└── <책-id>/              # 소문자·숫자·하이픈만 (URL에 사용됨)
    ├── book.json         # 메타데이터 + 마당 > 장 > 절 목차
    └── sections/         # 절 단위 마크다운 원고
        ├── 1-1.md
        └── ...
```

## book.json 형식

```json
{
  "title": "책 제목",
  "subtitle": "부제 (선택)",
  "description": "책 소개 문단",
  "author": "저자명",
  "publishedAt": "2026-06-10",
  "cover": "/covers/my-book.png",
  "tags": ["태그1", "태그2"],
  "parts": [
    {
      "id": "part-1",
      "title": "첫째 마당. 마당 제목",
      "chapters": [
        {
          "id": "ch-1",
          "title": "1장. 장 제목",
          "sections": [
            { "id": "1-1", "title": "1.1 절 제목", "file": "1-1.md" }
          ]
        }
      ]
    }
  ]
}
```

- `sections[].id`는 **책 안에서 유일**해야 하며 URL 경로(`/books/<책-id>/<절-id>`)가 됩니다.
- `cover`는 `public/` 기준 경로이며 생략하면 자동 생성된 표지가 표시됩니다.
- 본문 마크다운의 제목은 `##`(h2)부터 사용하세요. 절 제목(h1)은 페이지가 자동으로 붙입니다.

## 새 판과 사이트 수정본

책 전체를 새 판으로 교체할 때는 `book.json`과 PDF 변환 설정의 `book.contentRevision`을 함께 바꿉니다.
이 값이 있는 책은 같은 판 정보가 기록된 Firestore 수정본만 적용합니다.
이전 판의 수정본은 삭제하지 않고 보존하며, 판 정보가 없는 기존 수정본도 새 판을 덮지 않습니다.
리더에서 새로 고치면 현재 판 정보가 함께 저장됩니다. 단순 오탈자 수정에는 판 정보를 바꾸지 않습니다.

자세한 안내는 샘플 책(`free-book-guide`) 본문 자체에 들어 있습니다.

## 공개 원고 공지

`components/ManuscriptNotice.tsx`의 공지를 홈 서재·도서 목록·책 목차·모든 본문 첫머리에 공통으로 표시합니다.
정식 전자책 상품이 아닌 저자가 공개한 온라인 원고이며, 판매용 도서보다 편집·교정·레이아웃 완성도가 낮다는 점을 명시합니다.

## 코드 파일명

저장할 파일명이 있는 예제는 코드 펜스의 언어 뒤에 `filename="파일명"`을 적습니다.
파일명은 코드 상단에 표시되며 복사 버튼은 코드 본문만 복사합니다.
파일명이 없는 코드 블록은 언어만 표시합니다. 코드 줄 수는 표시하지 않습니다.
관리자 바로 고치기에서도 첫 줄의 파일명을 수정할 수 있습니다.
코드 다음에 `**실행 결과**`와 텍스트 코드 블록(또는 결과 이미지)을 두면
하나의 박스로 묶고 결과 영역의 배경색을 다르게 표시합니다. 파일명은 상단 오른쪽에 정렬합니다.

````markdown
```python filename="03-01-number_add.py"
# 숫자 더하기
a = 10
b = 5
print(a + b)
```
````

## 파이썬 인쇄용 PDF 재변환

`scripts/pdf-book/books/python-intro.json`에 새 판의 절별 쪽 범위와 글꼴 역할을 기록합니다.
원고의 파일명·번호 정정은 같은 설정의 `filename_overrides`에 원본 이름과 수정 이름으로 기록합니다.
변환기는 코드 상단과 본문의 파일명 참조를 함께 바꾸므로 재변환해도 정정 사항이 유지됩니다.
원본 PDF는 저장소에 올리지 않습니다. PDF를 프로젝트 루트에 두거나
`PDF_BOOK_SOURCE` 환경 변수로 실제 파일 경로를 지정한 뒤 다음 순서로 실행합니다.
파이썬 패키지는 `pymupdf`, `pillow`, `numpy`, `scipy`, 시스템 도구는 Poppler가 필요합니다.

```sh
python scripts/pdf-book/render.py scripts/pdf-book/books/python-intro.json
python scripts/pdf-book/extract.py scripts/pdf-book/books/python-intro.json
python scripts/pdf-book/assemble.py scripts/pdf-book/books/python-intro.json
python scripts/book-image-variants.py python-intro
node scripts/book-image-sizes.mjs python-intro
```

재변환 전 기존 콘텐츠와 운영 본문 오버레이를 확인하세요.
`assemble.py`는 해당 책의 로컬 원고와 이미지 폴더를 새 결과로 교체합니다.
다른 원본으로 다시 변환할 때는 `/tmp/pdf-book/python-intro`의 중간 파일을 먼저 비워야 합니다.

## 이미지 크기와 전송량

본문 이미지는 최대 640px로 표시하고, 누르면 원본으로 확대합니다.
`book-image-variants.py`는 원본을 변경하지 않고 480·640·768px 무손실 WebP를 미리 생성합니다.
원본보다 5% 이상 작은 파일만 `image-variants.json`에 기록합니다.
`book-image-sizes.mjs`가 이를 `images.json`에 합쳐 리더가 화면 배율에 맞는 파일을 고르게 합니다.
작은 화면용 파일을 불러오지 못하면 원본으로 한 번 복구합니다.
작은 파일은 `/responsive/` 아래에 원본 해시를 포함한 이름으로 저장합니다.

사이트 전체의 `next/image`는 `next.config.ts`의 `images.unoptimized: true`로 원본·정적 변형 파일을 직접 제공합니다.
유튜브 썸네일·외부 표지·캐릭터·아티클도 Vercel 실시간 이미지 변환을 사용하지 않습니다.
새 페이지의 이미지 주소에는 `/_next/image`가 생성되지 않아야 합니다. 기존에 생성된 이미지 캐시는 별도로 유지될 수 있습니다.
정적 변형 생성 후 설정을 끄지 않도록 유지하세요. 아티클 표지는 `python scripts/book-image-variants.py --articles`로 생성합니다.

### 기존 변환 요청 차단

2026-10-14 Vercel 프로젝트 `editorp-co-kr`의 Firewall에 `Block unused image optimizer` 규칙을 운영 반영했습니다.
Request Path가 `/_next/image`와 정확히 일치하면 Deny합니다. 이 설정은 저장소가 아닌 Vercel 프로젝트에 저장됩니다.
`unoptimized` 설정만으로는 기존 페이지·봇이 보내는 변환 요청이 중단되지 않아 별도로 차단합니다.
운영 확인: 기존 변환 URL은 `403` 및 `x-vercel-mitigated: deny`, 직접 이미지 파일은 `200`입니다.
오래된 페이지를 열어 둔 방문자는 새로고침해야 직접 이미지 주소가 적용됩니다.
이 규칙을 유지하는 동안 Vercel 실시간 이미지 변환을 다시 사용하는 코드를 배포하지 마세요.
이미 집계된 사용량은 초기화되지 않으며, 팀 내 다른 프로젝트의 변환 사용량은 별개입니다.
