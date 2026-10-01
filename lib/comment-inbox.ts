import { listBooks, flattenSections, sectionLabel } from './books';
import { bookCommentCount, listSectionComments, SECTION_KEY, type BookComment } from './book-comments';
import { isAdminEmail } from './admin';
import { renderReaderSection } from './reader-render';

/**
 * 관리자 댓글 수신함(/admin/comments): 모든 책의 문단·절 댓글을 최신순으로 모은다.
 * 전체를 가로지르는 색인 없이 책 → 절 순서로 읽는다(댓글 없는 책은 책 문서의 count로 건너뛴다).
 * 어느 문단인지 보이도록 댓글이 있는 절만 리더 렌더러로 그려 문단 첫머리를 붙인다.
 */
export interface InboxComment extends BookComment {
  bookId: string;
  bookTitle: string;
  sectionId: string;
  sectionTitle: string;
  /** 문단 첫머리. 절 댓글이면 null, 원문이 바뀌어 문단을 못 찾으면 빈 문자열 */
  excerpt: string | null;
  byEditor: boolean;
}

export async function listInboxComments(limit = 300): Promise<InboxComment[]> {
  const books = await listBooks(true);
  const perBook = await Promise.all(
    books.map(async (book) => {
      if ((await bookCommentCount(book.id)) === 0) return [];
      const sections = await Promise.all(
        flattenSections(book).map(async (flat) => {
          const comments = await listSectionComments(book.id, flat.section.id);
          if (!comments.length) return [];
          const excerpts = comments.some((c) => c.pk !== SECTION_KEY)
            ? ((await renderReaderSection(book.id, flat.section))?.excerpts ?? {})
            : {};
          return comments.map(
            (c): InboxComment => ({
              ...c,
              bookId: book.id,
              bookTitle: book.title,
              sectionId: flat.section.id,
              sectionTitle: sectionLabel(flat),
              excerpt: c.pk === SECTION_KEY ? null : (excerpts[c.pk] ?? ''),
              byEditor: isAdminEmail(c.authorEmail),
            }),
          );
        }),
      );
      return sections.flat();
    }),
  );
  return perBook
    .flat()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}
