import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { ADMIN_EMAIL, getQuestion } from '@/lib/qna';
import { AnswerForm, DeleteQuestionButton } from '@/components/QnaActions';

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
  const [question, session] = await Promise.all([
    getQuestion(id),
    getServerSession(authOptions),
  ]);

  if (!question) {
    notFound();
  }

  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const isAuthor = session?.user?.email === question.authorEmail;

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100%', paddingBottom: '80px' }}>
      <section style={{ padding: '48px 0 0 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <Link
            href="/qna"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--colors-muted)', marginBottom: '20px' }}
          >
            <ArrowLeft size={14} /> 목록으로
          </Link>

          {/* 질문 */}
          <div style={{ borderBottom: '1px solid var(--colors-hairline)', paddingBottom: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span
                className="badge"
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: question.status === 'answered'
                    ? 'color-mix(in srgb, var(--colors-success) 14%, transparent)'
                    : 'var(--colors-surface-soft)',
                  color: question.status === 'answered' ? 'var(--colors-success)' : 'var(--colors-muted)',
                  border: '1px solid',
                  borderColor: question.status === 'answered'
                    ? 'color-mix(in srgb, var(--colors-success) 30%, transparent)'
                    : 'var(--colors-hairline)',
                }}
              >
                {question.status === 'answered' ? '답변 완료' : '답변 대기'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted-soft)' }}>
                {question.authorName} · {formatDate(question.createdAt)}
              </span>
            </div>
            <h1 className="serif-display" style={{ fontSize: '24px', margin: '0 0 16px 0' }}>
              {question.title}
            </h1>
            <p style={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {question.body}
            </p>
            {(isAdmin || isAuthor) && (
              <div style={{ marginTop: '16px' }}>
                <DeleteQuestionButton questionId={question.id} />
              </div>
            )}
          </div>

          {/* 답변 */}
          {question.answer ? (
            <div
              style={{
                backgroundColor: 'var(--colors-surface-card)',
                border: '1px solid var(--colors-hairline)',
                borderRadius: 'var(--rounded-lg)',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span className="badge badge-coral" style={{ fontSize: '11px' }}>
                  운영자 답변
                </span>
                <span style={{ fontSize: '12px', color: 'var(--colors-muted-soft)' }}>
                  {formatDate(question.answer.createdAt)}
                </span>
              </div>
              <p style={{ fontSize: '15px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                {question.answer.body}
              </p>
            </div>
          ) : (
            !isAdmin && (
              <p style={{ fontSize: '13px', color: 'var(--colors-muted)', margin: 0 }}>
                아직 답변이 등록되지 않았습니다. 운영자가 확인하는 대로 답변을 남겨 드릴게요.
              </p>
            )
          )}

          {/* 운영자 답변 작성/수정 */}
          {isAdmin && (
            <div style={{ marginTop: '24px' }}>
              <AnswerForm questionId={question.id} initialBody={question.answer?.body ?? ''} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
