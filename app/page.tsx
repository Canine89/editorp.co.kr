import Image from "next/image";
import Link from "next/link";
import { getRoadmapData } from "@/lib/roadmap-data";
import { youtubeChannel, asRoadmap, type LearningPath } from "@/lib/learning-paths";
import { countEditedBooks, getEditedBooksData } from "@/lib/edited-books";
import { getLearningPaths, learningMinutes } from "@/lib/learning-data";
import { getAuthoredBooks } from "@/lib/editorial-content";
import { listBooks, flattenSections, sectionLabel } from "@/lib/books";
import { lessonTitle } from "@/lib/video-presentation";
import profile from "@/data/profile.json";
import { Character } from "@/components/Character";
import { ResumeBar } from "@/components/ResumeBar";
import { AuthoredBooks, FreeBooks, JoinedBooks } from "@/components/Library";
import styles from "./page.module.css";

export const revalidate = 0;

const seconds = (duration?: string) =>
  duration ? duration.split(":").reduce((n, p) => n * 60 + Number(p), 0) : 0;

export default async function HomePage() {
  const data = await getRoadmapData();
  const paths = await getLearningPaths(data);
  const managed = data.roadmaps.filter((r) => r.isActive !== false && !r.curation);
  const books = (await listBooks()).filter((b) => b.id !== "free-book-guide");
  const bookCount = countEditedBooks(getEditedBooksData());
  const authoredCount = getAuthoredBooks().length;
  const publishers = getEditedBooksData().publishers.map((p) => p.name).sort().join("과 ");
  const lectures = profile.lectures;

  // 로드맵 흐름: 공통 기초 → 문서·업무 / 웹·앱 제작 → 심화 (옛 시작점 선택을 첫 줄로 흡수)
  const foundation = paths.find((p) => p.id === "ai-foundations");
  const advanced = paths.filter((p) => p.level === "심화" || p.topic === "에이전트 심화");
  const middle = paths.filter((p) => p !== foundation && !advanced.includes(p));
  const work = middle.filter((p) => p.topic === "업무 자동화");
  const build = middle.filter((p) => !work.includes(p));
  const firstVideo = foundation && youtubeChannel.videos.find((v) => v.id === foundation.lessons[0]?.id);

  // 이어보기·이어 읽기 한 줄
  const courses = [
    ...paths.map((path) => ({
      roadmap: data.roadmaps.find((r) => r.curation && r.id.replace(/^learn-/, "") === path.id) ?? asRoadmap(path),
      href: `/learn/${path.id}`,
    })),
    ...managed.map((roadmap) => ({ roadmap, href: `/roadmaps/${roadmap.id}` })),
  ].map(({ roadmap, href }) => ({
    id: roadmap.id,
    title: roadmap.title,
    href,
    nodes: roadmap.nodes.map((n) => ({ id: n.id, title: lessonTitle(n.youtubeId, n.title) })),
  }));
  const resumeBooks = books.map((b) => ({
    id: b.id,
    title: b.title,
    sections: flattenSections(b).map((f) => ({ id: f.section.id, title: sectionLabel(f) })),
  }));

  const latest = youtubeChannel.videos.slice(0, 4);
  const years: { year: string; items: typeof lectures }[] = [];
  for (const lecture of lectures.slice(0, 6)) {
    const year = lecture.date.slice(0, 4);
    if (years.at(-1)?.year !== year) years.push({ year, items: [] });
    years.at(-1)!.items.push(lecture);
  }
  const day = (date: string) =>
    date.replace(/^\d{4}-?/, "").replace(/^(\d{2})-(\d{2})/, "$1.$2");

  const pathRow = (p: LearningPath) => (
    <li key={p.id}>
      <Link className={styles.row} href={`/learn/${p.id}`}>
        <span className={styles.rowTitle}>{p.title}</span>
        <span className={styles.rowDesc}>{p.outcome}</span>
        <span className={styles.rowMeta}>
          {p.lessons.length}강{learningMinutes(p) !== null && ` · ${learningMinutes(p)}분`}
        </span>
      </Link>
    </li>
  );

  return (
    <div className={styles.page}>
      <ResumeBar courses={courses} books={resumeBooks} />
      <div className="container">
        <section className={styles.intro}>
          <div className="reveal">
            <h1 className={styles.name}>
              편집자P<span>박현규 · IT 도서 기획·편집자 · 커서 공식 앰배서더</span>
            </h1>
            <p className={styles.introText}>
              {publishers}에서 IT 책 <b className="mark">{bookCount}권</b>을 기획하고 편집했고, 그중 {authoredCount}권은 직접
              썼습니다. 책에 다 담지 못한 내용은 유튜브 강의로 풀고, 기업·학교·공공기관에서 AI 도구를 가르칩니다. 이곳에 그
              강의를 배울 순서대로 엮은 로드맵과 무료로 읽는 책, 제 이력을 모았습니다.
            </p>
          </div>
          <div className="reveal">
            <Character id="hero-wave" height={112} />
            <ul className={styles.pillars} aria-label="바로가기">
              <li>
                <a href="#roadmap">
                  <b>로드맵</b>
                  <span>
                    영상 강의를 배울 순서대로
                    <small>
                      추천 경로 {paths.length}개 · 책과 함께 보는 로드맵 {managed.length}개
                    </small>
                  </span>
                </a>
              </li>
              <li>
                <a href="#library">
                  <b>서재</b>
                  <span>
                    무료로 공개한 책을 브라우저에서 읽기
                    <small>
                      {books.length > 0
                        ? books.map((b) => `${b.title} ${flattenSections(b).length}절`).join(" · ")
                        : "공개 준비 중"}
                    </small>
                  </span>
                </a>
              </li>
              <li>
                <a href="#about">
                  <b>소개</b>
                  <span>
                    쓴 책, 만든 책, 강의 이력
                    <small>
                      직접 쓴 책 {authoredCount}권 · 참여한 책 {bookCount}권 · 강의 {lectures.length}건
                    </small>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section className={styles.sec} id="roadmap">
          <header className={styles.secHead}>
            <div>
              <h2>로드맵</h2>
              <p>공통 기초에서 시작해 만들고 싶은 것에 따라 갈라집니다.</p>
            </div>
            <Character id="roadmap-start" height={88} />
          </header>
          <div>
            <div className={`${styles.flow} flow reveal`}>
              {foundation && (
                <div className={`${styles.step} flow-step`}>
                  <p className={styles.kicker}>처음이라면 여기서</p>
                  <div className={styles.start}>
                    <h3>{foundation.title}</h3>
                    <p>{foundation.summary}</p>
                    <p className={styles.meta}>
                      {foundation.lessons.length}강
                      {learningMinutes(foundation) !== null && ` · 전체 ${learningMinutes(foundation)}분`}
                      {firstVideo?.duration && ` · 첫 강의 ${Math.ceil(seconds(firstVideo.duration) / 60)}분`}
                      {foundation.prerequisite && ` · ${foundation.prerequisite}`}
                    </p>
                    <Link className="btn btn-primary" href={`/learn/${foundation.id}`}>
                      첫 강의 보기
                    </Link>
                  </div>
                </div>
              )}
              {(work.length > 0 || build.length > 0) && (
                <div className={`${styles.step} flow-step`}>
                  <p className={styles.kicker}>기초 다음, 만들고 싶은 것에 따라</p>
                  <div className={styles.branches}>
                    {work.length > 0 && (
                      <div>
                        <div className={styles.perchRow}>
                          <div>
                            <h4>문서·업무</h4>
                            <p>반복되는 문서 작업을 AI에게 맡깁니다.</p>
                          </div>
                          <Character id="roadmap-docs" height={72} />
                        </div>
                        <ul className={styles.rows}>{work.map(pathRow)}</ul>
                      </div>
                    )}
                    {build.length > 0 && (
                      <div>
                        <div className={styles.perchRow}>
                          <div>
                            <h4>웹·앱 제작</h4>
                            <p>작은 웹사이트와 프로그램을 직접 만듭니다.</p>
                          </div>
                          <Character id="roadmap-build" height={72} />
                        </div>
                        <ul className={styles.rows}>{build.map(pathRow)}</ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {advanced.length > 0 && (
                <div className={`${styles.step} flow-step`}>
                  <div className={styles.perchRow}>
                    <p className={styles.kicker}>심화</p>
                    <Character id="roadmap-advanced" height={72} />
                  </div>
                  <ul className={`${styles.rows} ${styles.wide}`}>{advanced.map(pathRow)}</ul>
                </div>
              )}
            </div>

            {managed.length > 0 && (
              <>
                <h3 className={styles.subHead}>책과 함께 보는 로드맵</h3>
                <ul className={`${styles.rows} ${styles.wide} ${styles.twoCol} reveal`}>
                  {managed.map((r) => (
                    <li key={r.id}>
                      <Link className={styles.row} href={`/roadmaps/${r.id}`}>
                        <span className={styles.rowTitle}>{r.title}</span>
                        <span className={styles.rowMeta}>
                          {r.category} · {r.nodes.length}강
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3 className={styles.subHead}>
              최근 영상
              <Link className={styles.more} href="/videos">
                영상 {youtubeChannel.videos.length}편 검색
              </Link>
            </h3>
            <div className={`${styles.videos} reveal`}>
              {latest.map((video) => (
                <a key={video.id} className={styles.video} href={video.url} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={`/learning/${video.id}.jpg`}
                    alt=""
                    width={480}
                    height={270}
                    sizes="(max-width:520px) 90vw, (max-width:960px) 45vw, 230px"
                  />
                  <h4>{lessonTitle(video.id, video.title)}</h4>
                  <span>{video.duration}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.sec} id="library">
          <header className={styles.secHead}>
            <div>
              <h2>서재</h2>
              <p>무료로 공개한 책입니다. 브라우저에서 바로 읽고, 읽은 곳은 이 브라우저에 기억됩니다.</p>
            </div>
            <Character id="library-books" height={88} />
          </header>
          <div>
            <FreeBooks books={books} />
          </div>
        </section>

        <section className={styles.sec} id="about">
          <header className={styles.secHead}>
            <div>
              <h2>소개</h2>
              <p>책을 쓰고 기획하고, 그 내용을 강의합니다.</p>
            </div>
            <Link className={styles.more} href="/about">
              프로필 전체
            </Link>
            <Character id="about-lecture" height={88} />
          </header>
          <div>
            <AuthoredBooks />
            <JoinedBooks limit={10} />
            <h3 className={styles.subHead}>
              최근 강의
              <Link className={styles.more} href="/about#lectures">
                전체 {lectures.length}건
              </Link>
            </h3>
            <table className={`${styles.lectures} reveal`}>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>강의</th>
                  <th>기관</th>
                </tr>
              </thead>
              <tbody>
                {years.map((group) => [
                  <tr key={group.year} className={styles.year}>
                    <td colSpan={3}>{group.year}</td>
                  </tr>,
                  ...group.items.map((lecture) => (
                    <tr key={lecture.date + lecture.title}>
                      <td>{day(lecture.date)}</td>
                      <td>{lecture.title}</td>
                      <td>{lecture.org}</td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
            <div className={styles.contact}>
              <Character id="contact-letter" height={64} align="left" />
              <a className="btn btn-primary" href="mailto:hgpark@goldenrabbit.co.kr">
                강의·협업 문의
              </a>
              <span>hgpark@goldenrabbit.co.kr · 기업·학교·공공기관 강의</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
