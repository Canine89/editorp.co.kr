"use client";
import { useEffect, useSyncExternalStore } from "react";
import { parseBookProgress, readingSnapshot, subscribeReading } from "@/lib/reading-progress";

/**
 * 서버가 그린 목차에 브라우저 독서 기록을 입힌다.
 *  - a[data-section] 중 읽은 절에 .read
 *  - [data-chapter-count="절id,절id"] 에 "읽은 수/전체" (읽은 절이 없으면 "N절")
 *  - [data-read-count] 에 "N/M절 읽음"
 */
export function TocMarks({ bookId, sectionIds, scope }: { bookId: string; sectionIds: string[]; scope?: string }) {
  const snapshot = useSyncExternalStore(subscribeReading, readingSnapshot, () => "");
  useEffect(() => {
    const read = new Set(parseBookProgress(snapshot, bookId, sectionIds).read);
    // 한 화면에 책이 여럿이면 절 id가 겹치므로 그 책의 영역 안에서만 찾는다
    const root: ParentNode = (scope && document.querySelector(scope)) || document;
    root.querySelectorAll<HTMLElement>("a[data-section]").forEach((a) => {
      a.classList.toggle("read", read.has(a.dataset.section!));
    });
    root.querySelectorAll<HTMLElement>("[data-chapter-count]").forEach((el) => {
      const ids = el.dataset.chapterCount!.split(",");
      const done = ids.filter((id) => read.has(id)).length;
      el.textContent = done ? `${done}/${ids.length}` : `${ids.length}절`;
    });
    root.querySelectorAll<HTMLElement>("[data-read-count]").forEach((el) => {
      el.textContent = read.size ? `${read.size}/${sectionIds.length}절 읽음` : `${sectionIds.length}절`;
    });
  }, [snapshot, bookId, sectionIds, scope]);
  return null;
}
