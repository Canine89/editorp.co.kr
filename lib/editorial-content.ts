import { getEditedBooksData } from "./edited-books";
import profile from "@/data/profile.json";

const selections = [
  {
    id: "183530330",
    query: "바로바로 바이브",
    note: "커서 설치부터 작은 프로그램 제작과 배포까지",
    topic: "웹·앱 만들기",
  },
  {
    id: "191479539",
    query: "바로바로 챗GPT",
    note: "챗GPT의 기본 원리부터 이미지와 에이전트 활용까지",
    topic: "AI 활용",
  },
  {
    id: "190210781",
    query: "MCP 커넥터",
    note: "업무 도구를 AI와 연결하는 실무 활용 사례",
    topic: "업무 자동화",
  },
];
export function getSelectedBooks() {
  const books = getEditedBooksData().publishers.flatMap((p) => p.books);
  return selections.flatMap((selection) => {
    const book = books.find((book) => book.url.endsWith("/" + selection.id));
    return book
      ? [
          {
            ...book,
            ...selection,
            cover: `/selected-books/${selection.id}.jpg`,
            lectureHref: `/videos?q=${encodeURIComponent(selection.query)}`,
          },
        ]
      : [];
  });
}
export function getLectureHighlights() {
  return [
    { label: "기업 실무", org: "풀리오", contains: "AX 교육" },
    { label: "교사 연수", org: "시화유치원", contains: "가정 통신문" },
    {
      label: "공공기관",
      org: "경기도의회",
      contains: "하네스 엔지니어링 강의",
    },
  ].flatMap((item) => {
    const lecture = profile.lectures.find(
      (lecture) =>
        lecture.org.includes(item.org) && lecture.title.includes(item.contains),
    );
    return lecture ? [{ ...lecture, label: item.label }] : [];
  });
}
