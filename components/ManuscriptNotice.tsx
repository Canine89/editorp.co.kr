import styles from './ManuscriptNotice.module.css';

export function ManuscriptNotice({ variant = 'default' }: { variant?: 'default' | 'prominent' | 'reader' }) {
  return (
    <aside className={`${styles.notice} ${styles[variant] || ''}`} aria-label="공개 원고 안내">
      <p className={styles.title}>정식 전자책 상품이 아닌, 저자 공개 원고입니다.</p>
      <p>
        이곳의 책은 저자가 원고를 공개해 제공하는 온라인 문서입니다.
        판매용 도서보다 편집·교정·레이아웃의 완성도가 낮으며, 내용과 구성이 수정될 수 있습니다.
      </p>
    </aside>
  );
}
