import { listBooks } from "@/lib/books";
import { Character } from "@/components/Character";
import { AuthoredBooks, FreeBooks, JoinedBooks } from "@/components/Library";
import styles from "./books.module.css";

export const metadata = {
  title: "서재 | 편집자P의 AI 서재",
  description: "편집자P가 직접 쓴 책, 브라우저에서 무료로 읽는 책, 기획·편집으로 참여한 책.",
};
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
          <p>제가 쓴 책과, 브라우저에서 바로 읽는 책입니다. 기획·편집으로 참여한 책도 함께 꽂아 두었습니다.</p>
        </div>
        <Character id="library-books" height={96} />
      </header>
      <AuthoredBooks />
      <FreeBooks books={books} />
      <JoinedBooks />
    </div>
  );
}
