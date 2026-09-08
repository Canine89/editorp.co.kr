import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { getRoadmapData } from "@/lib/roadmap-data";
import { youtubeChannel, asRoadmap } from "@/lib/learning-paths";
import { countEditedBooks, getEditedBooksData } from "@/lib/edited-books";
import { getLearningPaths, learningMinutes } from "@/lib/learning-data";
import { getLectureHighlights } from "@/lib/editorial-content";
import { PathExplorer } from "@/components/PathExplorer";
import { QuickStart } from "@/components/QuickStart";
import { ContinueLearning } from "@/components/ContinueLearning";
import { lessonTitle } from "@/lib/video-presentation";
import { BookShelf } from "@/components/FeaturedBooks";
import styles from "./page.module.css";
export const revalidate = 0;
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string; view?: string }>;
}) {
  const { cat, view } = await searchParams;
  const data = await getRoadmapData();
  const paths = await getLearningPaths(data);
  const active = data.roadmaps.filter(
    (r) => r.isActive !== false && !r.curation,
  );
  const filtered = active.filter(
    (r) => !cat || r.category.toLowerCase() === cat.toLowerCase(),
  );
  const categories = data.categories.filter((category) =>
    active.some((r) => r.category === category),
  );
  const summaries = paths.map(({ lessons, ...path }) => {
    const video = youtubeChannel.videos.find((v) => v.id === lessons[0]?.id);
    return {
      ...path,
      lessonCount: lessons.length,
      minutes: learningMinutes({ ...path, lessons }),
      firstMinutes: video?.duration
        ? Math.ceil(
            video.duration.split(":").reduce((n, p) => n * 60 + Number(p), 0) /
              60,
          )
        : null,
      firstGoal: lessons[0]?.goal ?? path.outcome,
    };
  });
  const courses = [
    ...paths.map((path) => ({
      roadmap:
        data.roadmaps.find(
          (r) => r.curation && r.id.replace(/^learn-/, "") === path.id,
        ) ?? asRoadmap(path),
      href: `/learn/${path.id}`,
    })),
    ...active.map((roadmap) => ({ roadmap, href: `/roadmaps/${roadmap.id}` })),
  ].map(({ roadmap, href }) => ({
    id: roadmap.id,
    title: roadmap.title,
    href,
    nodes: roadmap.nodes.map((n) => ({
      id: n.id,
      title: lessonTitle(n.youtubeId, n.title),
    })),
  }));
  return (
    <div className={styles.page}>
      <div className="container">
        <ContinueLearning courses={courses} />
      </div>
      <section className={`container ${styles.hero}`}>
        <div>
          <Link href="/about" className={styles.author}>
            <Image src="/p.png" alt="" width={42} height={42} />
            <span>
              <strong>편집자P, 박현규</strong>
              <small>IT 도서 기획·편집자 / 커서 공식 앰배서더</small>
            </span>
            <ArrowUpRight size={17} />
          </Link>
          <h1>
            지금 필요한 AI,
            <br />
            <span>어디서부터 배울까요?</span>
          </h1>
          <p>
            책을 만들며 쌓은 경험을 무료 강의와 실습으로 나눕니다.
            <br />
            기초를 이해하고, 내 문서와 웹사이트를 직접 만들어보세요.
          </p>
          <div className={styles.actions}>
            <a href="#quick-start" className="btn btn-primary">
              나에게 맞는 시작점 찾기{" "}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#roadmap-list" className={styles.textLink}>
              전체 학습 경로 <ArrowDownLabel />
            </a>
          </div>
          <p className={styles.heroNote}>
            회원가입 없이 바로 시작할 수 있습니다.
          </p>
        </div>
        <QuickStart paths={summaries} />
      </section>
      <section
        className={`container ${styles.experience}`}
        aria-label="편집자P의 책과 강의 경력"
      >
        <div>
          <strong>
            {countEditedBooks(getEditedBooksData())}권의 책에 참여
          </strong>
          <span>기획·편집·집필 등 도서별 역할을 소개합니다.</span>
          <Link href="/about">
            프로필과 전체 이력 <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className={styles.experienceList}>
          {getLectureHighlights().map((item) => (
            <Link key={item.label} href="/about#lectures">
              <span>{item.label}</span>
              <strong>{item.org}</strong>
            </Link>
          ))}
        </div>
      </section>
      <section
        className={`container ${styles.authorShelf}`}
        aria-label="편집자P 대표 도서"
      >
        <div>
          <span>책을 만들고, 배움을 연결합니다.</span>
          <h2>
            직접 쓰고 기획한 책의 경험을
            <br />
            강의에 담았습니다.
          </h2>
          <Link href="/about">
            편집자P 소개와 강의 이력{" "}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <BookShelf />
      </section>
      <section id="roadmap-list" className={`container ${styles.pathSection}`}>
        <div className={styles.sectionHeader}>
          <h2>기초에서 시작해, 나의 결과물까지.</h2>
          <p>
            공통 기초를 익힌 뒤 목적에 맞는 갈래를 고르세요. 도구는 하나부터
            시작해도 충분합니다.
          </p>
        </div>
        <PathExplorer paths={summaries} initialFilter={view} />
      </section>
      <section
        id="book-roadmaps"
        className={`container ${styles.managedSection}`}
      >
        <div className={styles.sectionHeader}>
          <h2>책의 진도에 맞춰 배우고 싶다면.</h2>
          <p>도서 연계 강의와 편집자P가 관리하는 주제별 로드맵입니다.</p>
        </div>
        <div className={styles.managedTabs} aria-label="도서·주제별 로드맵">
          <Link href="/#book-roadmaps" aria-current={!cat ? "true" : undefined}>
            전체
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/?cat=${encodeURIComponent(category)}#book-roadmaps`}
              aria-current={cat === category ? "true" : undefined}
            >
              {category}
            </Link>
          ))}
        </div>
        <div className={styles.managedGrid}>
          {filtered.map((r) => (
            <Link
              key={r.id}
              href={`/roadmaps/${r.id}`}
              className={styles.managedCard}
            >
              <BookOpen size={21} />
              <div>
                <span>
                  {r.category} / {r.nodes.length}개 강의
                </span>
                <h3>{r.title}</h3>
              </div>
              <ArrowRight size={17} />
            </Link>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className={styles.empty}>
            이 조건의 로드맵은 아직 없습니다.{" "}
            <Link href="/#book-roadmaps">전체 보기</Link>
          </p>
        )}
        <Link href="/books" className={styles.bookBanner}>
          <span>
            <strong>무료 도서로 기본기를 채워보세요.</strong>
            <small>파이썬 입문부터 브라우저에서 바로 읽을 수 있습니다.</small>
          </span>
          <ArrowRight size={19} />
        </Link>
      </section>
      <section className={`container ${styles.archiveSection}`}>
        <div className={styles.sectionHeader}>
          <h2>필요한 강의 한 편을 찾는다면.</h2>
          <p>
            영상 {youtubeChannel.videos.length}개와 재생목록{" "}
            {youtubeChannel.playlists.length}개를 주제별로 탐색하세요.
          </p>
        </div>
        <div className={styles.latestGrid}>
          {youtubeChannel.videos.slice(0, 4).map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.latestCard}
            >
              <div className={styles.latestImage}>
                <Image
                  src={`/learning/${video.id}.jpg`}
                  alt=""
                  fill
                  sizes="(max-width:640px) 90vw, (max-width:1000px) 44vw, 280px"
                />
              </div>
              <div className={styles.latestMeta}>
                <span>{video.kind}</span>
                <span>{video.duration}</span>
              </div>
              <h3>{video.title.replace(/^\[시즌 3\]\s*/, "")}</h3>
            </a>
          ))}
        </div>
        <Link href="/videos" className="btn btn-secondary">
          전체 영상 검색 <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
function ArrowDownLabel() {
  return <span aria-hidden="true">↓</span>;
}
