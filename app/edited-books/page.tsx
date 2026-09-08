import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getEditedBooksData, countEditedBooks } from "@/lib/edited-books";
import { searchText } from "@/lib/video-presentation";
import { SearchFilters } from "@/components/SearchFilters";
import styles from "./catalog.module.css";
export const metadata = {
  title: "편집한 도서 | 편집자P의 AI 강의·편집실",
  description:
    "편집자P가 집필·기획·편집에 참여한 도서를 역할, 출판사, 제목으로 찾아보세요.",
};
export default async function EditedBooksPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    publisher?: string;
    page?: string;
  }>;
}) {
  const {
    q = "",
    role = "",
    publisher = "",
    page: pageParam = "1",
  } = await searchParams;
  const data = getEditedBooksData();
  const books = data.publishers.flatMap((pub) =>
    pub.books.map((book) => ({
      ...book,
      publisher: pub.name,
      publisherId: pub.id,
    })),
  );
  const found = books.filter(
    (book) =>
      (!q || searchText(book.title).includes(searchText(q))) &&
      (!publisher || book.publisherId === publisher) &&
      (!role ||
        (role === "writing"
          ? book.role.includes("집필")
          : role === "editing"
            ? /기획|편집/.test(book.role)
            : /삽화/.test(book.role))),
  );
  const pageCount = Math.max(1, Math.ceil(found.length / 12));
  const page = Math.min(
    pageCount,
    Math.max(1, Number.parseInt(pageParam, 10) || 1),
  );
  const href = (p: number) =>
    "/edited-books?" +
    new URLSearchParams({ q, role, publisher, page: String(p) }).toString();
  return (
    <div className={`container ${styles.page}`}>
      <header className="page-intro">
        <span>편집자P가 함께 만든 {countEditedBooks(data)}권</span>
        <h1>편집한 도서</h1>
        <p>
          직접 집필한 책부터 기획·편집·삽화로 함께한 책까지.
          <br />각 책에서 맡은 역할과 관심 주제로 찾아보세요.
        </p>
        <Link href="/about#authored-books" className={styles.featuredLink}>
          대표작과 관련 강의 소개 <ArrowRight size={15} />
        </Link>
      </header>
      <SearchFilters
        action="/edited-books"
        query={q}
        placeholder="예: 파이썬, 바이브 코딩…"
        filters={[
          {
            name: "role",
            label: "참여 역할",
            value: role,
            options: [
              { value: "", label: "모든 역할" },
              { value: "writing", label: "집필 참여" },
              { value: "editing", label: "기획·편집 참여" },
              { value: "illustration", label: "삽화 참여" },
            ],
          },
          {
            name: "publisher",
            label: "출판사",
            value: publisher,
            options: [
              { value: "", label: "모든 출판사" },
              ...data.publishers.map((p) => ({ value: p.id, label: p.name })),
            ],
          },
        ]}
      />
      <div
        className={styles.result}
        role="status"
        id="search-results-status"
        tabIndex={-1}
      >
        <p>
          {q && `‘${q}’ `}
          {found.length}권
        </p>
        {(q || role || publisher) && (
          <Link href="/edited-books">필터 초기화</Link>
        )}
      </div>
      <div className={styles.grid} id="book-results">
        {found.slice((page - 1) * 12, page * 12).map((book) => (
          <a
            className={styles.book}
            key={book.url}
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className={styles.cover}>
              <Image
                src={book.image}
                alt={`${book.title} 표지`}
                width={170}
                height={240}
                sizes="(max-width:640px) 120px, 170px"
              />
            </div>
            <div className={styles.meta}>
              <span>{book.role.replaceAll("/", "·")}</span>
              <span>{book.publisher}</span>
            </div>
            <h2>{book.title}</h2>
            {book.note && <p>{book.note}</p>}
            <span className={styles.external}>
              도서 정보 <ArrowUpRight size={14} />
            </span>
          </a>
        ))}
      </div>
      {found.length === 0 && (
        <div className={styles.empty}>
          <h2>조건에 맞는 도서를 찾지 못했습니다.</h2>
          <p>검색어를 줄이거나 다른 역할·출판사를 선택해 보세요.</p>
          <Link href="/edited-books" className="btn btn-secondary">
            전체 도서 보기
          </Link>
        </div>
      )}
      {pageCount > 1 && (
        <nav aria-label="도서 목록 페이지" className={styles.pagination}>
          {page > 1 && (
            <Link href={`${href(page - 1)}#book-results`}>← 이전</Link>
          )}
          <span>
            {page} / {pageCount}
          </span>
          {page < pageCount && (
            <Link href={`${href(page + 1)}#book-results`}>다음 →</Link>
          )}
        </nav>
      )}
      <p className={styles.note}>
        한 도서에 여러 역할로 참여한 경우 각 역할의 검색 결과에 함께 표시됩니다.
      </p>
    </div>
  );
}
