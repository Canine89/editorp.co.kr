"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import {
  parseProgress,
  progressSnapshot,
  subscribeProgress,
  type ProgressCourse,
} from "@/lib/learning-progress";
import styles from "./ContinueLearning.module.css";
export function ContinueLearning({ courses }: { courses: ProgressCourse[] }) {
  const snapshot = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    () => "",
  );
  const recent = courses
    .map((course) => ({ course, progress: parseProgress(snapshot, course) }))
    .filter(
      ({ course, progress }) =>
        (progress.lastId || progress.completed.length) &&
        progress.completed.length < course.nodes.length,
    )
    .sort((a, b) => b.progress.visitedAt - a.progress.visitedAt)[0];
  if (!recent) return null;
  const { course, progress } = recent;
  const next =
    course.nodes.find(
      (n) => n.id === progress.lastId && !progress.completed.includes(n.id),
    ) ?? course.nodes.find((n) => !progress.completed.includes(n.id));
  if (!next) return null;
  return (
    <aside className={styles.resume} aria-label="이어서 학습">
      <BookOpenCheck size={23} aria-hidden="true" />
      <div>
        <span>이어서 학습 / {progress.completed.length}개 완료</span>
        <h2>{course.title}</h2>
        <p>이어볼 강의: {next.title}</p>
      </div>
      <Link
        href={`${course.href}?lesson=${encodeURIComponent(next.id)}`}
        className="btn btn-primary"
      >
        이어보기 <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </aside>
  );
}
