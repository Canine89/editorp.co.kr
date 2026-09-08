import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, BookOpen, Check } from "lucide-react";
import { asRoadmap } from "@/lib/learning-paths";
import { getLearningPaths, learningMinutes } from "@/lib/learning-data";
import { getRoadmapData } from "@/lib/roadmap-data";
import { RoadmapCanvas } from "@/components/RoadmapCanvas";
import styles from "./learn.module.css";
export const revalidate = 0;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paths = await getLearningPaths();
  const path = paths.find((p) => p.id === id);
  return {
    title: path
      ? `${path.title} | 편집자P 학습 로드맵`
      : "학습 경로를 찾을 수 없습니다",
    description: path?.summary,
  };
}
export default async function LearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getRoadmapData();
  const learningPaths = await getLearningPaths(data);
  const path = learningPaths.find((p) => p.id === id);
  if (!path) notFound();
  const roadmap =
    data.roadmaps.find(
      (r) => r.curation && r.id.replace(/^learn-/, "") === id,
    ) ?? asRoadmap(path);
  const minutes = learningMinutes(path);
  return (
    <>
      <section className={`container ${styles.intro}`}>
        <Link href="/#roadmap-list" className={styles.back}>
          <ArrowLeft size={14} /> 모든 학습 경로
        </Link>
        <div className={styles.meta}>
          <span>{path.level}</span>
          <span>
            <BookOpen size={14} /> {path.lessons.length}개 강의
          </span>
          <span>
            <Clock3 size={14} />{" "}
            {minutes === null ? "시청 시간 확인 중" : `시청 ${minutes}분`}
          </span>
        </div>
        <h1>{path.title}</h1>
        <p>{path.summary}</p>
        <details className={styles.guideDisclosure}>
          <summary>학습 대상·준비사항·목표 확인</summary>
          <div className={styles.guide}>
            <div>
              <strong>이런 분에게</strong>
              <span>{path.audience}</span>
            </div>
            <div>
              <strong>시작하기 전에</strong>
              <span>{path.prerequisite}</span>
            </div>
            <div>
              <strong>
                <Check size={14} /> 이 경로의 목표
              </strong>
              <span>{path.outcome}</span>
            </div>
          </div>
        </details>
      </section>
      <div className={styles.player}>
        <RoadmapCanvas roadmap={roadmap} />
      </div>
      <section className={`container ${styles.after}`}>
        <p>
          학습 완료 표시는 이 브라우저에 저장됩니다. 시청 시간에 실습 시간은
          포함되지 않으며, 도구 사용에는 별도 요금이 발생할 수 있습니다.
        </p>
        <h2>
          {path.next.length
            ? "다음 배움으로 이어가세요."
            : "이제, 나의 프로젝트에 적용해 보세요."}
        </h2>
        <div className={styles.next}>
          {path.next.map((id) => {
            const next = learningPaths.find((p) => p.id === id);
            if (!next) return null;
            return (
              <Link key={id} href={`/learn/${id}`}>
                {next.title}
                <ArrowRight size={16} />
              </Link>
            );
          })}
          {!path.next.length && (
            <Link href="/videos">
              전체 영상에서 필요한 실습 찾기 <ArrowRight size={16} />
            </Link>
          )}
          <Link href="/qna">
            막히는 부분 질문하기 <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </>
  );
}
