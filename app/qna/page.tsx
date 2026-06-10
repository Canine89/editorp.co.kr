import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { listQuestions, type Question } from '@/lib/qna';

export const revalidate = 0;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(iso));
}

export default async function QnaListPage() {
  let questions: Question[] = [];
  let boardReady = isFirebaseConfigured();
  if (boardReady) {
    try {
      questions = await listQuestions();
    } catch (error) {
      console.error('Q&A list read failed:', error);
      boardReady = false;
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100%', paddingBottom: '80px' }}>
      <section style={{ padding: '48px 0 0 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h1 className="serif-display" style={{ fontSize: '28px', margin: 0 }}>
              질문 게시판
            </h1>
            <Link href="/qna/new" className="btn btn-primary">
              질문하기
            </Link>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--colors-muted)', margin: '0 0 28px 0' }}>
            강의를 보다가 막히는 부분을 남겨 주세요. 운영자가 직접 답변해 드립니다.
          </p>

          {!boardReady ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed var(--colors-hairline)', borderRadius: 'var(--rounded-lg)' }}>
              <p style={{ color: 'var(--colors-muted)', margin: 0 }}>
                게시판을 준비하고 있어요. 조금만 기다려 주세요!
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px dashed var(--colors-hairline)', borderRadius: 'var(--rounded-lg)' }}>
              <MessageSquare size={28} color="var(--colors-muted-soft)" style={{ marginBottom: '12px' }} />
              <p style={{ color: 'var(--colors-muted)', margin: 0 }}>
                아직 등록된 질문이 없습니다. 첫 질문을 남겨 보세요!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {questions.map((q) => (
                <Link
                  key={q.id}
                  href={`/qna/${q.id}`}
                  className="qna-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    backgroundColor: 'var(--colors-surface-card)',
                    border: '1px solid var(--colors-hairline)',
                    borderRadius: 'var(--rounded-lg)',
                    transition: 'background-color var(--transition-fast)',
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      flexShrink: 0,
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: q.status === 'answered'
                        ? 'color-mix(in srgb, var(--colors-success) 14%, transparent)'
                        : 'var(--colors-surface-soft)',
                      color: q.status === 'answered' ? 'var(--colors-success)' : 'var(--colors-muted)',
                      border: '1px solid',
                      borderColor: q.status === 'answered'
                        ? 'color-mix(in srgb, var(--colors-success) 30%, transparent)'
                        : 'var(--colors-hairline)',
                    }}
                  >
                    {q.status === 'answered' ? '답변 완료' : '답변 대기'}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: '15px',
                      fontWeight: 500,
                      color: 'var(--colors-ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {q.title}
                  </span>
                  <span style={{ flexShrink: 0, fontSize: '12px', color: 'var(--colors-muted-soft)' }}>
                    {q.authorName} · {formatDate(q.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .qna-card:hover {
          background-color: var(--colors-surface-cream-strong);
        }
      `}</style>
    </div>
  );
}
