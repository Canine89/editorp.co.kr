import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { listBooks, countSections } from "@/lib/books";
import styles from "./books.module.css";
export const metadata = {
  title: "무료 도서 | 편집자P의 AI 강의·편집실",
  description:
    "파이썬 기초부터 무료로 읽으며 배우세요. 편집자P의 공개 도서와 학습 자료입니다.",
};
export const revalidate = 0;
export default async function BooksPage() {
  const books = await listBooks();
  const guides = books.filter((book) => book.id === "free-book-guide");
  const learning = books.filter((book) => book.id !== "free-book-guide");
  return (
    <div className={`container ${styles.page}`}>
      <header className="page-intro">
        <span>책으로 채우는 기본기</span>
        <h1>무료 도서</h1>
        <p>
          영상에서 만난 개념을 글과 예제로 다시 익혀보세요.
          <br />
          목차를 따라 읽고, 필요한 절부터 시작할 수도 있습니다.
        </p>
      </header>
      <div className={styles.books}>
        {learning.map((book) => (
          <article key={book.id} className={styles.book}>
            <div className={styles.cover}>
              {book.cover ? (
                <Image
                  src={book.cover}
                  alt={`${book.title} 표지`}
                  width={200}
                  height={280}
                  sizes="(max-width:640px) 130px, 200px"
                />
              ) : (
                <BookOpen size={50} />
              )}
            </div>
            <div>
              <span className={styles.meta}>
                무료 공개 / {countSections(book)}개 절
              </span>
              <h2>{book.title}</h2>
              {book.subtitle && (
                <p className={styles.subtitle}>{book.subtitle}</p>
              )}
              <p>{book.description}</p>
              <span className={styles.author}>{book.author}</span>
              <Link href={`/books/${book.id}`} className="btn btn-primary">
                목차 보고 읽기 <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {learning.length === 0 && (
        <div className={styles.empty}>
          <h2>새로운 공개 도서를 준비하고 있습니다.</h2>
          <Link href="/#roadmap-list">
            영상 로드맵으로 공부하기 <ArrowRight size={15} />
          </Link>
        </div>
      )}
      {guides.length > 0 && (
        <aside className={styles.guide}>
          <h2>직접 책을 공개하고 싶은 분께</h2>
          <p>도서를 만드는 분을 위한 사이트 사용 예제입니다.</p>
          {guides.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`}>
              {book.title} <ArrowRight size={15} />
            </Link>
          ))}
        </aside>
      )}
      <Link className={styles.other} href="/edited-books">
        편집자P가 참여한 다른 도서 보기 <ArrowRight size={16} />
      </Link>
    </div>
  );
}
