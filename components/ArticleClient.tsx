"use client";
import { useEffect } from "react";
import { copyReaderCode } from "@/lib/reader-copy";
import { installReaderImageFallback } from "@/lib/reader-images";

/**
 * 아티클 화면의 브라우저 동작. 서버가 그린 리더 마크업(rd-*)에 붙는다.
 * 리더(ReaderClient)에서 책 진도·절 이동을 뺀 나머지: 상단 진행 막대, "이 글에서" 현재 소제목 강조,
 * 코드 복사, 이미지 확대.
 */
export function ArticleClient() {
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>(".rd-progress");
    const prose = document.querySelector<HTMLElement>(".rd-prose");
    const spyLinks = [...document.querySelectorAll<HTMLAnchorElement>(".rd-aside ol a")];
    const heads = spyLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean) as HTMLElement[];

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

    const zoom = document.querySelector<HTMLDialogElement>("dialog.rd-zoom");
    const removeImageFallback = installReaderImageFallback();
    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const copy = target.closest<HTMLButtonElement>("[data-copy]");
      if (copy) {
        await copyReaderCode(copy);
        return;
      }
      const img = target.closest<HTMLImageElement>(".rd-prose figure img");
      if (img && zoom) {
        const big = new Image();
        big.src = img.dataset.originalSrc || img.currentSrc || img.src;
        big.alt = img.alt;
        zoom.replaceChildren(big);
        zoom.showModal();
        return;
      }
      if (target.closest("dialog.rd-zoom")) zoom?.close();
    };
    document.addEventListener("click", onClick);

    return () => {
      removeImageFallback();
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      document.removeEventListener("click", onClick);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
