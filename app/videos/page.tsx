import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  ListVideo,
  Video,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { youtubeChannel } from "@/lib/learning-paths";
import { lessonTitle, searchText } from "@/lib/video-presentation";
import { getLearningPaths } from "@/lib/learning-data";
import { SearchFilters } from "@/components/SearchFilters";
import styles from "./videos.module.css";
export const metadata = {
  title: "전체 영상과 재생목록 | 편집자P",
  description:
    "편집자P의 유튜브 영상과 라이브를 주제별로 검색하고, 도서와 시즌별 재생목록을 찾아보세요.",
};
type Query = {
  q?: string;
  topic?: string;
  kind?: string;
  page?: string;
  view?: string;
};
export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const paths = await getLearningPaths();
  const query = await searchParams;
  const { q = "", topic = "", kind = "", view = "" } = query;
  const playlists = view === "playlists";
  const topics = [...new Set(youtubeChannel.videos.flatMap((v) => v.topics))];
  const results = youtubeChannel.videos.filter(
    (v) =>
      searchText(v.title).includes(searchText(q)) &&
      (!topic || v.topics.includes(topic)) &&
      (!kind || v.kind === kind),
  );
  const matchingPlaylists = youtubeChannel.playlists.filter((p) =>
    searchText(p.title).includes(searchText(q)),
  );
  const pageCount = Math.max(1, Math.ceil(results.length / 16));
  const page = Math.min(
    pageCount,
    Math.max(1, parseInt(query.page || "1", 10) || 1),
  );
  const link = (updates: Query) =>
    "/videos?" +
    new URLSearchParams({ q, topic, kind, view, ...updates }).toString();
  return (
    <div className={`container ${styles.page}`}>
      <Link href="/#roadmap-list" className={styles.back}>
        <ArrowLeft size={14} /> 학습 로드맵
      </Link>
      <header className="page-intro">
        <h1>전체 영상과 재생목록</h1>
        <p>찾고 있던 강의 한 편부터, 한 권의 책을 따라가는 재생목록까지.</p>
      </header>
      <div className={styles.tabs}>
        <Link
          href={link({ view: "", page: "1" })}
          scroll={false}
          aria-current={!playlists ? "page" : undefined}
        >
          <Video size={17} /> 전체 영상{" "}
          <span>{youtubeChannel.videos.length}</span>
        </Link>
        <Link
          href={link({ view: "playlists", page: "1" })}
          scroll={false}
          aria-current={playlists ? "page" : undefined}
        >
          <ListVideo size={17} /> 재생목록{" "}
          <span>{youtubeChannel.playlists.length}</span>
        </Link>
      </div>
      <SearchFilters
        action="/videos"
        query={q}
        hidden={playlists ? { view: "playlists" } : {}}
        placeholder="예: 클로드, 한글 문서, 웹사이트…"
        filters={
          playlists
            ? []
            : [
                {
                  name: "topic",
                  label: "주제",
                  value: topic,
                  options: [
                    { value: "", label: "모든 주제" },
                    ...topics.map((t) => ({ value: t, label: t })),
                  ],
                },
                {
                  name: "kind",
                  label: "영상 형식",
                  value: kind,
                  options: [
                    { value: "", label: "영상 + 라이브" },
                    { value: "영상", label: "영상" },
                    { value: "라이브", label: "라이브" },
                  ],
                },
              ]
        }
      />
      {(q || (!playlists && (topic || kind))) && (
        <div className={styles.applied} aria-label="적용한 검색 조건">
          <span>적용 조건</span>
          {q && (
            <Link
              href={link({ q: "", page: "1" })}
              scroll={false}
              aria-label={`검색어 ${q} 해제`}
            >
              {q} ×
            </Link>
          )}
          {!playlists && topic && (
            <Link
              href={link({ topic: "", page: "1" })}
              scroll={false}
              aria-label={`주제 ${topic} 해제`}
            >
              {topic} ×
            </Link>
          )}
          {!playlists && kind && (
            <Link
              href={link({ kind: "", page: "1" })}
              scroll={false}
              aria-label={`형식 ${kind} 해제`}
            >
              {kind} ×
            </Link>
          )}
          <Link
            href={playlists ? "/videos?view=playlists" : "/videos"}
            scroll={false}
          >
            초기화
          </Link>
        </div>
      )}
      <div
        className={styles.resultLine}
        role="status"
        id="search-results-status"
        tabIndex={-1}
      >
        <p>
          {q && <strong>‘{q}’ </strong>}
          {playlists ? matchingPlaylists.length : results.length}개{" "}
          {playlists ? "재생목록" : "영상"}
        </p>
        <span>2026. 09. 05. 채널 확인 기준</span>
      </div>
      {playlists ? (
        <div className={styles.playlistGrid}>
          {matchingPlaylists.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.playlist}
            >
              <ListVideo size={24} />
              <div>
                <span>
                  {p.count}개 영상{p.membersOnly ? " / 후원자 전용 포함" : ""}
                </span>
                <h2>{p.title}</h2>
              </div>
              <ArrowUpRight size={18} />
            </a>
          ))}
        </div>
      ) : (
        <div className={styles.grid} id="video-results">
          {results.slice((page - 1) * 16, page * 16).map((v) => {
            const related = paths.filter((path) =>
              path.lessons.some((lesson) => lesson.id === v.id),
            );
            return (
              <article className={styles.card} key={v.id}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.videoLink}
                >
                  <div className={styles.thumb}>
                    <Image
                      src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                      alt=""
                      fill
                      sizes="(max-width:640px) 90vw, (max-width:1000px) 45vw, 280px"
                    />
                  </div>
                  <div className={styles.meta}>
                    <span>{v.membersOnly ? "후원자 전용" : v.kind}</span>
                    <span>{v.duration}</span>
                  </div>
                  <h2>{lessonTitle(v.id, v.title)}</h2>
                  <span className={styles.open}>
                    유튜브에서 보기 <ArrowUpRight size={13} />
                  </span>
                </a>
                <details className={styles.original}>
                  <summary>원래 영상 제목</summary>
                  <p>{v.title}</p>
                </details>
                {related.length > 0 && (
                  <div className={styles.related}>
                    {related.map((path) => (
                      <Link key={path.id} href={`/learn/${path.id}`}>
                        함께 배우기: {path.title}
                        <ArrowRight size={12} />
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {(playlists ? matchingPlaylists.length : results.length) === 0 && (
        <div className={styles.empty}>
          <Search size={30} />
          <h2>아직 찾지 못했어요.</h2>
          <p>다른 검색어를 입력하거나 필터를 초기화해 보세요.</p>
          <Link
            className="btn btn-secondary"
            href={playlists ? "/videos?view=playlists" : "/videos"}
          >
            검색 초기화
          </Link>
        </div>
      )}
      {!playlists && pageCount > 1 && (
        <nav className={styles.pagination} aria-label="영상 목록 페이지">
          {page > 1 && (
            <Link href={`${link({ page: String(page - 1) })}#video-results`}>
              <ArrowLeft size={15} /> 이전
            </Link>
          )}
          <span>
            {page} / {pageCount}
          </span>
          {page < pageCount && (
            <Link href={`${link({ page: String(page + 1) })}#video-results`}>
              다음 <ArrowRight size={15} />
            </Link>
          )}
        </nav>
      )}
      <p className={styles.note}>
        제목을 기준으로 주제를 분류했습니다. 공개 상태와 도구의 기능·요금은
        달라질 수 있습니다. 최신 업로드는{" "}
        <a
          href={youtubeChannel.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          유튜브 채널 ↗
        </a>
        에서 확인하세요.
      </p>
    </div>
  );
}
