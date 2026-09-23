"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { nextToRead, parseBookProgress, readingSnapshot, subscribeReading } from "@/lib/reading-progress";
import styles from "./Library.module.css";

interface Props {
  bookId: string;
  sections: { id: string; title: string }[];
  /** 진도 막대 위에 앉힐 캐릭터 등 */
  children?: React.ReactNode;
}

/** 책 진도 막대와 이어 읽기 버튼. 기록이 없으면 처음부터 읽기만 보인다 */
export function BookProgress({ bookId, sections, children }: Props) {
  const snapshot = useSyncExternalStore(subscribeReading, readingSnapshot, () => "");
  const ids = sections.map((s) => s.id);
  const progress = parseBookProgress(snapshot, bookId, ids);
  const readCount = progress.read.length;
  const next = nextToRead(sections, progress);
  const started = readCount > 0 || progress.last !== null;

  return (
    <>
      {started && (
        <div className={styles.progress}>
          {children}
          <div className={styles.progressBar}>
            <i style={{ width: `${Math.round((readCount / sections.length) * 100)}%` }} />
          </div>
          <small>
            {readCount}/{sections.length}절 읽음{next ? ` · 다음: ${next.title}` : " · 다 읽었습니다"}
          </small>
        </div>
      )}
      <div className={styles.actions}>
        {started && next ? (
          <Link className="btn btn-primary" href={`/books/${bookId}/${next.id}`}>
            이어 읽기
          </Link>
        ) : (
          <Link className="btn btn-primary" href={`/books/${bookId}/${sections[0]?.id}`}>
            처음부터 읽기
          </Link>
        )}
        <Link className="btn btn-secondary" href={`/books/${bookId}`}>
          목차
        </Link>
      </div>
    </>
  );
}
