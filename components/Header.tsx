"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { AuthButton } from "./AuthButton";
const links = [
  { href: "/", label: "로드맵" },
  { href: "/videos", label: "전체 영상" },
  { href: "/qna", label: "질문" },
  { href: "/about", label: "소개" },
];
export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [booksOpen, setBooksOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const bookRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isOpen && !booksOpen) return;
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setBooksOpen(false);
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [isOpen, booksOpen]);
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" ||
        pathname.startsWith("/learn/") ||
        pathname.startsWith("/roadmaps/")
      : pathname === href || pathname.startsWith(href + "/");
  const booksActive = isActive("/books") || isActive("/edited-books");
  const close = () => {
    setIsOpen(false);
    setBooksOpen(false);
  };
  return (
    <header
      ref={headerRef}
      className="main-header"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (booksOpen) bookRef.current?.focus();
          else if (isOpen) menuRef.current?.focus();
          close();
        }
      }}
    >
      <div className="container header-container">
        <Link href="/" className="header-logo" onClick={close}>
          <Image
            src="/p.png"
            alt="편집자P 캐릭터"
            width={30}
            height={30}
            style={{ borderRadius: "50%" }}
          />
          <span className="header-logo-text">편집자P의 AI 강의·편집실</span>
        </Link>
        <nav className="main-nav-desktop" aria-label="주 메뉴">
          {links.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <div
            className="nav-group"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget))
                setBooksOpen(false);
            }}
          >
            <button
              ref={bookRef}
              className="nav-link nav-trigger"
              type="button"
              aria-current={booksActive ? "page" : undefined}
              aria-expanded={booksOpen}
              aria-controls="book-menu"
              onClick={() => setBooksOpen(!booksOpen)}
            >
              도서
            </button>
            <div
              id="book-menu"
              className="nav-menu"
              hidden={!booksOpen}
              style={
                booksOpen
                  ? {
                      opacity: 1,
                      pointerEvents: "auto",
                      transform: "translate(-50%,0)",
                    }
                  : undefined
              }
            >
              <Link
                href="/books"
                className="nav-menu-link"
                aria-current={isActive("/books") ? "page" : undefined}
                onClick={close}
              >
                무료 도서
              </Link>
              <Link
                href="/edited-books"
                aria-current={isActive("/edited-books") ? "page" : undefined}
                className="nav-menu-link"
                onClick={close}
              >
                편집한 도서
              </Link>
            </div>
          </div>
          {links.slice(2).map((link) => (
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
          <ThemeToggle />
        </nav>
        <div className="header-mobile-actions">
          <ThemeToggle />
        </div>
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
          {[
            ...links,
            { href: "/books", label: "무료 도서" },
            { href: "/edited-books", label: "편집한 도서" },
          ].map((link) => (
            <Link
              href={link.href}
              key={link.href}
              className="nav-link"
              onClick={close}
              aria-current={isActive(link.href) ? "page" : undefined}
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
