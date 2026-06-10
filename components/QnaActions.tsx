'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AnswerForm({ questionId, initialBody }: { questionId: string; initialBody: string }) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/qna/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || '답변 등록에 실패했습니다.');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <label className="form-label" htmlFor="answer-body" style={{ margin: 0 }}>
        {initialBody ? '답변 수정 (운영자 전용)' : '답변 작성 (운영자 전용)'}
      </label>
      <textarea
        id="answer-body"
        className="input-text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={10000}
        required
        style={{ height: 'auto', minHeight: '160px', resize: 'vertical', lineHeight: 1.6 }}
      />
      {error && <p style={{ fontSize: '13px', color: 'var(--colors-error)', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? '등록 중...' : initialBody ? '답변 수정' : '답변 등록'}
        </button>
      </div>
    </form>
  );
}

export function DeleteQuestionButton({ questionId }: { questionId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm('이 질문을 삭제할까요? 삭제하면 되돌릴 수 없습니다.')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/qna/${questionId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || '삭제에 실패했습니다.');
      }
      router.push('/qna');
      router.refresh();
    } catch (err: any) {
      window.alert(err.message);
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="btn-text"
      style={{ fontSize: '13px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--colors-error)' }}
    >
      {deleting ? '삭제 중...' : '질문 삭제'}
    </button>
  );
}
