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

자세한 안내는 샘플 책(`free-book-guide`) 본문 자체에 들어 있습니다.

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
원본 PDF는 저장소에 올리지 않습니다. PDF를 프로젝트 루트에 두거나
`PDF_BOOK_SOURCE` 환경 변수로 실제 파일 경로를 지정한 뒤 다음 순서로 실행합니다.
파이썬 패키지는 `pymupdf`, `pillow`, `numpy`, `scipy`, 시스템 도구는 Poppler가 필요합니다.

```sh
python scripts/pdf-book/render.py scripts/pdf-book/books/python-intro.json
python scripts/pdf-book/extract.py scripts/pdf-book/books/python-intro.json
python scripts/pdf-book/assemble.py scripts/pdf-book/books/python-intro.json
node scripts/book-image-sizes.mjs python-intro
```

재변환 전 기존 콘텐츠와 운영 본문 오버레이를 확인하세요.
`assemble.py`는 해당 책의 로컬 원고와 이미지 폴더를 새 결과로 교체합니다.
다른 원본으로 다시 변환할 때는 `/tmp/pdf-book/python-intro`의 중간 파일을 먼저 비워야 합니다.
