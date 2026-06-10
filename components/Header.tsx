'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { AuthButton } from './AuthButton';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="main-header">
      <div className="container header-container">
        <Link href="/" className="header-logo" onClick={() => setIsOpen(false)}>
          <img
            src="/p.png"
            alt="편집자P 캐릭터"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid var(--colors-hairline)',
            }}
          />
          <span className="serif-display header-logo-text">
            편집자P의 AI 강의·편집실
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="main-nav-desktop">
          <Link href="/" className="nav-link">
            로드맵 목록
          </Link>
          <Link href="/qna" className="nav-link">
            질문 게시판
          </Link>
          <Link href="/about" className="nav-link">
            소개 & 강의 문의
          </Link>
          <a
            href="https://www.youtube.com/@editorp89"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
          >
            유튜브 채널
          </a>
          <AuthButton />
          <ThemeToggle />
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="header-mobile-actions">
          <ThemeToggle />
        </div>
        <button
          className="menu-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="메뉴 열기/닫기"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </>
            )}
          </svg>
        </button>

        {/* Mobile Navigation Dropdown */}
        <nav className={`main-nav-mobile ${isOpen ? 'open' : ''}`}>
          <Link href="/" className="nav-link" onClick={() => setIsOpen(false)}>
            로드맵 목록
          </Link>
          <Link href="/qna" className="nav-link" onClick={() => setIsOpen(false)}>
            질문 게시판
          </Link>
          <Link href="/about" className="nav-link" onClick={() => setIsOpen(false)}>
            소개 & 강의 문의
          </Link>
          <a
            href="https://www.youtube.com/@editorp89"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            유튜브 채널
          </a>
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--colors-hairline)' }}>
            <AuthButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
