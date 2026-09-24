"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateBookProgress } from "@/lib/reading-progress";

interface Props {
  bookId: string;
  sectionId: string;
  sectionIds: string[];
  prevHref: string | null;
  nextHref: string | null;
}

const SIZE_KEY = "reader-size";

/**
 * 리더 화면의 브라우저 동작. 서버가 그린 마크업(rd-*)에 붙는다.
 *  - 진도: 들어오면 마지막 절로 기록, 절 끝(.rd-end)이 보이면 읽음 처리
 *  - 스크롤: 상단 진행 막대, "이 절에서" 현재 소제목 강조
 *  - 코드 복사, 이미지 확대, 모바일 목차·설정 시트, 글자 크기, ←/→ 절 이동
 */
export function ReaderClient({ bookId, sectionId, sectionIds, prevHref, nextHref }: Props) {
  const router = useRouter();

  useEffect(() => {
    updateBookProgress(bookId, sectionIds, (p) => ({ ...p, last: sectionId, visitedAt: Date.now() }));

    const html = document.documentElement;
    const bar = document.querySelector<HTMLElement>(".rd-progress");
    const prose = document.querySelector<HTMLElement>(".rd-prose");
    const spyLinks = [...document.querySelectorAll<HTMLAnchorElement>(".rd-aside ol a")];
    const heads = spyLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean) as HTMLElement[];

    // 스크롤: 진행 막대 + 현재 소제목
    let frame = 0;
    const update = () => {
      frame = 0;
      if (bar && prose) {
        const r = prose.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (innerHeight * 0.35 - r.top) / r.height));
        bar.style.setProperty("--rp", p.toFixed(4));
      }
      if (heads.length) {
        let current = heads[0];
        for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * 0.3) current = h;
        spyLinks.forEach((a) => a.classList.toggle("on", a.hash.slice(1) === current.id));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);

    // 절 끝까지 읽으면 완료
    const end = document.querySelector(".rd-end");
    const done = document.querySelector<HTMLElement>(".rd-done");
    const doneIo = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        updateBookProgress(bookId, sectionIds, (p) => ({
          ...p,
          read: p.read.includes(sectionId) ? p.read : [...p.read, sectionId],
          visitedAt: Date.now(),
        }));
        done?.classList.add("on");
        const label = done?.querySelector("b");
        if (label) label.textContent = "이 절을 다 읽었습니다";
        doneIo.disconnect();
      },
      { threshold: 0.6 },
    );
    if (end) doneIo.observe(end);

    // 클릭: 코드 복사, 이미지 확대, 시트 열고 닫기, 글자 크기
    const zoom = document.querySelector<HTMLDialogElement>("dialog.rd-zoom");
    const applySize = (size: string) => {
      if (size === "s" || size === "l") html.dataset.size = size;
      else delete html.dataset.size;
      document.querySelectorAll<HTMLElement>("[data-set-size]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.setSize === (size === "s" || size === "l" ? size : "m"))),
      );
    };
    try {
      applySize(localStorage.getItem(SIZE_KEY) || "m");
    } catch {
      applySize("m");
    }
    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const copy = target.closest<HTMLButtonElement>("[data-copy]");
      if (copy) {
        const code = copy.closest(".code")?.querySelector("pre")?.innerText ?? "";
        try {
          await navigator.clipboard.writeText(code);
          copy.textContent = "복사됨";
        } catch {
          copy.textContent = "복사 실패";
        }
        setTimeout(() => (copy.textContent = "복사"), 1500);
        return;
      }
      const img = target.closest<HTMLImageElement>(".rd-prose figure img");
      if (img && zoom) {
        const big = new Image();
        big.src = img.currentSrc || img.src;
        big.alt = img.alt;
        zoom.replaceChildren(big);
        zoom.showModal();
        return;
      }
      if (target.closest("dialog.rd-zoom")) {
        zoom?.close();
        return;
      }
      const open = target.closest<HTMLElement>("[data-open]");
      if (open) {
        document.querySelector<HTMLDialogElement>(`#${open.dataset.open}`)?.showModal();
        return;
      }
      const closeBtn = target.closest<HTMLElement>("[data-close]");
      if (closeBtn) {
        closeBtn.closest("dialog")?.close();
        return;
      }
      // 시트 바깥(배경)을 누르면 닫는다
      if (target instanceof HTMLDialogElement && target.classList.contains("rd-sheet")) {
        target.close();
        return;
      }
      if (target.closest(".rd-sheet a")) target.closest("dialog")?.close();
      const size = target.closest<HTMLElement>("[data-set-size]");
      if (size) {
        applySize(size.dataset.setSize!);
        try {
          localStorage.setItem(SIZE_KEY, size.dataset.setSize!);
        } catch {}
      }
    };
    document.addEventListener("click", onClick);

    // ←/→ 이전·다음 절
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const el = event.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable='true']") || document.querySelector("dialog[open]")) return;
      if (event.key === "ArrowLeft" && prevHref) router.push(prevHref);
      if (event.key === "ArrowRight" && nextHref) router.push(nextHref);
    };
    addEventListener("keydown", onKey);

    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      doneIo.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [bookId, sectionId, sectionIds, prevHref, nextHref, router]);

  return null;
}
