'use client';
import { useEffect, useState } from 'react';

const SEEN_KEY = 'admin-comments-seen';

/**
 * 지난번에 수신함을 연 뒤 새로 들어온 독자 댓글을 표시한다(이 브라우저 기준).
 * 서버가 그린 목록 항목의 data-created를 보고 새 항목에 .new를 붙인 뒤, 지금 본 시각을 기록한다.
 */
export function NewSince({ latest }: { latest: string | null }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let seen = '';
    try {
      seen = localStorage.getItem(SEEN_KEY) ?? '';
    } catch {}
    let n = 0;
    if (seen) {
      document.querySelectorAll<HTMLElement>('li[data-created]').forEach((li) => {
        if (li.dataset.created! > seen) {
          li.classList.add('new');
          n++;
        }
      });
    }
    // 외부 저장소(브라우저 기록)를 읽은 결과를 한 번만 반영한다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(n);
    if (latest) {
      try {
        localStorage.setItem(SEEN_KEY, latest);
      } catch {}
    }
  }, [latest]);

  return count > 0 ? <> 지난번 이후 새 댓글이 {count}개 있습니다.</> : null;
}
