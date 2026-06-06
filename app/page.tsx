import fs from 'fs';
import path from 'path';
import Link from 'next/link';

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

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* Dynamic Embedded Premium Styles */}
      <style>{`
        .hero-title {
          font-size: 44px;
          line-height: 1.2;
          margin-bottom: 16px;
          color: var(--colors-ink);
          letter-spacing: -0.03em;
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 32px;
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
      `}</style>

      {/* Centered Premium Hero Section with dot grid and central glow */}
      <section
        style={{
          padding: '100px 0 60px 0',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'var(--colors-canvas)',
          backgroundImage: `
            radial-gradient(var(--colors-hairline) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          borderBottom: '1px solid var(--colors-hairline-soft)',
          textAlign: 'center',
        }}
      >
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
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span
            className="badge badge-coral"
            style={{ marginBottom: '24px', fontWeight: 600, letterSpacing: '0.02em', boxShadow: '0 2px 8px rgba(204, 120, 92, 0.08)' }}
          >
            ✦ 100% 무료 유튜브 시각화 코스
          </span>
          
          <h1 className="serif-display hero-title" style={{ maxWidth: '800px', margin: '0 auto 20px auto' }}>
            어떤 영상부터 볼지 <br />
            더 이상 <span style={{ position: 'relative', color: 'var(--colors-primary)', display: 'inline-block' }}>
              헤매지 마세요
              <span style={{
                position: 'absolute',
                bottom: '10px',
                left: 0,
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--colors-primary-soft)',
                opacity: 0.35,
                borderRadius: '4px',
                zIndex: -1
              }} />
            </span>.
          </h1>
          
          <p
            style={{
              fontSize: '18px',
              color: 'var(--colors-body)',
              lineHeight: 1.65,
              marginBottom: '36px',
              maxWidth: '640px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            AI 에이전트 개발부터 노코드 & 바이브 코딩 실전 강의까지, 편집자P의 모든 유튜브 강의를 한눈에 알아볼 수 있는 roadmap.sh 비주얼 로드맵으로 정주행하세요.
          </p>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
            <a
              href="#roadmap-list"
              className="btn btn-primary"
              style={{ height: '48px', padding: '0 32px', fontSize: '15px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(204, 120, 92, 0.15)' }}
            >
              무료 로드맵 시작하기 ➔
            </a>
            <a
              href="https://www.youtube.com/@editorp89"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ height: '48px', padding: '0 32px', fontSize: '15px', fontWeight: 500 }}
            >
              유튜브 채널 구독하기
            </a>
          </div>

          {/* Integrated Centered Image with smooth drop shadow glow */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '560px', marginTop: '10px' }}>
            <div
              style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(204, 120, 92, 0.15) 0%, rgba(204, 120, 92, 0) 65%)',
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
      <section id="roadmap-list" style={{ padding: '48px 0 var(--spacing-lg) 0' }}>
        <div className="container">
          {/* Category Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '32px',
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
              전체 코스
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
              <p style={{ color: 'var(--colors-muted)', margin: 0 }}>등록된 로드맵 코스가 없습니다.</p>
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
                    <p
                      style={{
                        fontSize: '13.5px',
                        color: 'var(--colors-body)',
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      {roadmap.description}
                    </p>
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
                      <span style={{ color: 'var(--colors-primary)' }}>✦</span> 무료 정주행
                    </span>
                    <Link href={`/roadmaps/${roadmap.id}`} className="btn btn-primary" style={{ height: '36px', padding: '0 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      입장하기 ➔
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
