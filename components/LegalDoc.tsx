import type { ReactNode } from "react";
import { POLICY_EFFECTIVE_DATE } from "@/lib/business";
import styles from "./LegalDoc.module.css";

/** 약관·방침 문서 틀: 제목, 시행일, 목차(조항 제목), 본문 */
export function LegalDoc({
  title,
  sections,
  children,
}: {
  title: string;
  /** 목차: [앵커 id, 조항 제목] */
  sections: [string, string][];
  children: ReactNode;
}) {
  const [y, m, d] = POLICY_EFFECTIVE_DATE.split("-").map(Number);
  return (
    <article className={`container ${styles.doc}`}>
      <h1>{title}</h1>
      <p className={styles.meta}>
        시행일 {y}년 {m}월 {d}일
      </p>
      <ol className={styles.toc} aria-label="목차">
        {sections.map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`}>{label}</a>
          </li>
        ))}
      </ol>
      <div className={styles.body}>{children}</div>
    </article>
  );
}

export { styles as legalStyles };
