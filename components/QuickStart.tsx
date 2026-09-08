"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, FileText, Code2, Clock3 } from "lucide-react";
import type { PathSummary } from "./PathExplorer";
import styles from "./QuickStart.module.css";
const choices = [
  { id: "ai-foundations", label: "AI가 처음이에요", icon: Compass },
  { id: "claude-work", label: "문서·업무를 줄이고 싶어요", icon: FileText },
  { id: "cursor-building", label: "웹사이트를 만들고 싶어요", icon: Code2 },
];
export function QuickStart({ paths }: { paths: PathSummary[] }) {
  const available = choices.filter((c) => paths.some((p) => p.id === c.id));
  const [selected, setSelected] = useState(available[0]?.id ?? "");
  const path = paths.find((p) => p.id === selected);
  return (
    <section
      className={styles.panel}
      id="quick-start"
      aria-label="나에게 맞는 시작점 찾기"
    >
      <div className={styles.heading}>
        <span>시작점 찾기</span>
        <h2>지금 어떤 도움이 필요한가요?</h2>
      </div>
      <fieldset className={styles.choices}>
        <legend className="sr-only">학습 목적 선택</legend>
        {available.map((choice) => {
          const Icon = choice.icon;
          return (
            <label
              key={choice.id}
              className={selected === choice.id ? styles.selected : ""}
            >
              <input
                type="radio"
                name="learning-goal"
                value={choice.id}
                checked={selected === choice.id}
                onChange={() => setSelected(choice.id)}
              />
              <Icon size={19} aria-hidden="true" />
              <span>{choice.label}</span>
            </label>
          );
        })}
      </fieldset>
      <div className={styles.recommendation} aria-live="polite">
        {path ? (
          <>
            <span className={styles.caption}>이 경로부터 시작해 보세요</span>
            <h3>{path.title}</h3>
            <p>{path.outcome}</p>
            <div className={styles.meta}>
              <span>{path.lessonCount}개 강의</span>
              {path.firstMinutes !== null && (
                <span>
                  <Clock3 size={13} aria-hidden="true" />첫 강의{" "}
                  {path.firstMinutes}분
                </span>
              )}
            </div>
            <Link href={`/learn/${path.id}`} className="btn btn-primary">
              {path.title} 시작 <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <p>현재 공개된 경로에서 시작점을 골라보세요.</p>
            <a href="#roadmap-list" className="btn btn-primary">
              전체 학습 경로 보기
            </a>
          </>
        )}
      </div>
    </section>
  );
}
