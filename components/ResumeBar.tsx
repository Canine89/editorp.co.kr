"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { parseProgress, progressSnapshot, subscribeProgress, type ProgressCourse } from "@/lib/learning-progress";
import { nextToRead, parseBookProgress, readingSnapshot, subscribeReading } from "@/lib/reading-progress";
import styles from "./ResumeBar.module.css";

export interface ResumeBook {
  id: string;
  title: string;
  sections: { id: string; title: string }[];
}

const subscribeBoth = (callback: () => void) => {
  const a = subscribeProgress(callback);
  const b = subscribeReading(callback);
  return () => {
    a();
    b();
  };
};
const snapshotBoth = () => progressSnapshot() + "\u0000" + readingSnapshot();

/** 방문 기록이 있을 때만 보이는 한 줄: 이어 읽기(책) · 이어보기(강의) */
export function ResumeBar({ courses, books }: { courses: ProgressCourse[]; books: ResumeBook[] }) {
  const snapshot = useSyncExternalStore(subscribeBoth, snapshotBoth, () => "");
  if (!snapshot) return null;
  const [learning, reading] = snapshot.split("\u0000");

  const book = books
    .map((b) => ({ book: b, progress: parseBookProgress(reading, b.id, b.sections.map((s) => s.id)) }))
    .filter(({ progress }) => progress.last)
    .sort((a, b) => b.progress.visitedAt - a.progress.visitedAt)[0];
  const bookSection = book && nextToRead(book.book.sections, book.progress);

  const course = courses
    .map((c) => ({ course: c, progress: parseProgress(learning, c) }))
    .filter(({ course: c, progress }) => (progress.lastId || progress.completed.length) && progress.completed.length < c.nodes.length)
    .sort((a, b) => b.progress.visitedAt - a.progress.visitedAt)[0];
  const lesson = course
    ? (course.course.nodes.find((n) => n.id === course.progress.lastId && !course.progress.completed.includes(n.id)) ??
      course.course.nodes.find((n) => !course.progress.completed.includes(n.id)))
    : undefined;

  if (!bookSection && !lesson) return null;
  return (
    <div className={styles.resume} aria-label="이어서 하기">
      <div className="container">
        {book && bookSection && (
          <Link href={`/books/${book.book.id}/${bookSection.id}`}>
            <small>이어 읽기</small>
            <b>
              {book.book.title} · {bookSection.title}
            </b>
          </Link>
        )}
        {course && lesson && (
          <Link href={`${course.course.href}?lesson=${encodeURIComponent(lesson.id)}`}>
            <small>이어보기</small>
            <b>
              {course.course.title} · {course.course.nodes.indexOf(lesson) + 1}/{course.course.nodes.length}강 {lesson.title}
            </b>
          </Link>
        )}
      </div>
    </div>
  );
}
