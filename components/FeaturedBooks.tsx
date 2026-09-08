import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getSelectedBooks } from "@/lib/editorial-content";
import styles from "./FeaturedBooks.module.css";

export function BookShelf({ priority = false }: { priority?: boolean }) {
  return (
    <div className={styles.shelf}>
      <div className={styles.covers}>
        {getSelectedBooks()
          .slice(0, 2)
          .map((book) => (
            <a
              key={book.id}
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${book.title} 도서 정보 (새 창)`}
            >
              <Image
                src={book.cover}
                alt={`${book.title} 표지`}
                width={180}
                height={250}
                priority={priority}
                sizes="(max-width: 640px) 130px, 180px"
              />
              <span>{book.role.replaceAll("/", "·")}</span>
            </a>
          ))}
      </div>
      <div className={styles.caption}>
        <span>직접 쓰고 기획한 책에서, 다음 배움으로.</span>
        <Link href="/about#authored-books">
          대표 도서와 집필 이야기 <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
export function FeaturedBooks() {
  return (
    <div className={styles.selection}>
      {getSelectedBooks().map((book) => (
        <article key={book.id}>
          <a
            className={styles.coverLink}
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${book.title} 도서 정보 (새 창)`}
          >
            <Image
              src={book.cover}
              alt={`${book.title} 표지`}
              width={100}
              height={145}
              sizes="100px"
            />
          </a>
          <div>
            <span className={styles.role}>
              {book.role.replaceAll("/", "·")} / {book.topic}
            </span>
            <h3>{book.title}</h3>
            <p>{book.note}</p>
            <div className={styles.links}>
              <Link href={book.lectureHref}>
                관련 강의 찾기 <ArrowRight size={14} />
              </Link>
              <a href={book.url} target="_blank" rel="noopener noreferrer">
                도서 정보 <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
