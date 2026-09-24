import { createHash } from "crypto";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBook, flattenSections, sectionLabel, bookShareMetadata, type Book } from "@/lib/books";
import { renderReaderSection } from "@/lib/reader-render";
import { Character } from "@/components/Character";
import { ReaderClient } from "@/components/ReaderClient";
import { TocMarks } from "@/components/TocMarks";
import { PreviewEnd } from "@/components/BookPurchase";
import { ParagraphComments } from "@/components/ParagraphComments";
import { InlineBookEditor } from "@/components/InlineBookEditor";
import "../../reader.css";

// 관리자 패널의 공개/수정이 재배포 없이 반영되도록 동적 렌더링
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ bookId: string; sectionId: string }> }) {
  const { bookId, sectionId } = await params;
  const book = await getBook(bookId);
  const flat = book ? flattenSections(book).find((f) => f.section.id === sectionId) : null;
  if (!book || !flat) return {};
  return bookShareMetadata(book, {
    title: `${flat.section.title} — ${book.title} | 편집자P의 AI 서재`,
    description: book.description,
    path: `/books/${book.id}/${flat.section.id}`,
  });
}

function BookToc({ book, currentId }: { book: Book; currentId: string }) {
  return book.parts.map((part) => (
    <div key={part.id}>
      {part.title && <p className="rd-part">{part.title}</p>}
      {part.chapters.map((chapter) => (
        <details key={chapter.id} open={chapter.sections.some((s) => s.id === currentId)}>
          <summary>
            {chapter.title}
            <small data-chapter-count={chapter.sections.map((s) => s.id).join(",")}>{chapter.sections.length}절</small>
          </summary>
          <ol>
            {chapter.sections.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/books/${book.id}/${s.id}`}
                  data-section={s.id}
                  aria-current={s.id === currentId ? "page" : undefined}
                >
                  <span className="rd-ck" aria-hidden="true" />
                  <span>{s.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </details>
      ))}
    </div>
  ));
}

export default async function BookSectionPage({ params }: { params: Promise<{ bookId: string; sectionId: string }> }) {
  const { bookId, sectionId } = await params;
  const book = await getBook(bookId);
  if (!book) notFound();

  const flat = flattenSections(book);
  const index = flat.findIndex((f) => f.section.id === sectionId);
  if (index === -1) notFound();

  const current = flat[index];
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index < flat.length - 1 ? flat[index + 1] : null;
  const rendered = await renderReaderSection(book.id, current.section);
  if (!rendered) notFound();

  const sectionIds = flat.map((f) => f.section.id);
  // 본문이 바뀌면(관리자 바로 고치기 후 새로고침) 본문에 버튼을 다는 컴포넌트를 다시 붙인다
  const version = `${current.section.id}-${createHash("sha1").update(rendered.html).digest("hex").slice(0, 8)}`;
  const prevHref = prev ? `/books/${book.id}/${prev.section.id}` : null;
  const nextHref = next ? `/books/${book.id}/${next.section.id}` : null;

  return (
    <>
      <div className="rd-progress" aria-hidden="true">
        <i />
      </div>
      <div className="container rd-reader">
        <nav className="rd-toc" aria-label="책 목차">
          <Link className="rd-toc-book" href={`/books/${book.id}`}>
            {book.cover ? <Image src={book.cover} alt="" width={40} height={55} /> : <span />}
            <span>
              <b>{book.title}</b>
              <small data-read-count>{flat.length}절</small>
            </span>
          </Link>
          <BookToc book={book} currentId={current.section.id} />
        </nav>

        <article className="rd-main">
          <div className="rd-mbar">
            <span>{book.title}</span>
            <button type="button" data-open="rd-sheet-toc">
              목차
            </button>
            <button type="button" data-open="rd-sheet-set">
              글자 크기
            </button>
          </div>
          <p className="rd-crumb">
            <Link href={`/books/${book.id}`}>{book.title}</Link>
            {current.part.title && ` · ${current.part.title}`} · {current.chapter.title}
          </p>
          <h1>{current.section.title}</h1>
          <p className="rd-meta">
            <span>{book.author}</span>
            <span>
              {index + 1} / {flat.length}절
            </span>
            <span>읽는 시간 약 {rendered.readMinutes}분</span>
            {rendered.codeCount > 0 && <span>코드 {rendered.codeCount}개</span>}
          </p>

          <div className="rd-prose" dangerouslySetInnerHTML={{ __html: rendered.html }} />
          <InlineBookEditor key={`edit-${version}`} bookId={book.id} sectionId={current.section.id} />
          <ParagraphComments
            key={version}
            bookId={book.id}
            sectionId={current.section.id}
            paragraphKeys={rendered.paragraphKeys}
          />

          <footer className="rd-end">
            {!next && <PreviewEnd book={book} />}
            <p className="rd-done">
              <i aria-hidden="true">✓</i>
              <b>끝까지 읽으면 완료로 표시됩니다</b>
              <Character id="reader-done" height={72} />
            </p>
            <nav className="rd-pager" aria-label="절 이동">
              {prev ? (
                <Link href={prevHref!}>
                  <small>← 이전 절</small>
                  <b>{sectionLabel(prev)}</b>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={nextHref!}>
                  <small>다음 절 →</small>
                  <b>{sectionLabel(next)}</b>
                </Link>
              ) : (
                <Link href={`/books/${book.id}`}>
                  <small>마지막 절입니다</small>
                  <b>목차로 돌아가기</b>
                </Link>
              )}
            </nav>
            <p className="rd-ask">
              이 절에서 막힌 곳이 있나요? <Link href="/qna/new">질문 게시판에 질문하기</Link> ·{" "}
              <span className="rd-kbd">←</span> <span className="rd-kbd">→</span> 키로 이동
            </p>
          </footer>
        </article>

        <aside className="rd-aside" aria-label="이 절의 소제목과 읽기 설정">
          {rendered.headings.length > 0 && (
            <>
              <h2>이 절에서</h2>
              <ol>
                {rendered.headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </>
          )}
          <div className="rd-settings">
            <span className="rd-seg-label">글자 크기</span>
            <div className="rd-seg" role="group" aria-label="글자 크기">
              <button type="button" data-set-size="s" aria-pressed="false" className="rd-size-s">
                가
              </button>
              <button type="button" data-set-size="m" aria-pressed="true">
                가
              </button>
              <button type="button" data-set-size="l" aria-pressed="false" className="rd-size-l">
                가
              </button>
            </div>
          </div>
        </aside>
      </div>

      <dialog className="rd-sheet" id="rd-sheet-toc" aria-label="책 목차">
        <div className="rd-sheet-head">
          <b>{book.title}</b>
          <button type="button" data-close>
            닫기
          </button>
        </div>
        <nav className="rd-sheet-body rd-toc" aria-label="책 목차">
          <BookToc book={book} currentId={current.section.id} />
        </nav>
      </dialog>
      <dialog className="rd-sheet" id="rd-sheet-set" aria-label="글자 크기">
        <div className="rd-sheet-head">
          <b>글자 크기</b>
          <button type="button" data-close>
            닫기
          </button>
        </div>
        <div className="rd-sheet-body">
          <div className="rd-seg" role="group" aria-label="글자 크기">
            <button type="button" data-set-size="s" aria-pressed="false">
              작게
            </button>
            <button type="button" data-set-size="m" aria-pressed="true">
              보통
            </button>
            <button type="button" data-set-size="l" aria-pressed="false">
              크게
            </button>
          </div>
        </div>
      </dialog>
      {/* 확대 이미지는 누를 때 ReaderClient가 넣는다 */}
      <dialog className="rd-zoom" aria-label="이미지 확대" />

      <ReaderClient bookId={book.id} sectionId={current.section.id} sectionIds={sectionIds} prevHref={prevHref} nextHref={nextHref} />
      <TocMarks bookId={book.id} sectionIds={sectionIds} />
    </>
  );
}
