"use client";
import { useEffect, useSyncExternalStore } from "react";
import { parseBookProgress, readingSnapshot, subscribeReading } from "@/lib/reading-progress";

/**
 * 서버가 그린 목차에 브라우저 독서 기록을 입힌다.
 *  - a[data-section] 중 읽은 절에 .read
 *  - [data-chapter-count="절id,절id"] 에 "읽은 수/전체"
 *  - [data-read-count] 에 "N/M절 읽음"
 */
export function TocMarks({ bookId, sectionIds }: { bookId: string; sectionIds: string[] }) {
  const snapshot = useSyncExternalStore(subscribeReading, readingSnapshot, () => "");
  useEffect(() => {
    const read = new Set(parseBookProgress(snapshot, bookId, sectionIds).read);
    document.querySelectorAll<HTMLElement>("a[data-section]").forEach((a) => {
      a.classList.toggle("read", read.has(a.dataset.section!));
    });
    document.querySelectorAll<HTMLElement>("[data-chapter-count]").forEach((el) => {
      const ids = el.dataset.chapterCount!.split(",");
      el.textContent = `${ids.filter((id) => read.has(id)).length}/${ids.length}`;
    });
    document.querySelectorAll<HTMLElement>("[data-read-count]").forEach((el) => {
      el.textContent = read.size ? `${read.size}/${sectionIds.length}절 읽음` : `${sectionIds.length}절`;
    });
  }, [snapshot, bookId, sectionIds]);
  return null;
}
