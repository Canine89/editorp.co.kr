"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 스크롤 연동 효과 (DESIGN.md 7절). 스크롤 재킹 없이 위치·투명도만 바꾼다.
 *  - .reveal: 화면 아래에 있던 블록이 들어오면 한 번만 떠오르며 등장
 *  - .flow: 로드맵 세로선이 스크롤에 맞춰 채워지고, 지나간 단계(.flow-step)에 lit 표시
 * 동작 줄이기 설정이면 모두 완성된 상태로 둔다.
 */
export function ScrollEffects() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 화면 아래에 있는 블록만 잠시 숨겼다가(.pending) 화면에 들어오면 보인다. 이미 보이는 블록은 건드리지 않는다
    const io = reduce
      ? null
      : new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.remove("pending");
                io?.unobserve(e.target);
              }
            }),
          { rootMargin: "0px 0px -8% 0px" },
        );
    document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
      if (!io || el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add("pending");
      io.observe(el);
    });

    const flows = [...document.querySelectorAll<HTMLElement>(".flow")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = innerHeight * 0.62;
      for (const flow of flows) {
        const r = flow.getBoundingClientRect();
        const p = reduce ? 1 : Math.max(0, Math.min(1, (line - r.top) / r.height));
        flow.style.setProperty("--p", p.toFixed(4));
        flow.querySelectorAll<HTMLElement>(".flow-step").forEach((step) => {
          step.classList.toggle("lit", reduce || step.getBoundingClientRect().top < line);
        });
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    if (flows.length) {
      update();
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onScroll);
    }
    return () => {
      io?.disconnect();
      // 감시를 끊으면 숨긴 블록이 남지 않게 되돌린다 (다음 실행이 다시 판단)
      document.querySelectorAll(".reveal.pending").forEach((el) => el.classList.remove("pending"));
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
