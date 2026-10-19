import Image from "next/image";
import Link from "next/link";
import { flattenSections, sectionLabel, type Book } from "@/lib/books";
import { getAuthoredBooks, getJoinedBooks, getSelectedBooks } from "@/lib/editorial-content";
import { BookProgress } from "./BookProgress";
import { ManuscriptNotice } from "./ManuscriptNotice";
import { BookPreorderNotice } from "./BookPreorder";
import styles from "./Library.module.css";

const role = (r: string) => r.replaceAll("/", "·");

/**
 * 서재: 표지와 소개 중심의 두 열 카드. 자세한 목차는 책 안에서 확인한다.
 */
export function FreeBooks({ books }: { books: Book[] }) {
  if (books.length === 0) return <p className={styles.empty}>공개한 책을 준비하고 있습니다.</p>;
  return (
    <>
      <ManuscriptNotice variant="prominent" />
      <div className={styles.freeGrid}>
      {books.map((book) => {
        const flat = flattenSections(book);
        const sections = flat.map((f) => ({ id: f.section.id, title: sectionLabel(f) }));
        const published = book.publishedAt
          ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date(book.publishedAt))
          : null;
        return (
          <article key={book.id} className={`${styles.free} reveal`}>
            <div className={styles.feature}>
              <Link href={`/books/${book.id}`} aria-label={`${book.title} 목차`}>
                {book.cover ? (
                  <Image className={styles.cover} src={book.cover} alt={`${book.title} 표지`} width={200} height={273} unoptimized />
                ) : (
                  <span className={styles.noCover}>{book.title}</span>
                )}
              </Link>
              <div>
                <h3>{book.title}</h3>
                {book.subtitle && <p className={styles.sub}>{book.subtitle}</p>}
                <p className={styles.meta}>
                  {book.author}{published && ` · ${published} 공개`}
                </p>
                <p className={styles.desc}>{book.description}</p>
                {book.purchase?.length && book.purchaseStatus !== 'preorder' ? (
                  <p className={styles.buy}>
                    전체는 책으로
                    {book.purchase.map((p) => (
                      <a key={p.url} className="ext" href={p.url} target="_blank" rel="noopener noreferrer">
                        {p.label}
                      </a>
                    ))}
                  </p>
                ) : null}
                <BookProgress bookId={book.id} sections={sections} compact />
              </div>
            </div>
            <BookPreorderNotice book={book} />
          </article>
        );
      })}
      </div>
    </>
  );
}

/** 소개: 직접 쓴 책. 영상 강의가 있는 책은 관련 강의로 잇는다 */
export function AuthoredBooks() {
  const books = getAuthoredBooks();
  const lectures = new Map(getSelectedBooks().map((b) => [b.url, b.lectureHref]));
  return (
    <>
      <h3 className={styles.subHead}>직접 쓴 책 {books.length}권</h3>
      <ul className={`${styles.authored} reveal`}>
        {books.map((book) => (
          <li key={book.url}>
            <a href={book.url} target="_blank" rel="noopener noreferrer">
              <Image className={styles.cover} src={book.image} alt="" width={300} height={420} sizes="(max-width:960px) 45vw, 170px" referrerPolicy="no-referrer" />
              <b>{book.title}</b>
            </a>
            <span>
              {role(book.role)} · {book.publisher}
            </span>
            {lectures.get(book.url) && (
              <Link className={styles.lecture} href={lectures.get(book.url)!}>
                관련 강의
              </Link>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

/** 소개: 기획·편집 등으로 참여한 책 (직접 쓴 책 제외) */
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
            <Image className={styles.cover} src={book.image} alt={book.title} width={180} height={252} sizes="(max-width:520px) 30vw, (max-width:960px) 22vw, 110px" referrerPolicy="no-referrer" />
            <small>{role(book.role)}</small>
          </a>
        ))}
      </div>
    </>
  );
}
