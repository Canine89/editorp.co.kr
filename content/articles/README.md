# 아티클 콘텐츠 폴더

한 편으로 끝나는 글입니다. 글 하나당 폴더 하나를 만들면 사이트 `/articles`(헤더의 "아티클")에 새 글이 위로 오도록 노출됩니다.

```
content/articles/
└── <글-id>/              # 소문자·숫자·하이픈만 (URL /articles/<글-id>)
    ├── article.json      # 메타데이터
    └── article.md        # 본문
public/articles/<글-id>/  # 표지·본문 그림
```

지금은 강의 준비 도구(`oh-my-slide`)의 발행본을 `npm run publish:editorp -- <덱 이름>`으로 옮겨 옵니다. 그 도구가 이 형식으로 만들어 주므로 손으로 쓸 일은 드뭅니다. 도서와 달리 Firestore 오버레이가 없습니다. 고칠 때는 파일을 고쳐 다시 배포합니다.

## article.json

```json
{
  "title": "글 제목",
  "description": "목록과 공유 미리보기에 쓰는 한두 문장",
  "audience": "이런 분께 (선택)",
  "publishedAt": "2026-10-04",
  "updatedAt": "2026-10-10",
  "cover": { "src": "/articles/<글-id>/cover.png", "alt": "그림 설명", "width": 1334, "height": 870 },
  "images": { "/articles/<글-id>/figure-1.png": { "width": 1200, "height": 800 } },
  "source": "lecture-slides/<덱 이름>"
}
```

- `title`, `description`, `publishedAt`(YYYY-MM-DD)은 꼭 있어야 합니다. 없으면 목록에서 빠집니다.
- `updatedAt`, `cover`, `images`, `audience`는 선택입니다. `source`는 어디서 온 글인지 기록만 합니다.

## article.md

- 제목(h1)은 쓰지 않습니다. 페이지가 `title`로 붙입니다. 소제목은 `##`부터, 오른쪽 "이 글에서"에 모입니다.
- 본문은 서재 리더와 같은 렌더러(`lib/reader-render.ts`)로 그립니다. 코드 구문 강조, 그림 확대, 코너 박스가 그대로 됩니다.
- 섹션을 한 줄로 정리할 때는 `> **정리**` 코너(서재의 "바로 핵심 요약"과 같은 모양)를 씁니다.
- `출처`로 시작하는 문단과 바로 아래 목록은 작은 회색 글자로 보입니다.
- 이 사이트의 marked는 한국어 조사 앞의 `**굵게**`를 닫지 못하므로(`**계산**으로`), 굵은 글씨는 `<strong>…</strong>`으로 씁니다.
