"use client";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  List,
  ExternalLink,
  Undo2,
  X,
} from "lucide-react";
import { lessonTitle } from "@/lib/video-presentation";
import {
  parseProgress,
  progressSnapshot,
  recordVisit,
  saveCompleted,
} from "@/lib/learning-progress";
import styles from "./RoadmapCanvas.module.css";
interface Node {
  id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  x: number;
  y: number;
  parentId: string | null;
  timeline?: { time: string; title: string }[];
}
interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: string;
  nodes: Node[];
}
const subscribe = () => () => {};
export function RoadmapCanvas({ roadmap }: { roadmap: Roadmap }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return mounted ? (
    <Player key={roadmap.id} roadmap={roadmap} />
  ) : (
    <div
      className={styles.skeleton}
      role="status"
      aria-label="강의 불러오는 중"
    >
      <div />
      <div />
    </div>
  );
}
function Player({ roadmap }: { roadmap: Roadmap }) {
  const [completed, setCompleted] = useState(
    () => parseProgress(progressSnapshot(), { ...roadmap, href: "" }).completed,
  );
  const [selected, setSelected] = useState(() => {
    const requested = new URLSearchParams(location.search).get("lesson");
    const saved = parseProgress(progressSnapshot(), { ...roadmap, href: "" });
    return (
      roadmap.nodes.find((n) => n.id === requested) ??
      roadmap.nodes.find((n) => n.id === saved.lastId) ??
      roadmap.nodes.find((n) => !saved.completed.includes(n.id)) ??
      roadmap.nodes[0]
    );
  });
  const [tocOpen, setTocOpen] = useState(true);
  const [start, setStart] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [notice, setNotice] = useState<{
    id: string;
    added: boolean;
    text: string;
  } | null>(null);
  const tocRef = useRef<HTMLButtonElement>(null);
  const lessonRef = useRef<HTMLDivElement>(null);
  const lessonHeadingRef = useRef<HTMLHeadingElement>(null);
  const revealPending = useRef(false);
  const routePath = useRef(location.pathname);
  const listRef = useRef<HTMLOListElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const index = selected
    ? roadmap.nodes.findIndex((n) => n.id === selected.id)
    : -1;
  const isDone = selected ? completed.includes(selected.id) : false;
  const allDone =
    roadmap.nodes.length > 0 && completed.length === roadmap.nodes.length;
  const percent = roadmap.nodes.length
    ? Math.round((completed.length / roadmap.nodes.length) * 100)
    : 0;
  useEffect(() => {
    if (selected) recordVisit(roadmap.id, selected.id);
  }, [roadmap.id, selected]);
  useEffect(() => {
    const handleBack = () => {
      if (location.pathname !== routePath.current) return;
      const id = new URLSearchParams(location.search).get("lesson");
      const node = roadmap.nodes.find((n) => n.id === id) ?? roadmap.nodes[0];
      if (node) {
        setSelected(node);
        setStart(0);
        setAutoplay(false);
        setNotice(null);
      }
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [roadmap.nodes]);
  useEffect(() => {
    if (!selected || !listRef.current) return;
    const row = rowRefs.current.get(selected.id);
    const list = listRef.current;
    if (!row) return;
    const rowBox = row.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();
    if (rowBox.top < listBox.top) list.scrollTop += rowBox.top - listBox.top;
    else if (rowBox.bottom > listBox.bottom)
      list.scrollTop += rowBox.bottom - listBox.bottom;
  }, [selected, tocOpen]);
  useLayoutEffect(() => {
    if (revealPending.current) {
      revealPending.current = false;
      lessonHeadingRef.current?.focus({ preventScroll: true });
      lessonRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    }
  }, [selected]);
  function select(node: Node, push = true, revealVideo = false) {
    setSelected(node);
    setStart(0);
    setAutoplay(false);
    setNotice(null);
    if (revealVideo && window.matchMedia("(max-width: 900px)").matches) {
      if (node.id === selected?.id) {
        lessonHeadingRef.current?.focus({ preventScroll: true });
        lessonRef.current?.scrollIntoView({
          block: "start",
          behavior: "instant",
        });
      } else {
        revealPending.current = true;
      }
    }
    if (push) {
      const url = new URL(location.href);
      if (url.searchParams.get("lesson") !== node.id) {
        url.searchParams.set("lesson", node.id);
        window.history.pushState(window.history.state, "", url);
      }
    }
  }
  function persist(next: string[]) {
    setCompleted(next);
    setStorageError(!saveCompleted(roadmap.id, next));
  }
  function toggleComplete() {
    if (!selected) return;
    const added = !isDone;
    persist(
      added
        ? [...completed, selected.id]
        : completed.filter((id) => id !== selected.id),
    );
    const id = selected.id;
    if (added && index < roadmap.nodes.length - 1)
      select(roadmap.nodes[index + 1]);
    setNotice({
      id,
      added,
      text: added
        ? `${index + 1}강을 완료했습니다.`
        : `${index + 1}강의 완료 표시를 취소했습니다.`,
    });
  }
  function undo() {
    if (!notice) return;
    persist(
      notice.added
        ? completed.filter((id) => id !== notice.id)
        : [...new Set([...completed, notice.id])],
    );
    const node = roadmap.nodes.find((n) => n.id === notice.id);
    if (node) select(node);
    setNotice(null);
  }
  function seek(time: string) {
    const parts = time.split(":").map(Number);
    if (parts.some((n) => !Number.isFinite(n) || n < 0)) return;
    setStart(parts.reduce((n, p) => n * 60 + p, 0));
    setAutoplay(true);
  }
  const back = roadmap.id.startsWith("learn-")
    ? "/#roadmap-list"
    : "/#book-roadmaps";
  return (
    <section
      className={`container ${styles.workspace} ${tocOpen ? styles.withContents : ""}`}
      aria-label={`${roadmap.title} 강의실`}
    >
      <div className={styles.mobileTop}>
        <button
          ref={tocRef}
          type="button"
          aria-controls={`syllabus-${roadmap.id}`}
          aria-expanded={tocOpen}
          onClick={() => setTocOpen(!tocOpen)}
        >
          <List size={18} aria-hidden="true" />{" "}
          {tocOpen ? "목차 접기" : "목차 펼치기"}{" "}
          <span>
            {index + 1}/{roadmap.nodes.length}
          </span>
        </button>
        <span>{completed.length}개 완료</span>
      </div>
      <div className={styles.lesson} ref={lessonRef}>
        {selected ? (
          <>
            <div className={styles.lessonHead}>
              <span>
                {index + 1}강 / {roadmap.nodes.length}강
              </span>
              <h2 ref={lessonHeadingRef} tabIndex={-1}>
                {lessonTitle(selected.youtubeId, selected.title)}
              </h2>
            </div>
            <div className={styles.video}>
              <iframe
                key={`${selected.id}-${start}-${autoplay}`}
                src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}?rel=0${start ? `&start=${start}` : ""}${autoplay ? "&autoplay=1" : ""}`}
                title={selected.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.previous}
                disabled={index <= 0}
                onClick={() => select(roadmap.nodes[index - 1])}
              >
                <ChevronLeft size={17} aria-hidden="true" />
                <span>이전</span>
              </button>
              <button
                type="button"
                className={styles.complete}
                onClick={toggleComplete}
              >
                <CheckCircle2 size={17} aria-hidden="true" />
                {isDone
                  ? "완료 표시 취소"
                  : index < roadmap.nodes.length - 1
                    ? "완료하고 다음 강의"
                    : "학습 완료하기"}
              </button>
              <button
                type="button"
                className={styles.next}
                disabled={index >= roadmap.nodes.length - 1}
                onClick={() => select(roadmap.nodes[index + 1])}
              >
                <span>다음</span>
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
            <div className={styles.feedback} aria-live="polite">
              {notice && (
                <div className={styles.notice}>
                  <span>{notice.text}</span>
                  <button type="button" onClick={undo}>
                    <Undo2 size={14} aria-hidden="true" /> 되돌리기
                  </button>
                  <button
                    type="button"
                    aria-label="완료 알림 닫기"
                    onClick={() => setNotice(null)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
              {storageError && (
                <p>
                  이 브라우저에 진도를 저장하지 못했습니다. 저장 공간 설정을
                  확인해 주세요. 현재 학습은 계속할 수 있습니다.
                </p>
              )}
            </div>
            {allDone && (
              <div className={styles.finished}>
                <CheckCircle2 size={23} aria-hidden="true" />
                <div>
                  <h3>이 경로의 모든 강의를 마쳤어요.</h3>
                  <p>실습 결과를 정리하고 다음 배움을 골라보세요.</p>
                </div>
                <Link href={back}>
                  다음 경로 고르기 <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <h2>강의를 준비하고 있습니다.</h2>
            <Link href={back}>다른 학습 경로 보기</Link>
          </div>
        )}
      </div>
      <aside
        id={`syllabus-${roadmap.id}`}
        className={`${styles.sidebar} ${tocOpen ? styles.open : ""}`}
        aria-label="강의 목차"
      >
        <div className={styles.sidebarHead}>
          <Link href={back}>
            <ChevronLeft size={15} aria-hidden="true" /> 학습 경로로
          </Link>
          <h2>강의 목차</h2>
          <div className={styles.progressLabel}>
            <span>
              {completed.length} / {roadmap.nodes.length}개 완료
            </span>
            <strong>{percent}%</strong>
          </div>
          <progress
            value={completed.length}
            max={Math.max(1, roadmap.nodes.length)}
            aria-label="학습 진행률"
          />
        </div>
        <ol className={styles.list} ref={listRef}>
          {roadmap.nodes.map((node, i) => (
            <li key={node.id}>
              <button
                type="button"
                ref={(el) => {
                  if (el) rowRefs.current.set(node.id, el);
                  else rowRefs.current.delete(node.id);
                }}
                aria-current={selected?.id === node.id ? "step" : undefined}
                onClick={() => select(node, true, true)}
              >
                <span className={styles.number}>
                  {completed.includes(node.id) ? (
                    <Check size={15} aria-hidden="true" />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>
                  {lessonTitle(node.youtubeId, node.title)}
                  <small>
                    {completed.includes(node.id)
                      ? "학습 완료"
                      : selected?.id === node.id
                        ? "현재 강의"
                        : node.difficulty === "ADVANCED"
                          ? "심화"
                          : node.difficulty === "INTERMEDIATE"
                            ? "활용"
                            : "입문"}
                  </small>
                </span>
                {selected?.id === node.id && (
                  <ChevronRight size={14} aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      {selected && (
        <div className={styles.details}>
          <div className={styles.goal}>
            <strong>이번 강의에서 해볼 일</strong>
            <p>
              {selected.description?.replace(/^실습 목표:\s*/, "") ||
                "영상을 따라 실습한 뒤, 배운 내용을 자신의 말로 정리해 보세요."}
            </p>
          </div>
          <div className={styles.resourceLinks}>
            <a
              href={selected.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              유튜브에서 보기 <ExternalLink size={14} aria-hidden="true" />
            </a>
            <Link href="/qna">질문 남기기</Link>
          </div>
          <details>
            <summary>원래 영상 제목과 시청 안내</summary>
            <p>{selected.title}</p>
            {selected.youtubeId === "lzkfJwYrKqw" && (
              <p>
                2026. 9. 6. 공개 재생을 확인한 영상입니다. 표지에는 ‘후원자
                전용’ 문구가 남아 있습니다.
              </p>
            )}
            <p>
              완료 표시는 이 브라우저에 저장됩니다. 영상 시청 완료와 실습 완료
              여부는 직접 표시해 주세요.
            </p>
          </details>
          {selected.timeline && selected.timeline.length > 0 && (
            <details open>
              <summary>영상 구간 바로가기</summary>
              <div className={styles.timeline}>
                {selected.timeline.map((item, i) => (
                  <button type="button" key={i} onClick={() => seek(item.time)}>
                    <span>{item.time}</span>
                    {item.title}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
