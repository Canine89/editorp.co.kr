"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown, BookOpen, Clock3 } from "lucide-react";
import type { LearningPath } from "@/lib/learning-paths";
import styles from "./PathExplorer.module.css";
export type PathSummary = Omit<LearningPath, "lessons"> & {
  lessonCount: number;
  minutes: number | null;
  firstMinutes: number | null;
  firstGoal: string;
};
const filters = [
  "추천 순서",
  "전체",
  "처음 시작",
  "업무 자동화",
  "바이브 코딩",
  "에이전트 심화",
];
function PathRow({ path }: { path: PathSummary }) {
  return (
    <Link href={`/learn/${path.id}`} className={styles.row}>
      <div>
        <span>
          {path.level} / {path.lessonCount}개 강의
        </span>
        <h3>{path.title}</h3>
        <p>{path.outcome}</p>
        <small>
          {path.minutes !== null
            ? `총 시청 ${path.minutes}분`
            : "시청 시간 확인 중"}
        </small>
      </div>
      <ArrowRight size={18} />
    </Link>
  );
}
export function PathExplorer({
  paths,
  initialFilter,
}: {
  paths: PathSummary[];
  initialFilter?: string;
}) {
  const [filter, setFilter] = useState(
    filters.includes(initialFilter || "") ? initialFilter! : "추천 순서",
  );
  useEffect(() => {
    const back = () => {
      const view = new URLSearchParams(location.search).get("view");
      setFilter(filters.includes(view || "") ? view! : "추천 순서");
    };
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  const changeFilter = (value: string) => {
    setFilter(value);
    const url = new URL(location.href);
    if (value === "추천 순서") url.searchParams.delete("view");
    else url.searchParams.set("view", value);
    url.hash = "roadmap-list";
    window.history.pushState(window.history.state, "", url);
  };
  const foundation = paths.find((p) => p.id === "ai-foundations");
  const advanced = paths.filter(
    (p) => p.level === "심화" || p.topic === "에이전트 심화",
  );
  const middle = paths.filter((p) => p !== foundation && !advanced.includes(p));
  const work = middle.filter((p) => p.topic === "업무 자동화");
  const build = middle.filter((p) => p.topic === "바이브 코딩");
  const other = middle.filter((p) => !work.includes(p) && !build.includes(p));
  const shown = paths.filter(
    (p) =>
      filter === "전체" ||
      filter === "추천 순서" ||
      (filter === "처음 시작" ? p.level === filter : p.topic === filter),
  );
  return (
    <>
      <div className={styles.filters} aria-label="학습 경로 보기 방식">
        {filters.map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={filter === item}
            onClick={() => changeFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {shown.length}개 학습 경로
      </p>
      {filter === "추천 순서" ? (
        <div className={styles.flow}>
          {foundation && (
            <article className={styles.start}>
              <div>
                <span className={styles.phase}>공통 기초</span>
                <h3>{foundation.title}</h3>
                <p>{foundation.summary}</p>
                <div className={styles.meta}>
                  <span>
                    <BookOpen size={14} />
                    {foundation.lessonCount}개 강의
                  </span>
                  <span>
                    <Clock3 size={14} />
                    {foundation.minutes !== null
                      ? `전체 ${foundation.minutes}분`
                      : "시간 확인 중"}
                  </span>
                </div>
              </div>
              <div className={styles.firstLesson}>
                <strong>
                  {foundation.firstMinutes !== null
                    ? `오늘은 첫 ${foundation.firstMinutes}분부터`
                    : "첫 강의부터 시작하세요"}
                </strong>
                <p>{foundation.firstGoal}</p>
                <Link
                  href={`/learn/${foundation.id}`}
                  className="btn btn-primary"
                >
                  기초 학습 시작 <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          )}
          {(work.length > 0 || build.length > 0) && (
            <>
              <p className={styles.connector}>
                <ArrowDown size={16} />
                {foundation
                  ? "기초를 익혔다면, 만들고 싶은 결과물을 선택하세요."
                  : "만들고 싶은 결과물에 맞춰 시작하세요."}
              </p>
              <div className={styles.branches}>
                {work.length > 0 && (
                  <section>
                    <div className={styles.branchHeading}>
                      <span>문서·업무</span>
                      <h3>매일 하는 일을 가볍게</h3>
                      <p>
                        클로드로 문서 작업을 익힌 뒤, 반복 업무를 자동화합니다.
                      </p>
                    </div>
                    <ol className={styles.branchList}>
                      {work.map((p) => (
                        <li key={p.id}>
                          <PathRow path={p} />
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
                {build.length > 0 && (
                  <section>
                    <div className={styles.branchHeading}>
                      <span>웹·앱 제작</span>
                      <h3>내 아이디어를 실제 화면으로</h3>
                      <p>
                        커서와 코덱스 중 도구 하나를 골라 작은 프로젝트를
                        완성하세요.
                      </p>
                    </div>
                    <div className={styles.branchList}>
                      {build.map((p) => (
                        <PathRow key={p.id} path={p} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
          {other.map((p) => (
            <PathRow key={p.id} path={p} />
          ))}
          {advanced.length > 0 && (
            <>
              <p className={styles.connector}>
                <ArrowDown size={16} />
                작은 결과물을 완성한 다음, 작업 범위를 넓혀보세요.
              </p>
              <section className={styles.advanced}>
                <div>
                  <span className={styles.phase}>다음 단계</span>
                  <h3>에이전트와 더 깊이 일하기</h3>
                </div>
                <div>
                  {advanced.map((p) => (
                    <PathRow key={p.id} path={p} />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {shown.map((p) => (
            <PathRow key={p.id} path={p} />
          ))}
        </div>
      )}
      {shown.length === 0 && (
        <div className={styles.empty}>
          <p>이 조건의 학습 경로는 아직 없습니다.</p>
          <button
            className="btn btn-secondary"
            onClick={() => changeFilter("전체")}
          >
            전체 경로 보기
          </button>
        </div>
      )}
      <p className={styles.note}>
        시간은 영상 시청 기준이며 실습 시간은 별도입니다. 강의에 사용하는 도구는
        별도 요금이 발생할 수 있습니다.
      </p>
    </>
  );
}
