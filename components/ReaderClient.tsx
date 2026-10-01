"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseBookProgress, readingSnapshot, updateBookProgress } from "@/lib/reading-progress";

interface Props {
  bookId: string;
  sectionId: string;
  sectionIds: string[];
  prevHref: string | null;
  nextHref: string | null;
}

const SIZE_KEY = "reader-size";

/** 스크롤 상자 안에서 현재 절 링크가 안 보이면 가운데로 */
function revealCurrent(box: HTMLElement | null) {
  const current = box?.querySelector<HTMLElement>('a[aria-current="page"]');
  if (!box || !current) return;
  const b = box.getBoundingClientRect();
  const c = current.getBoundingClientRect();
  if (c.top < b.top + 40 || c.bottom > b.bottom - 16) box.scrollTop += c.top - b.top - (b.height - c.height) / 2;
}

/**
 * 리더 화면의 브라우저 동작. 서버가 그린 마크업(rd-*)에 붙는다.
 *  - 진도: 들어오면 마지막 절로 기록, 절 끝 완료 줄(.rd-done)이 보이면 읽음 처리
 *  - 읽던 위치: 스크롤이 멈추면 본문 안 위치를 저장하고, 다 읽지 않은 절에 다시 오면 그 자리로 데려간다
 *  - 스크롤: 상단 진행 막대, "이 절에서" 현재 소제목 강조
 *  - 목차: 왼쪽 목차와 목차 시트에서 현재 절이 보이도록 스크롤
 *  - 코드 복사, 이미지 확대, 모바일 목차·설정 시트, 글자 크기, ←/→ 절 이동
 */
export function ReaderClient({ bookId, sectionId, sectionIds, prevHref, nextHref }: Props) {
  const router = useRouter();

  useEffect(() => {
    const before = parseBookProgress(readingSnapshot(), bookId, sectionIds);
    updateBookProgress(bookId, sectionIds, (p) => ({ ...p, last: sectionId, visitedAt: Date.now() }));

    const html = document.documentElement;
    const bar = document.querySelector<HTMLElement>(".rd-progress");
    const prose = document.querySelector<HTMLElement>(".rd-prose");
    revealCurrent(document.querySelector<HTMLElement>(".rd-toc:not(.rd-sheet-body)"));

    // 읽던 위치: 본문 맨 위를 0, 맨 아래를 1로 둔 비율
    const proseBox = () => {
      const r = prose!.getBoundingClientRect();
      return { top: r.top + scrollY, height: Math.max(1, r.height) };
    };
    let toast: HTMLElement | null = null;
    let toastTimer = 0;
    const resume = before.pos?.id === sectionId && !before.read.includes(sectionId) ? before.pos.r : 0;
    // 페이지를 옮기면 Next가 맨 위로 (부드럽게) 스크롤한다. 스크롤이 멈춘 뒤에 되살리고, 그 전에는 위치를 저장하지 않는다
    let settled = false;
    let resumeFrame = 0;
    let lastY = -1;
    let still = 0;
    const startedAt = performance.now();
    const settle = () => {
      if (scrollY === lastY) still++;
      else {
        still = 0;
        lastY = scrollY;
      }
      if (still < 5 && performance.now() - startedAt < 1500) {
        resumeFrame = requestAnimationFrame(settle);
        return;
      }
      settled = true;
      // 주소에 #이 있거나(소제목·댓글 바로가기) 브라우저가 이미 위치를 되살렸으면(새로고침·뒤로 가기) 건드리지 않는다
      if (!prose || location.hash || scrollY > 40 || resume < 0.05 || resume > 0.95) return;
      const { top, height } = proseBox();
      scrollTo({ top: top + resume * height - 80, behavior: "instant" });
      toast = document.createElement("div");
      toast.className = "rd-resume-toast";
      toast.setAttribute("role", "status");
      toast.innerHTML = '<span>읽던 곳으로 왔습니다</span><button type="button">처음부터</button>';
      toast.querySelector("button")!.addEventListener("click", () => {
        scrollTo({ top: 0, behavior: "instant" });
        toast?.remove();
      });
      document.body.append(toast);
      toastTimer = window.setTimeout(() => toast?.remove(), 5000);
    };
    resumeFrame = requestAnimationFrame(settle);
    let saveTimer = 0;
    const savePosition = () => {
      if (!prose || !settled) return;
      const { top, height } = proseBox();
      const r = Math.round(Math.max(0, Math.min(1, (scrollY + 80 - top) / height)) * 1000) / 1000;
      updateBookProgress(bookId, sectionIds, (p) => ({ ...p, pos: { id: sectionId, r } }));
    };
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
      clearTimeout(saveTimer);
      saveTimer = window.setTimeout(savePosition, 700);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);

    addEventListener("pagehide", savePosition);

    // 절 끝까지 읽으면 완료 (절 끝 댓글이 길어져도 완료 줄만 보면 된다)
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
    if (done) doneIo.observe(done);

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
        const sheet = document.querySelector<HTMLDialogElement>(`#${open.dataset.open}`);
        sheet?.showModal();
        revealCurrent(sheet);
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
      removeEventListener("pagehide", savePosition);
      document.removeEventListener("click", onClick);
      doneIo.disconnect();
      if (frame) cancelAnimationFrame(frame);
      cancelAnimationFrame(resumeFrame);
      clearTimeout(saveTimer);
      clearTimeout(toastTimer);
      toast?.remove();
    };
  }, [bookId, sectionId, sectionIds, prevHref, nextHref, router]);

  return null;
}
