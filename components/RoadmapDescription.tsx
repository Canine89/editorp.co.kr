'use client';

import React from 'react';
import { BookOpen, MessageCircle, Link2 } from 'lucide-react';

interface RoadmapDescriptionProps {
  description: string;
  isCompact?: boolean;
}

export function RoadmapDescription({ description, isCompact = false }: RoadmapDescriptionProps) {
  // Description parsing logic
  const lines = description.split('\n');
  const bodyLines: string[] = [];
  const links: Array<{ label: string; url: string; rawType: 'book' | 'kakao' | 'generic' }> = [];

  const bookPattern1 = /^\[도서 구매\]\[([^\]]+)\]\s*:\s*(https?:\/\/\S+)/i;
  const bookPattern2 = /^도서 구매\s*:\s*(https?:\/\/\S+)/i;
  const kakaoPattern = /^(오픈카톡방|카카오톡|카톡)\s*:\s*(https?:\/\/\S+)/i;
  const genericLinkPattern = /^([^:\n]+)\s*:\s*(https?:\/\/\S+)/;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      bodyLines.push('');
      return;
    }

    // Match Pattern 1: [도서 구매][Yes24] : url
    const mBook1 = trimmed.match(bookPattern1);
    if (mBook1) {
      links.push({
        label: `도서 구매 (${mBook1[1]})`,
        url: mBook1[2],
        rawType: 'book',
      });
      return;
    }

    // Match Pattern 2: 도서 구매 : url
    const mBook2 = trimmed.match(bookPattern2);
    if (mBook2) {
      links.push({
        label: '도서 구매',
        url: mBook2[1],
        rawType: 'book',
      });
      return;
    }

    // Match Kakao Chat: 오픈카톡방 : url
    const mKakao = trimmed.match(kakaoPattern);
    if (mKakao) {
      links.push({
        label: mKakao[1],
        url: mKakao[2],
        rawType: 'kakao',
      });
      return;
    }

    // Match general key : url structure
    const mGeneric = trimmed.match(genericLinkPattern);
    if (mGeneric) {
      links.push({
        label: mGeneric[1].trim(),
        url: mGeneric[2],
        rawType: 'generic',
      });
      return;
    }

    // If no match, it's just regular body text
    bodyLines.push(line);
  });

  // Re-assemble cleanup body text (removing trailing/leading empty lines)
  const cleanBody = bodyLines.join('\n').trim();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '10px' : '14px' }}>
      {cleanBody && (
        <p
          style={{
            fontSize: isCompact ? '13.5px' : '15px',
            color: 'var(--colors-body)',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {cleanBody}
        </p>
      )}
      
      {links.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: isCompact ? '4px' : '6px',
          }}
        >
          {links.map((link, idx) => {
            let btnStyle: React.CSSProperties = {
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: isCompact ? '12px' : '13px',
              fontWeight: 500,
              padding: isCompact ? '6px 12px' : '8px 16px',
              borderRadius: 'var(--rounded-md)',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            };

            const iconSize = isCompact ? 13 : 15;
            let icon = <Link2 size={iconSize} />;

            if (link.rawType === 'book') {
              btnStyle = {
                ...btnStyle,
                background: 'linear-gradient(135deg, var(--colors-primary) 0%, #e8987d 100%)',
                color: '#ffffff',
              };
              icon = <BookOpen size={iconSize} />;
            } else if (link.rawType === 'kakao') {
              btnStyle = {
                ...btnStyle,
                backgroundColor: '#FEE500',
                color: '#191919',
              };
              icon = <MessageCircle size={iconSize} />;
            } else {
              btnStyle = {
                ...btnStyle,
                backgroundColor: 'var(--colors-surface-cream-strong)',
                color: 'var(--colors-ink)',
                border: '1px solid var(--colors-hairline)',
              };
            }

            return (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={btnStyle}
                className="roadmap-link-btn"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
