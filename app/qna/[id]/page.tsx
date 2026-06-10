import Link from 'next/link';
import { notFound } from 'next/navigation';
import { List, Eye } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { ADMIN_EMAIL, getPost, listComments, incrementViews } from '@/lib/qna';
import { CommentForm, DeleteCommentButton, DeletePostButton } from '@/components/QnaActions';

export const revalidate = 0;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso)
  );
}

export default async function QnaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isFirebaseConfigured()) {
    notFound();
  }

  const { id } = await params;
  const [post, comments, session] = await Promise.all([
    getPost(id),
    listComments(id),
    getServerSession(authOptions),
  ]);

  if (!post) {
    notFound();
  }

  await incrementViews(id);

  const userEmail = session?.user?.email ?? null;
  const isAdmin = userEmail === ADMIN_EMAIL;

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100%', paddingBottom: '80px' }}>
      <section style={{ padding: '40px 0 0 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          {/* 글 머리 */}
          <div style={{ borderTop: '2px solid var(--colors-ink)', borderBottom: '1px solid var(--colors-hairline)', padding: '18px 4px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 10px 0', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--colors-muted)', fontWeight: 500 }}>[{post.category}]</span>{' '}
              {post.title}
            </h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: 'var(--colors-muted)' }}>
                <strong style={{ color: 'var(--colors-body-strong)', fontWeight: 600 }}>{post.authorName}</strong>
                {' · '}
                {formatDate(post.createdAt)}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted-soft)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={13} /> {post.views + 1}
              </span>
            </div>
          </div>

          {/* 본문 */}
          <div style={{ padding: '28px 4px', borderBottom: '1px solid var(--colors-hairline)' }}>
            <p style={{ fontSize: '15px', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
              {post.body}
            </p>
            {(isAdmin || userEmail === post.authorEmail) && (
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <DeletePostButton postId={post.id} />
              </div>
            )}
          </div>

          {/* 댓글 */}
          <div style={{ padding: '24px 4px 0 4px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0' }}>
              댓글 <span style={{ color: 'var(--colors-primary)' }}>{comments.length}</span>
            </h2>

            {comments.length > 0 && (
              <ul style={{ listStyle: 'none', margin: '0 0 20px 0', padding: 0 }}>
                {comments.map((comment) => (
                  <li
                    key={comment.id}
                    style={{ padding: '14px 2px', borderBottom: '1px solid var(--colors-hairline-soft)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--colors-body-strong)' }}>
                        {comment.authorName}
                      </span>
                      {comment.isAdmin && (
                        <span className="badge badge-coral" style={{ fontSize: '10px', padding: '2px 8px' }}>
                          운영자
                        </span>
                      )}
                      <span style={{ fontSize: '12px', color: 'var(--colors-muted-soft)' }}>
                        {formatDate(comment.createdAt)}
                      </span>
                      {(isAdmin || userEmail === comment.authorEmail) && (
                        <DeleteCommentButton postId={post.id} commentId={comment.id} />
                      )}
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
                      {comment.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <CommentForm postId={post.id} isLoggedIn={Boolean(userEmail)} />
          </div>

          <div style={{ marginTop: '28px' }}>
            <Link href="/qna" className="btn btn-secondary" style={{ gap: '6px' }}>
              <List size={15} /> 목록
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
