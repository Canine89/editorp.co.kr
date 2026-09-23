"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AuthButton } from "./AuthButton";

const links = [
  { href: "/", label: "로드맵" },
  { href: "/books", label: "서재" },
  { href: "/qna", label: "질문" },
  { href: "/about", label: "소개" },
];

/** 책 본문 읽기 화면: /books/<책>/<절> */
const isReaderPath = (path: string) => /^\/books\/[^/]+\/[^/]+/.test(path);

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [isOpen]);

  // 스크롤하면 아래 구분선. 리더에서는 내려갈 때 숨기고 올라갈 때 다시 보인다
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const reader = isReaderPath(pathname);
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle("scrolled", y > 4);
      if (reader) {
        if (y > lastY + 6 && y > 160) header.classList.add("hide");
        else if (y < lastY - 6 || y < 160) header.classList.remove("hide");
        document.documentElement.classList.toggle("header-hidden", header.classList.contains("hide"));
      }
      lastY = y;
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      header.classList.remove("hide");
      document.documentElement.classList.remove("header-hidden");
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/learn/") || pathname.startsWith("/roadmaps/") || pathname.startsWith("/videos")
      : href === "/books"
        ? pathname.startsWith("/books") || pathname.startsWith("/edited-books")
        : pathname === href || pathname.startsWith(href + "/");

  const close = () => setIsOpen(false);

  return (
    <header
      ref={headerRef}
      className="main-header"
      onKeyDown={(e) => {
        if (e.key === "Escape" && isOpen) {
          menuRef.current?.focus();
          close();
        }
      }}
    >
      <div className="container header-container">
        <Link href="/" className="header-logo" onClick={close}>
          편집자P의 AI 서재
        </Link>
        <nav className="main-nav-desktop" aria-label="주 메뉴">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <AuthButton />
        </nav>
        <button
          ref={menuRef}
          className="menu-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <nav
          id="mobile-navigation"
          className={`main-nav-mobile ${isOpen ? "open" : ""}`}
          aria-label="모바일 메뉴"
        >
          {[...links, { href: "/videos", label: "전체 영상" }, { href: "/edited-books", label: "참여한 책" }].map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="nav-link"
              onClick={close}
              aria-current={isActive(link.href) && link.href !== "/videos" && link.href !== "/edited-books" ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}
