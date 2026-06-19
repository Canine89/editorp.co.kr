import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { YouTubeIcon, KakaoTalkIcon } from '@/components/BrandIcons';
import { RoadmapDescription } from '@/components/RoadmapDescription';
import { getRoadmapData } from '@/lib/roadmap-data';
import styles from './page.module.css';

export const revalidate = 0; // Disable caching to fetch fresh commits on page load

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const data = await getRoadmapData();
  const activeRoadmaps = data.roadmaps.filter((r) => r.isActive !== false);
  const totalLectures = activeRoadmaps.reduce((sum, r) => sum + (r.nodes?.length || 0), 0);
  const totalRoadmaps = activeRoadmaps.length;

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
    <div className={styles.pageShell}>
      <section className={styles.hero}>
        {thumbnailFiles.length > 0 && (
          <div className={styles.thumbnailShowcase} aria-hidden="true">
            {rows.map((rowLoop, idx) => (
              <div key={`bg-row-${idx}`} className={styles.marqueeContainer}>
                <div className={idx % 2 === 0 ? styles.marqueeTrack : styles.marqueeTrackReverse}>
                  {rowLoop.map((file, fileIdx) => (
                    <div key={`bg-row-${idx}-${file}-${fileIdx}`} className={styles.thumbnailCard}>
                      <img src={`/youtube_thumbnails/${encodeURIComponent(file)}`} alt="" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.heroScrim} />

        <div className={`container ${styles.heroInner}`}>
          <span className={styles.heroBadge}>
            ✦ {totalLectures}편의 무료 강의를 순서대로 엮은 친절한 배움터
          </span>

          <h1 className={styles.heroTitle}>
            어떤 것부터 공부할지 모르겠다면? <br />
            <span>로드맵으로 바로 시작하세요</span>
          </h1>

          <p className={styles.heroLead}>
            무료 유튜브 강의를 입문자의 눈높이에 맞춰 난이도와 흐름대로 정리했습니다.
            지금 단계에 맞는 로드맵을 골라 차례대로 따라오세요.
          </p>

          <div className={styles.heroActions}>
            <a
              href="#roadmap-list"
              className={`btn btn-primary ${styles.heroPrimary}`}
            >
              내 로드맵 고르기 <ArrowRight size={17} />
            </a>
            <a
              href="https://www.youtube.com/@editorp89"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroSecondary}
            >
              <YouTubeIcon size={18} /> 유튜브 채널
            </a>
            <a
              href="https://open.kakao.com/o/ggK7EAJh"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.heroSecondary}
            >
              <KakaoTalkIcon size={16} /> 오픈카톡방
            </a>
          </div>

          <div className={styles.heroVisual}>
            <img
              src="/hero.png"
              alt="AI & 에이전트 로드맵 히어로"
            />
          </div>
        </div>
      </section>

      <section className={styles.guideSection} aria-label="학습 진행 방식">
        <div className={`container ${styles.guideInner}`}>
          <div className={styles.guideIntro}>
            <p className={styles.sectionKicker}>how to start</p>
            <h2 className={styles.guideTitle}>많은 강의 중에서 지금 볼 것만 남겼습니다</h2>
            <p className={styles.guideLead}>
              도구 이름을 먼저 외우기보다, 지금 막힌 지점에 맞는 순서로 따라가게 구성했습니다.
            </p>
          </div>
          <div className={styles.guideGrid}>
            <div className={styles.guideCard}>
              <span className={styles.guideNumber}>01</span>
              <h3>카테고리 선택</h3>
              <p>AI 기초, 에이전트, 바이브 코딩 중 지금 필요한 주제만 좁혀 봅니다.</p>
            </div>
            <div className={styles.guideCard}>
              <span className={styles.guideNumber}>02</span>
              <h3>첫 강의부터 보기</h3>
              <p>로드맵 안에서는 쉬운 개념부터 실습까지 이어지도록 순서를 맞췄습니다.</p>
            </div>
            <div className={styles.guideCard}>
              <span className={styles.guideNumber}>03</span>
              <h3>막히면 질문하기</h3>
              <p>질문 게시판과 오픈카톡방을 통해 중간에 멈추지 않게 이어갑니다.</p>
            </div>
          </div>
          <div className={styles.guideStats} aria-label="로드맵 구성 요약">
            <div>
              <strong>{totalRoadmaps}</strong>
              <span>로드맵</span>
            </div>
            <div>
              <strong>{totalLectures}</strong>
              <span>무료 강의</span>
            </div>
            <div>
              <strong>{data.categories.length}</strong>
              <span>카테고리</span>
            </div>
          </div>
        </div>
      </section>

      <section id="roadmap-list" className={styles.roadmapSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionKicker}>roadmaps</p>
              <h2 className={styles.sectionTitle}>지금 볼 로드맵을 고르세요</h2>
            </div>
            <p className={styles.sectionDescription}>
              카테고리를 좁히고, 첫 강의부터 순서대로 보면 됩니다.
            </p>
          </div>

          <div className={styles.categoryTabs} aria-label="로드맵 카테고리">
            <Link
              href="/#roadmap-list"
              className={`${styles.categoryTab} ${!cat ? styles.categoryTabActive : ''}`}
            >
              전체 로드맵
            </Link>
            {data.categories.map((category) => {
              const isActive = cat?.toLowerCase() === category.toLowerCase();
              return (
                <Link
                  key={category}
                  href={`/?cat=${encodeURIComponent(category)}#roadmap-list`}
                  className={`${styles.categoryTab} ${isActive ? styles.categoryTabActive : ''}`}
                >
                  {category}
                </Link>
              );
            })}
          </div>

          {filteredRoadmaps.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                {cat ? `'${cat}' 카테고리에 등록된 로드맵이 아직 없습니다.` : '등록된 로드맵이 없습니다.'}
              </p>
              {cat && (
                <Link href="/#roadmap-list" className="btn btn-secondary">
                  전체 로드맵 보기
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.roadmapGrid}>
              {filteredRoadmaps.map((roadmap) => {
                return (
                <article key={roadmap.id} className={styles.roadmapCard}>
                  {roadmap.nodes?.[0]?.youtubeId && (
                    <img
                      className={styles.cardThumb}
                      src={`https://i.ytimg.com/vi/${roadmap.nodes[0].youtubeId}/hqdefault.jpg`}
                      alt={`${roadmap.title} 첫 강의 섬네일`}
                      loading="lazy"
                    />
                  )}
                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardCategory}>
                        {roadmap.category}
                      </span>
                      <span className={styles.cardCount}>
                        총 {roadmap.nodes?.length || 0}개 강의 구성
                      </span>
                    </div>
                    <h3 className={styles.cardTitle}>
                      {roadmap.title}
                    </h3>
                    <RoadmapDescription description={roadmap.description} isCompact={true} showLinks={false} />
                  </div>

                  <div className={styles.cardFooter}>
                    <Link href={`/roadmaps/${roadmap.id}`} className={`btn btn-primary ${styles.cardLink}`}>
                      로드맵 보기 <ArrowRight size={14} />
                    </Link>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
