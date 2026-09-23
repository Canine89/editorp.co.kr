import Image from "next/image";
import Link from "next/link";
import { flattenSections, sectionLabel, type Book } from "@/lib/books";
import { getAuthoredBooks, getJoinedBooks } from "@/lib/editorial-content";
import { BookProgress } from "./BookProgress";
import { Character } from "./Character";
import styles from "./Library.module.css";

const role = (r: string) => r.replaceAll("/", "·");

/** 직접 쓴 책: 서재에서 가장 크게 */
export function AuthoredBooks() {
  const books = getAuthoredBooks();
  return (
    <>
      <h3 className={styles.subHead}>직접 쓴 책 {books.length}권</h3>
      <ul className={`${styles.authored} reveal`}>
        {books.map((book) => (
          <li key={book.url}>
            <a href={book.url} target="_blank" rel="noopener noreferrer">
              <Image className={styles.cover} src={book.image} alt="" width={300} height={420} sizes="(max-width:960px) 45vw, 220px" />
              <b>{book.title}</b>
              <span>
                {role(book.role)} · {book.publisher}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

/** 무료로 읽는 책. 진도가 있으면 이어 읽기 */
export function FreeBooks({ books }: { books: Book[] }) {
  if (books.length === 0) return null;
  return (
    <>
      <h3 className={styles.subHead}>무료로 읽기</h3>
      {books.map((book) => {
        const sections = flattenSections(book).map((f) => ({ id: f.section.id, title: sectionLabel(f) }));
        const published = book.publishedAt
          ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date(book.publishedAt))
          : null;
        return (
          <div key={book.id} className={`${styles.feature} reveal`}>
            <Link href={`/books/${book.id}`} aria-label={`${book.title} 목차`}>
              {book.cover ? (
                <Image className={styles.cover} src={book.cover} alt={`${book.title} 표지`} width={200} height={273} />
              ) : (
                <span className={styles.noCover}>{book.title}</span>
              )}
            </Link>
            <div>
              <h3>{book.title}</h3>
              {book.subtitle && <p className={styles.sub}>{book.subtitle}</p>}
              <p className={styles.meta}>
                {book.author} · {sections.length}절{published && ` · ${published} 공개`}
              </p>
              <p className={styles.desc}>{book.description}</p>
              <BookProgress bookId={book.id} sections={sections}>
                <Character id="reader-bookmark" height={84} />
              </BookProgress>
            </div>
          </div>
        );
      })}
    </>
  );
}

/** 기획·편집 등으로 참여한 책 (직접 쓴 책 제외) */
export function JoinedBooks({ limit }: { limit?: number }) {
  const books = getJoinedBooks();
  const shown = limit ? books.slice(0, limit) : books;
  return (
    <>
      <h3 className={styles.subHead}>
        기획·편집으로 참여한 책 {books.length}권
        <Link className={styles.more} href="/edited-books">
          찾아보기
        </Link>
      </h3>
      <div className={`${styles.shelf} reveal`}>
        {shown.map((book) => (
          <a key={book.url} href={book.url} target="_blank" rel="noopener noreferrer" title={book.title}>
            <Image className={styles.cover} src={book.image} alt={book.title} width={180} height={252} sizes="(max-width:520px) 30vw, (max-width:960px) 22vw, 130px" />
            <small>{role(book.role)}</small>
          </a>
        ))}
      </div>
    </>
  );
}
