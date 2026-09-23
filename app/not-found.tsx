import Link from "next/link";
import { Character } from "@/components/Character";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={`container ${styles.page}`}>
      <Character id="empty-peek" height={160} align="left" />
      <div className={styles.body}>
        <h1>찾는 페이지가 없습니다</h1>
        <p>주소가 바뀌었거나 비공개로 전환된 페이지일 수 있습니다.</p>
        <nav className={styles.links} aria-label="바로가기">
          <Link className="btn btn-primary" href="/">
            처음으로
          </Link>
          <Link className="btn btn-secondary" href="/books">
            서재
          </Link>
          <Link className="btn btn-secondary" href="/videos">
            전체 영상
          </Link>
        </nav>
      </div>
    </div>
  );
}
