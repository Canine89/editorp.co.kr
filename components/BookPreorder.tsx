import { ArrowUpRight, BookOpen } from 'lucide-react';
import type { Book } from '@/lib/books';
import styles from './BookPreorder.module.css';

export function BookPreorderNotice({ book, compact = false }: { book: Book; compact?: boolean }) {
  if (book.purchaseStatus !== 'preorder' || !book.purchase?.length) return null;
  return (
    <section className={`${styles.notice} ${compact ? styles.compact : ''}`} aria-label={`${book.title} 예약 판매 안내`}>
      <span className={styles.badge}><BookOpen size={14} aria-hidden="true" /> 예약 판매 시작</span>
      <h3>{compact ? '종이책으로도 만나보세요' : `《${book.title}》 예약 판매를 시작했습니다`}</h3>
      <p>기다려주셔서 감사합니다. :)</p>
      <nav className={styles.links} aria-label={`${book.title} 예약 구매 서점`}>
        {book.purchase.map((store) => (
          <a key={store.url} href={store.url} target="_blank" rel="noopener noreferrer" aria-label={`${store.label}에서 예약 구매 (새 창)`}>
            {store.label}<ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ))}
      </nav>
    </section>
  );
}

/** 좁은 읽기 화면에서는 작은 하단 버튼으로 서점 선택창을 연다. */
export function BookPreorderMobile({ book }: { book: Book }) {
  if (book.purchaseStatus !== 'preorder' || !book.purchase?.length) return null;
  return (
    <>
      <div className="rd-preorder-mobile" aria-label="도서 예약 판매 안내">
        <div><b>예약 판매 시작</b><span>《{book.title}》</span></div>
        <button type="button" data-open="rd-sheet-preorder" aria-haspopup="dialog">서점에서 보기 <ArrowUpRight size={16} aria-hidden="true" /></button>
      </div>
      <dialog className="rd-sheet" id="rd-sheet-preorder" aria-label="도서 예약 구매">
        <div className="rd-sheet-head"><b>도서 예약 구매</b><button type="button" data-close>닫기</button></div>
        <div className="rd-sheet-body"><BookPreorderNotice book={book} /></div>
      </dialog>
    </>
  );
}
