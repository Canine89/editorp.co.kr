'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export function CommentForm({ postId, isLoggedIn }: { postId: string; isLoggedIn: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoggedIn) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          padding: '16px',
          backgroundColor: 'var(--colors-surface-soft)',
          border: '1px solid var(--colors-hairline)',
          borderRadius: 'var(--rounded-md)',
        }}
      >
        <span style={{ fontSize: '13px', color: 'var(--colors-muted)' }}>
          댓글을 쓰려면 로그인해 주세요.
        </span>
        <button onClick={() => signIn('google')} className="btn btn-secondary" style={{ height: '34px', padding: '0 14px', fontSize: '13px' }}>
          구글 계정으로 로그인
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/qna/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || '댓글 등록에 실패했습니다.');
      }
      setBody('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea
        className="input-text"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="댓글을 입력해 주세요"
        maxLength={2000}
        required
        style={{ height: 'auto', minHeight: '80px', resize: 'vertical', lineHeight: 1.6, fontSize: '14px' }}
      />
      {error && <p style={{ fontSize: '13px', color: 'var(--colors-error)', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '36px', padding: '0 16px', fontSize: '13px' }}>
          {submitting ? '등록 중...' : '댓글 등록'}
        </button>
      </div>
    </form>
  );
}

export function DeleteCommentButton({ postId, commentId }: { postId: string; commentId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm('댓글을 삭제할까요?')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/qna/${postId}/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || '삭제에 실패했습니다.');
      }
      router.refresh();
    } catch (err: any) {
      window.alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={remove}
      disabled={deleting}
      className="btn-text"
      style={{ fontSize: '12px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--colors-muted-soft)' }}
    >
      {deleting ? '삭제 중' : '삭제'}
    </button>
  );
}

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    if (!window.confirm('이 글을 삭제할까요? 댓글도 함께 삭제되며 되돌릴 수 없습니다.')) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/qna/${postId}`, { method: 'DELETE' });
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
      {deleting ? '삭제 중...' : '글 삭제'}
    </button>
  );
}
