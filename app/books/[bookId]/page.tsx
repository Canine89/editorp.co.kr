import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBook, flattenSections, sectionLabel, bookShareMetadata } from "@/lib/books";
import { BookProgress } from "@/components/BookProgress";
import { TocMarks } from "@/components/TocMarks";
import { PreviewRest } from "@/components/BookPurchase";
import "../reader.css";

// 관리자 패널의 공개/수정이 재배포 없이 반영되도록 동적 렌더링
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = await getBook(bookId);
  if (!book) return {};
  return bookShareMetadata(book, {
    title: `${book.title} | 편집자P의 AI 서재`,
    description: book.description,
    path: `/books/${book.id}`,
  });
}

export default async function BookTocPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  const book = await getBook(bookId);
  if (!book) notFound();

  const flat = flattenSections(book);
  const sections = flat.map((f) => ({ id: f.section.id, title: sectionLabel(f) }));
  const published = book.publishedAt
    ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(book.publishedAt))
    : null;

  return (
    <div className="container rd-intro">
      <div className="rd-intro-side">
        {book.cover && <Image className="rd-cover" src={book.cover} alt={`${book.title} 표지`} width={280} height={382} priority />}
        <h1>{book.title}</h1>
        {book.subtitle && <p className="rd-sub">{book.subtitle}</p>}
        <p className="rd-desc">{book.description}</p>
        <dl className="rd-facts">
          <dt>지은이</dt>
          <dd>{book.author}</dd>
          {published && (
            <>
              <dt>공개</dt>
              <dd>{published}</dd>
            </>
          )}
          <dt>분량</dt>
          <dd data-read-count>{flat.length}절</dd>
        </dl>
        <BookProgress bookId={book.id} sections={sections} />
      </div>

      <section className="rd-contents" aria-label="목차">
        <h2>목차</h2>
        {book.parts.map((part) => (
          <div key={part.id}>
            {part.title && <p className="rd-part">{part.title}</p>}
            {part.chapters.map((chapter) => (
              <div key={chapter.id} className="rd-chapter">
                <h3>
                  {chapter.title}
                  <small data-chapter-count={chapter.sections.map((s) => s.id).join(",")}>{chapter.sections.length}절</small>
                </h3>
                <ol>
                  {chapter.sections.map((s) => (
                    <li key={s.id}>
                      <Link href={`/books/${book.id}/${s.id}`} data-section={s.id}>
                        <span className="rd-ck" aria-hidden="true" />
                        <span>{s.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ))}
        <PreviewRest book={book} />
      </section>
      <TocMarks bookId={book.id} sectionIds={sections.map((s) => s.id)} />
    </div>
  );
}
