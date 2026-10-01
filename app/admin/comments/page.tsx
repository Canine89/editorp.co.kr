import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { isAdminEmail } from '@/lib/admin';
import { listInboxComments } from '@/lib/comment-inbox';
import { SECTION_KEY } from '@/lib/book-comments';
import { NewSince } from './NewSince';
import styles from './comments.module.css';

export const revalidate = 0;
export const metadata = { title: '독자 댓글 | 관리자', robots: { index: false } };

const when = (iso: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

/** 관리자 댓글 수신함: 서재의 문단·절 댓글을 최신순으로. 답글은 링크로 리더에 가서 단다 */
export default async function AdminCommentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    redirect('/auth/unauthorized');
  }

  const comments = await listInboxComments();
  const readers = comments.filter((c) => !c.byEditor);

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <h1>독자 댓글</h1>
        <p>
          서재에 남긴 댓글을 최신순으로 모았습니다. 답글은 각 댓글의 &lsquo;리더에서 보기&rsquo;로 가서 남기면 편집자P로 표시됩니다.
          <NewSince latest={readers[0]?.createdAt ?? null} />
        </p>
        <nav className={styles.nav} aria-label="관리 메뉴">
          <Link href="/admin/books">도서 관리</Link>
          <Link href="/admin">로드맵 관리</Link>
        </nav>
      </header>

      {comments.length === 0 ? (
        <p className={styles.empty}>아직 남은 댓글이 없습니다.</p>
      ) : (
        <ol className={styles.list}>
          {comments.map((c) => (
            <li key={c.id} data-created={c.byEditor ? undefined : c.createdAt}>
              <p className={styles.where}>
                <b>{c.bookTitle}</b> · {c.sectionTitle}
                <Link href={`/books/${c.bookId}/${c.sectionId}#c-${c.pk === SECTION_KEY ? SECTION_KEY : c.pk}`}>리더에서 보기</Link>
              </p>
              {c.excerpt === null ? (
                <p className={styles.quote}>절 전체에 남긴 댓글</p>
              ) : (
                <blockquote className={styles.quote}>{c.excerpt || '원문이 바뀌어 문단을 찾지 못했습니다'}</blockquote>
              )}
              <p className={styles.body}>{c.body}</p>
              <p className={styles.who}>
                <b>{c.authorName}</b>
                {c.byEditor ? <em>편집자P</em> : <span>{c.authorEmail}</span>}
                <time dateTime={c.createdAt}>{when(c.createdAt)}</time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
