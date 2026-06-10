import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowRight, CirclePlay, MessageCircle } from 'lucide-react';
import { RoadmapDescription } from '@/components/RoadmapDescription';


interface Node {
  id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  x: number;
  y: number;
  parentId: string | null;
}

interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  nodes: Node[];
}

interface RoadmapData {
  categories: string[];
  roadmaps: Roadmap[];
}

function getRoadmapData(): RoadmapData {
  const filePath = path.join(process.cwd(), 'data', 'roadmap.json');
  if (!fs.existsSync(filePath)) {
    return { categories: [], roadmaps: [] };
  }
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading roadmap JSON:', error);
    return { categories: [], roadmaps: [] };
  }
}

export const revalidate = 0; // Disable caching to fetch fresh commits on page load

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const data = getRoadmapData();
  const activeRoadmaps = data.roadmaps.filter((r) => r.isActive !== false);
  const totalLectures = activeRoadmaps.reduce((sum, r) => sum + (r.nodes?.length || 0), 0);

  // Filter by category if selected
  const filteredRoadmaps = cat
    ? activeRoadmaps.filter((r) => r.category.toLowerCase() === cat.toLowerCase())
    : activeRoadmaps;

  // Scan the thumbnails folder to render a beautiful cascade showcase
  const thumbnailsDir = path.join(process.cwd(), 'public', 'youtube_thumbnails');
  let thumbnailFiles: string[] = [];
  if (fs.existsSync(thumbnailsDir)) {
    try {
      thumbnailFiles = fs.readdirSync(thumbnailsDir)
        .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.webp'))
        .sort((a, b) => b.localeCompare(a));
    } catch (e) {
      console.error('Error reading thumbnails dir:', e);
    }
  }

  // Three sparse rows; each row is duplicated exactly 2x so the -50% marquee loop is seamless
  const rowCount = 3;
  const perRow = 12;
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const slice = thumbnailFiles.slice(i * perRow, (i + 1) * perRow);
    return [...slice, ...slice];
  }).filter((row) => row.length > 0);

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* Dynamic Embedded Premium Styles */}
      <style>{`
        .hero-title {
          font-size: 48px;
          line-height: 1.25;
          margin-bottom: 20px;
          color: var(--colors-ink);
          letter-spacing: -0.03em;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 34px;
          }
        }
        .roadmap-card {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 220px;
          background-color: var(--colors-surface-card);
          border: 1px solid var(--colors-hairline);
          border-radius: var(--rounded-lg);
          padding: 24px;
          transition: all var(--transition-normal);
          box-shadow: 0 4px 12px rgba(20, 20, 19, 0.01);
        }
        .roadmap-card:hover {
          transform: translateY(-6px);
          border-color: var(--colors-primary);
          box-shadow: 0 12px 36px color-mix(in srgb, var(--colors-primary) 10%, transparent);
        }
        /* Stretched link: the whole card is clickable while inner buttons stay above it */
        .card-stretched-link::after {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 1;
          border-radius: var(--rounded-lg);
        }
        .roadmap-card .roadmap-link-btn {
          position: relative;
          z-index: 2;
        }
        .card-thumb {
          width: calc(100% + 48px);
          margin: -24px -24px 16px -24px;
          aspect-ratio: 16 / 9;
          object-fit: cover;
          border-radius: var(--rounded-lg) var(--rounded-lg) 0 0;
          border-bottom: 1px solid var(--colors-hairline-soft);
          background-color: var(--colors-surface-soft);
          display: block;
        }
        .category-tab {
          padding: 8px 18px;
          border-radius: var(--rounded-pill);
          font-size: 13.5px;
          font-weight: 500;
          text-decoration: none;
          transition: all var(--transition-fast);
          border: 1px solid transparent;
          color: var(--colors-muted);
        }
        .category-tab:hover:not(.active) {
          color: var(--colors-ink);
          background-color: var(--colors-surface-soft);
        }
        .category-tab.active {
          color: var(--colors-primary);
          font-weight: 600;
          background-color: color-mix(in srgb, var(--colors-primary) 10%, transparent);
          border-color: color-mix(in srgb, var(--colors-primary) 35%, transparent);
        }

        /* Primary hero CTA: same flat coral button, one size up */
        .btn-hero {
          height: 48px;
          padding: 0 32px;
          font-size: 15px;
          gap: 8px;
        }

        /* Secondary hero CTAs: hairline outline, brand color only in the icon */
        .btn-ghost {
          height: 48px;
          padding: 0 24px;
          font-size: 15px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: var(--colors-canvas);
          color: var(--colors-ink);
          border: 1px solid var(--colors-hairline);
          border-radius: var(--rounded-md);
          transition: background-color var(--transition-fast);
        }
        .btn-ghost:hover {
          background-color: var(--colors-surface-soft);
        }
        .btn-ghost:active {
          background-color: var(--colors-surface-cream-strong);
        }

        /* Thumbnail Showcase Styles */
        .thumbnail-showcase-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          padding: 40px 0;
          display: flex;
          flex-direction: column;
          opacity: var(--marquee-opacity);
          pointer-events: none;
          z-index: 0;
          justify-content: space-evenly;
        }
        /* Cream scrim: keeps the center text zone readable while thumbnails stay vivid at the edges */
        .hero-scrim {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(
            ellipse 62% 58% at 50% 42%,
            var(--colors-canvas) 38%,
            color-mix(in srgb, var(--colors-canvas) 72%, transparent) 62%,
            transparent 82%
          );
        }
        @media (max-width: 768px) {
          .hero-scrim {
            background: radial-gradient(
              ellipse 135% 55% at 50% 42%,
              var(--colors-canvas) 42%,
              color-mix(in srgb, var(--colors-canvas) 72%, transparent) 66%,
              transparent 85%
            );
          }
        }
        .marquee-container {
          overflow: hidden;
          width: 100%;
          position: relative;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          gap: 16px;
          animation: marquee 90s linear infinite;
        }
        .marquee-track-reverse {
          display: flex;
          width: max-content;
          gap: 16px;
          animation: marquee-reverse 90s linear infinite;
        }
        .thumbnail-card {
          width: 200px;
          aspect-ratio: 16/9;
          border-radius: var(--rounded-md);
          overflow: hidden;
          border: 1px solid var(--colors-hairline);
          position: relative;
          background-color: var(--colors-surface-soft);
        }
        .thumbnail-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* Tone the loud YouTube colors down into the cream palette */
          filter: saturate(0.6);
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track,
          .marquee-track-reverse {
            animation: none;
          }
        }
      `}</style>

      {/* Centered Premium Hero Section with dot grid and central glow */}
      <section
        style={{
          padding: '100px 0 48px 0',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--colors-canvas)',
          backgroundImage: `
            radial-gradient(var(--colors-hairline) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          textAlign: 'center',
        }}
      >
        {/* Infinite Scrolling Thumbnail Cascade Showcase Behind Hero Content */}
        {thumbnailFiles.length > 0 && (
          <div className="thumbnail-showcase-container" aria-hidden="true">
            {rows.map((rowLoop, idx) => (
              <div key={`bg-row-${idx}`} className="marquee-container">
                <div className={idx % 2 === 0 ? "marquee-track" : "marquee-track-reverse"}>
                  {rowLoop.map((file, fileIdx) => (
                    <div key={`bg-row-${idx}-${file}-${fileIdx}`} className="thumbnail-card">
                      <img src={`/youtube_thumbnails/${encodeURIComponent(file)}`} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Readability scrim over the marquee */}
        <div className="hero-scrim" />

        {/* Central warm light orb background */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '800px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, var(--hero-orb) 0%, transparent 70%)`,
            filter: 'blur(90px)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            className="badge badge-coral"
            style={{ marginBottom: '24px', fontWeight: 600, letterSpacing: '0.02em' }}
          >
            ✦ {totalLectures}편의 무료 강의를 순서대로 엮은 친절한 배움터
          </span>

          <h1 className="serif-display hero-title" style={{ maxWidth: '900px', margin: '0 auto 20px auto' }}>
            어떤 것부터 공부할지 모르겠다면? <br />
            <span style={{ color: 'var(--colors-primary)' }}>저와 함께 로드맵으로 시작해보세요!</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--colors-body)',
              lineHeight: 1.65,
              fontWeight: 400,
              marginBottom: '32px',
              maxWidth: '740px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            무료 유튜브 강의를 입문자의 눈높이에 맞춰 난이도와 흐름대로 정리한 로드맵으로 누구나 쉽게
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#roadmap-list"
              className="btn btn-primary btn-hero"
            >
              무료 로드맵 시작하기 <ArrowRight size={17} />
            </a>
            <a
              href="https://www.youtube.com/@editorp89"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <CirclePlay size={18} color="#FF0033" /> 유튜브 채널
            </a>
            <a
              href="https://open.kakao.com/o/ggK7EAJh"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              <MessageCircle size={17} color="#E6CF00" fill="#FEE500" /> 오픈카톡방
            </a>
          </div>

          {/* Integrated Centered Image with smooth drop shadow glow */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '440px', marginTop: '32px', marginBottom: '10px' }}>
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120%',
                height: '100%',
                background: 'radial-gradient(circle, color-mix(in srgb, var(--colors-primary) 12%, transparent) 0%, transparent 65%)',
                filter: 'blur(40px)',
                zIndex: 0,
                pointerEvents: 'none',
              }}
            />
            <img
              src="/hero.png"
              alt="AI & 에이전트 로드맵 히어로"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 20px 40px color-mix(in srgb, var(--colors-primary) 12%, transparent))',
              }}
            />
          </div>
        </div>
      </section>



      {/* Category selector & roadmap grid - Primary Focus */}
      <section id="roadmap-list" style={{ padding: '60px 0 var(--spacing-lg) 0', borderTop: '1px solid var(--colors-hairline-soft)' }}>
        <div className="container">
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '36px',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/#roadmap-list"
              className={`category-tab${!cat ? ' active' : ''}`}
            >
              전체 로드맵
            </Link>
            {data.categories.map((category) => {
              const isActive = cat?.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={category}
                  href={`/?cat=${encodeURIComponent(category)}#roadmap-list`}
                  className={`category-tab${isActive ? ' active' : ''}`}
                >
                  {category}
                </Link>
              );
            })}
          </div>

          {/* Roadmaps Grid */}
          {filteredRoadmaps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', border: '1px dashed var(--colors-hairline)', borderRadius: 'var(--rounded-lg)' }}>
              <p style={{ color: 'var(--colors-muted)', margin: '0 0 16px 0' }}>
                {cat ? `'${cat}' 카테고리에 등록된 로드맵이 아직 없습니다.` : '등록된 로드맵이 없습니다.'}
              </p>
              {cat && (
                <Link href="/#roadmap-list" className="btn" style={{ border: '1px solid var(--colors-hairline)', fontSize: '13px' }}>
                  전체 로드맵 보기
                </Link>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredRoadmaps.map((roadmap) => {
                const difficultyCounts = { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0 };
                roadmap.nodes?.forEach((n) => {
                  difficultyCounts[n.difficulty] += 1;
                });
                const difficultyMeta = [
                  { key: 'BEGINNER' as const, label: '초급', color: '#5db8a6' },
                  { key: 'INTERMEDIATE' as const, label: '중급', color: '#e8a55a' },
                  { key: 'ADVANCED' as const, label: '고급', color: '#c64545' },
                ].filter((d) => difficultyCounts[d.key] > 0);

                return (
                <div key={roadmap.id} className="roadmap-card">
                  {roadmap.nodes?.[0]?.youtubeId && (
                    <img
                      className="card-thumb"
                      src={`https://i.ytimg.com/vi/${roadmap.nodes[0].youtubeId}/hqdefault.jpg`}
                      alt={`${roadmap.title} 첫 강의 섬네일`}
                      loading="lazy"
                    />
                  )}
                  <div style={{ flex: 1, marginBottom: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      <span className="badge badge-cream" style={{ fontSize: '11px', fontWeight: 600 }}>
                        {roadmap.category}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--colors-muted-soft)', fontWeight: 500 }}>
                        총 {roadmap.nodes?.length || 0}개 강의 구성
                      </span>
                    </div>
                    <h3
                      className="serif-display"
                      style={{
                        fontSize: '22px',
                        marginBottom: '10px',
                        color: 'var(--colors-ink)',
                        fontWeight: 600,
                      }}
                    >
                      {roadmap.title}
                    </h3>
                    <RoadmapDescription description={roadmap.description} isCompact={true} />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid var(--colors-hairline-soft)',
                      paddingTop: '16px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--colors-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: 500,
                      }}
                    >
                      {difficultyMeta.map((d) => (
                        <span key={d.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: d.color,
                              display: 'inline-block',
                            }}
                          />
                          {d.label} {difficultyCounts[d.key]}
                        </span>
                      ))}
                    </span>
                    <Link href={`/roadmaps/${roadmap.id}`} className="btn btn-primary card-stretched-link" style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      로드맵 보기 <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
