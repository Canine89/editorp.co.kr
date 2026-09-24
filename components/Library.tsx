import Image from "next/image";
import Link from "next/link";
import { flattenSections, sectionLabel, type Book } from "@/lib/books";
import { getAuthoredBooks, getJoinedBooks, getSelectedBooks } from "@/lib/editorial-content";
import { BookProgress } from "./BookProgress";
import { Character } from "./Character";
import { TocMarks } from "./TocMarks";
import styles from "./Library.module.css";

const role = (r: string) => r.replaceAll("/", "·");

/**
 * 서재: 무료로 공개한 책. 표지·소개·진도(이어 읽기)와 장별 목차로 바로 들어간다.
 * 장마다 읽은 절 수는 TocMarks가 브라우저 기록으로 채운다.
 */
export function FreeBooks({ books }: { books: Book[] }) {
  if (books.length === 0) return <p className={styles.empty}>공개한 책을 준비하고 있습니다.</p>;
  return (
    <>
      {books.map((book) => {
        const flat = flattenSections(book);
        const sections = flat.map((f) => ({ id: f.section.id, title: sectionLabel(f) }));
        const chapters = book.parts.flatMap((p) => p.chapters);
        const published = book.publishedAt
          ? new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(new Date(book.publishedAt))
          : null;
        return (
          <article key={book.id} className={`${styles.free} reveal`} data-toc-book={book.id}>
            <div className={styles.feature}>
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
                {book.purchase?.length ? (
                  <p className={styles.buy}>
                    전체는 책으로
                    {book.purchase.map((p) => (
                      <a key={p.url} className="ext" href={p.url} target="_blank" rel="noopener noreferrer">
                        {p.label}
                      </a>
                    ))}
                  </p>
                ) : null}
                <BookProgress bookId={book.id} sections={sections}>
                  <Character id="reader-bookmark" height={84} />
                </BookProgress>
              </div>
            </div>
            <ol className={styles.chapters} aria-label={`${book.title} 장 목차`}>
              {chapters.map((chapter) => (
                <li key={chapter.id}>
                  <Link href={`/books/${book.id}/${chapter.sections[0]?.id}`}>
                    <b>{chapter.title}</b>
                    <small data-chapter-count={chapter.sections.map((s) => s.id).join(",")}>
                      {chapter.sections.length}절
                    </small>
                  </Link>
                </li>
              ))}
            </ol>
            <TocMarks bookId={book.id} sectionIds={sections.map((s) => s.id)} scope={`[data-toc-book="${book.id}"]`} />
          </article>
        );
      })}
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
              <Image className={styles.cover} src={book.image} alt="" width={300} height={420} sizes="(max-width:960px) 45vw, 170px" />
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
            <Image className={styles.cover} src={book.image} alt={book.title} width={180} height={252} sizes="(max-width:520px) 30vw, (max-width:960px) 22vw, 110px" />
            <small>{role(book.role)}</small>
          </a>
        ))}
      </div>
    </>
  );
}
