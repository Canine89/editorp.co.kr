import fs from 'fs';
import path from 'path';
import Link from 'next/link';
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

  // Split thumbnails into six rows to create a dense background wall covering the full height
  const rowCount = 6;
  const segmentLength = Math.ceil(thumbnailFiles.length / rowCount);
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const start = i * segmentLength;
    const slice = thumbnailFiles.slice(start, start + segmentLength);
    // Duplicate rows for infinite scroll loop
    return [...slice, ...slice].slice(0, 25);
  });

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
          box-shadow: 0 12px 36px rgba(204, 120, 92, 0.08);
        }
        .category-tab {
          padding: 8px 18px;
          border-radius: var(--rounded-pill);
          font-size: 13.5px;
          font-weight: 500;
          text-decoration: none;
          transition: all var(--transition-fast);
          border: 1px solid transparent;
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
          gap: 16px;
          opacity: 0.16;
          pointer-events: none;
          z-index: 0;
          justify-content: center;
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
          animation: marquee 50s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .marquee-track-reverse {
          display: flex;
          width: max-content;
          gap: 16px;
          animation: marquee-reverse 50s linear infinite;
        }
        .marquee-track-reverse:hover {
          animation-play-state: paused;
        }
        .thumbnail-card {
          width: 200px;
          aspect-ratio: 16/9;
          border-radius: var(--rounded-md);
          overflow: hidden;
          border: 1px solid var(--colors-hairline);
          box-shadow: 0 4px 10px rgba(20, 20, 19, 0.04);
          transition: all var(--transition-normal);
          position: relative;
          background-color: var(--colors-surface-soft);
        }
        .thumbnail-card:hover {
          transform: scale(1.06) translateY(-4px);
          border-color: var(--colors-primary);
          box-shadow: 0 10px 20px rgba(204, 120, 92, 0.15);
          z-index: 10;
        }
        .thumbnail-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        /* Stats Section */
        .stats-badge-container {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 36px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        .stats-badge {
          background-color: var(--colors-surface-soft);
          border: 1px solid var(--colors-hairline-soft);
          padding: 12px 24px;
          border-radius: var(--rounded-lg);
          text-align: center;
          min-width: 160px;
          transition: all var(--transition-normal);
        }
        .stats-badge:hover {
          border-color: var(--colors-primary);
          background-color: var(--colors-canvas);
          transform: translateY(-2px);
        }
        .stats-num {
          font-size: 26px;
          font-weight: 700;
          color: var(--colors-primary);
          font-family: var(--font-sans);
        }
        .stats-label {
          font-size: 12.5px;
          color: var(--colors-muted);
          margin-top: 4px;
          font-weight: 500;
        }
        .hero-readable-text {
          text-shadow:
            0 2px 8px rgba(250, 247, 242, 0.88),
            0 12px 26px rgba(20, 20, 19, 0.24),
            0 20px 44px rgba(20, 20, 19, 0.16);
        }
        .hero-body-copy {
          text-shadow:
            0 2px 6px rgba(250, 247, 242, 0.92),
            0 8px 18px rgba(20, 20, 19, 0.22),
            0 16px 32px rgba(20, 20, 19, 0.14);
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
          <div className="thumbnail-showcase-container">
            {rows.map((rowLoop, idx) => (
              <div key={`bg-row-${idx}`} className="marquee-container">
                <div className={idx % 2 === 0 ? "marquee-track" : "marquee-track-reverse"}>
                  {rowLoop.map((file, fileIdx) => (
                    <div key={`bg-row-${idx}-${file}-${fileIdx}`} className="thumbnail-card">
                      <img src={`/youtube_thumbnails/${encodeURIComponent(file)}`} alt="유튜브 강의 섬네일" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

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
            background: 'radial-gradient(circle, rgba(244, 219, 208, 0.5) 0%, rgba(244, 219, 208, 0) 70%)',
            filter: 'blur(90px)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            className="badge badge-coral"
            style={{ marginBottom: '24px', fontWeight: 600, letterSpacing: '0.02em', boxShadow: '0 2px 8px rgba(204, 120, 92, 0.08)' }}
          >
            ✦ 220여 편의 무료 강의를 순서대로 엮은 친절한 배움터
          </span>

          <h1 className="serif-display hero-title hero-readable-text" style={{ maxWidth: '900px', margin: '0 auto 20px auto' }}>
            어떤 것부터 공부할지 모르겠다면? <br />
            <span style={{ position: 'relative', color: 'var(--colors-primary)', display: 'inline-block' }}>
              저와 함께 로드맵으로 시작해보세요!
              <span style={{
                position: 'absolute',
                bottom: '8px',
                left: 0,
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(204, 120, 92, 0.15)',
                borderRadius: '4px',
                zIndex: -1
              }} />
            </span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--colors-body)',
              lineHeight: 1.65,
              fontWeight: 500,
              marginBottom: '32px',
              maxWidth: '740px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <span className="hero-body-copy">
              무료 유튜브 강의를 입문자의 눈높이에 맞춰 난이도와 흐름대로 정리한 로드맵으로 누구나 쉽게
            </span>
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#roadmap-list"
              className="btn btn-primary"
              style={{ height: '48px', padding: '0 32px', fontSize: '15px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(204, 120, 92, 0.15)' }}
            >
              무료 로드맵 시작하기 ➔
            </a>
            <a
              href="https://www.youtube.com/@editorp89"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                height: '48px',
                padding: '0 28px',
                fontSize: '15px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FF0033',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: '0 5px 16px rgba(255, 0, 51, 0.22)',
              }}
            >
              유튜브 채널 이동하기
            </a>
            <a
              href="https://open.kakao.com/o/ggK7EAJh"
              target="_blank"
              rel="noopener noreferrer"
              className="btn"
              style={{
                height: '48px',
                padding: '0 28px',
                fontSize: '15px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FEE500',
                color: '#191919',
                border: '1px solid rgba(25, 25, 25, 0.12)',
                boxShadow: '0 5px 16px rgba(25, 25, 25, 0.14)',
              }}
            >
              오픈카톡방 이동하기
            </a>
          </div>

          {/* Integrated Centered Image with smooth drop shadow glow */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '520px', marginTop: '40px', marginBottom: '10px' }}>
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(204, 120, 92, 0.12) 0%, rgba(204, 120, 92, 0) 65%)',
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
                filter: 'drop-shadow(0 20px 40px rgba(204, 120, 92, 0.12))',
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
              href="/"
              className="category-tab"
              style={{
                backgroundColor: !cat ? 'var(--colors-surface-card)' : 'transparent',
                color: !cat ? 'var(--colors-ink)' : 'var(--colors-muted)',
                borderColor: !cat ? 'var(--colors-hairline)' : 'transparent',
              }}
            >
              전체 로드맵
            </Link>
            {data.categories.map((category) => {
              const isActive = cat?.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={category}
                  href={`/?cat=${encodeURIComponent(category)}`}
                  className="category-tab"
                  style={{
                    backgroundColor: isActive ? 'var(--colors-surface-card)' : 'transparent',
                    color: isActive ? 'var(--colors-ink)' : 'var(--colors-muted)',
                    borderColor: isActive ? 'var(--colors-hairline)' : 'transparent',
                  }}
                >
                  {category}
                </Link>
              );
            })}
          </div>

          {/* Roadmaps Grid */}
          {filteredRoadmaps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', border: '1px dashed var(--colors-hairline)', borderRadius: 'var(--rounded-lg)' }}>
              <p style={{ color: 'var(--colors-muted)', margin: 0 }}>등록된 로드맵이 없습니다.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '24px',
              }}
            >
              {filteredRoadmaps.map((roadmap) => (
                <div key={roadmap.id} className="roadmap-card">
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
                        gap: '4px',
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ color: 'var(--colors-primary)' }}>✦</span> 무료 강의 로드맵
                    </span>
                    <Link href={`/roadmaps/${roadmap.id}`} className="btn btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      로드맵 보기 ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
