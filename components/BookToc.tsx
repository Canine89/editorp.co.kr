'use client';

import { useState } from 'react';
import Link from 'next/link';
import { List, ChevronDown } from 'lucide-react';
import type { Book } from '@/lib/books';

/**
 * 읽기 페이지 왼쪽의 책 목차 사이드바.
 * 데스크톱: 항상 펼쳐진 sticky 사이드바.
 * 모바일: "목차" 버튼으로 여닫는 아코디언.
 */
export function BookToc({ book, currentSectionId }: { book: Book; currentSectionId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className="book-toc">
      <button
        type="button"
        className="book-toc-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <List size={15} /> 목차
        </span>
        <ChevronDown
          size={15}
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}
        />
      </button>

      <nav className={`book-toc-nav ${isOpen ? 'open' : ''}`}>
        <Link href={`/books/${book.id}`} className="book-toc-booktitle" onClick={() => setIsOpen(false)}>
          {book.title}
        </Link>

        {book.parts.map((part) => (
          <div key={part.id} className="book-toc-part">
            <div className="book-toc-part-title">{part.title}</div>
            {part.chapters.map((chapter) => (
              <div key={chapter.id}>
                <div className="book-toc-chapter-title">{chapter.title}</div>
                <ul>
                  {chapter.sections.map((section) => (
                    <li key={section.id}>
                      <Link
                        href={`/books/${book.id}/${section.id}`}
                        className={`book-toc-section${section.id === currentSectionId ? ' active' : ''}`}
                        aria-current={section.id === currentSectionId ? 'page' : undefined}
                        onClick={() => setIsOpen(false)}
                      >
                        {section.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
