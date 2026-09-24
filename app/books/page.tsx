import { pageShareMetadata } from "@/lib/share";
import { listBooks } from "@/lib/books";
import { Character } from "@/components/Character";
import { FreeBooks } from "@/components/Library";
import styles from "./books.module.css";

export const metadata = pageShareMetadata({
  title: "서재 | 편집자P의 AI 서재",
  description: "편집자P가 무료로 공개한 책을 브라우저에서 바로 읽을 수 있습니다.",
  path: "/books",
});
// 관리자 패널의 공개 설정이 재배포 없이 반영되도록 동적 렌더링
export const revalidate = 0;

export default async function BooksPage() {
  // 집필 가이드는 사이트 사용 예제라 공개 서가에서 뺀다 (주소로는 계속 열린다)
  const books = (await listBooks()).filter((book) => book.id !== "free-book-guide");
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <div>
          <h1>서재</h1>
          <p>무료로 공개한 책입니다. 목차에서 원하는 장부터 읽을 수 있고, 읽은 곳은 이 브라우저에 기억됩니다.</p>
        </div>
        <Character id="library-books" height={96} />
      </header>
      <FreeBooks books={books} />
    </div>
  );
}
