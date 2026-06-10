'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

const CATEGORIES = ['질문', '정보', '잡담'] as const;

export default function QnaNewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [category, setCategory] = useState<string>('질문');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || '글 등록에 실패했습니다.');
      }
      router.push(`/qna/${json.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100%', paddingBottom: '80px' }}>
      <section style={{ padding: '48px 0 0 0' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 className="serif-display" style={{ fontSize: '28px', margin: '0 0 28px 0' }}>
            글쓰기
          </h1>

          {status === 'loading' ? (
            <p style={{ color: 'var(--colors-muted)' }}>불러오는 중...</p>
          ) : !session ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', border: '1px solid var(--colors-hairline)', borderRadius: 'var(--rounded-lg)', backgroundColor: 'var(--colors-surface-card)' }}>
              <p style={{ color: 'var(--colors-body)', margin: '0 0 20px 0' }}>
                글을 쓰려면 구글 계정으로 로그인해 주세요.
              </p>
              <button onClick={() => signIn('google')} className="btn btn-primary">
                구글 계정으로 로그인
              </button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0, width: '120px', flexShrink: 0 }}>
                  <label className="form-label" htmlFor="qna-category">말머리</label>
                  <select
                    id="qna-category"
                    className="input-text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label className="form-label" htmlFor="qna-title">제목</label>
                  <input
                    id="qna-title"
                    className="input-text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력해 주세요"
                    maxLength={120}
                    required
                  />
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="qna-body">내용</label>
                <textarea
                  id="qna-body"
                  className="input-text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="질문이라면 어떤 강의의 어느 부분에서 막혔는지 적어 주시면 더 정확한 답변을 받을 수 있어요."
                  maxLength={10000}
                  required
                  style={{ height: 'auto', minHeight: '260px', resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {error && (
                <p style={{ fontSize: '13px', color: 'var(--colors-error)', margin: 0 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Link href="/qna" className="btn btn-secondary">
                  취소
                </Link>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '등록 중...' : '등록'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
