"use client";
import { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}
const getTheme = () =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const toggle = () => {
    const next = getTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* 저장이 차단되어도 현재 화면에는 적용한다. */
    }
  };
  const label = theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="icon-btn"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
