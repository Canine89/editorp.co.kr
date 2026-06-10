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
