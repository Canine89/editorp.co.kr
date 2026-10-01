"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { signIn } from "next-auth/react";

interface Comment {
  id: string;
  pk: string;
  body: string;
  authorName: string;
  authorImage: string | null;
  createdAt: string;
  mine: boolean;
  canDelete: boolean;
  byEditor: boolean;
}

interface Data {
  enabled: boolean;
  loggedIn?: boolean;
  limit?: number;
  maxLength?: number;
  remaining?: number | null; // null = 관리자(제한 없음)
  comments?: Comment[];
}

/** 절 전체에 다는 댓글의 키 (lib/book-comments.ts SECTION_KEY) */
const SECTION = "section";
const HINT_KEY = "pc-hint-seen";
const DRAFT_KEY = "pc-draft";

type Sheet = { mode: "paragraph"; pk: string; excerpt: string } | { mode: "all" } | null;

const ICON =
  '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

const dateText = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

const blockOf = (pk: string) => document.querySelector<HTMLElement>(`.rd-prose [data-pk="${CSS.escape(pk)}"]`);

function excerptOf(block: HTMLElement | null) {
  if (!block) return "";
  if (block.tagName === "FIGURE") return "그림";
  // 본문에 붙인 버튼(댓글·관리자 수정·코드 복사)의 글자는 빼고
  const copy = block.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("button").forEach((b) => b.remove());
  const text = (copy.textContent ?? "").replace(/\s+/g, " ").trim();
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

function remember(key: string) {
  try {
    localStorage.setItem(key, "1");
  } catch {}
}

const noSubscribe = () => () => {};
const subscribeHover = (callback: () => void) => {
  const mq = matchMedia("(hover: none)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
};
const hintSeen = () => {
  try {
    return Boolean(localStorage.getItem(HINT_KEY));
  } catch {
    return true;
  }
};

/** 로그인하러 가기 전에 쓰던 글: 같은 절의 #c-<키>로 돌아왔을 때만 되살린다 */
function savedDraft(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const pk = decodeURIComponent(location.hash.match(/^#c-(.+)$/)?.[1] ?? "");
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
    return pk && saved?.path === location.pathname && saved.pk === pk && typeof saved.body === "string" ? { [pk]: saved.body } : {};
  } catch {
    return {};
  }
}

/**
 * 독자 댓글. 읽기는 누구나, 쓰기는 로그인한 사람만(하루 한도는 서버가 검사).
 *  - 문단 댓글: 리더가 붙인 data-pk 블록마다 오른쪽 여백에 말풍선 버튼(서버 HTML에 DOM으로 붙인다).
 *    터치 화면에서는 문단을 누르면 화면 아래에 댓글 버튼 줄이 뜬다.
 *  - 절 댓글: 절 끝 "댓글" 칸. 문단을 고르지 않고 절 전체에 남긴다.
 *  - 메타 줄의 "댓글 N개"는 절 끝 칸으로, 첫 방문에는 본문 위에 사용법 한 줄을 보여준다.
 *  - 주소의 #c-<문단 키>로 그 문단의 댓글을 연다. 로그인하고 돌아올 때 쓰던 글과 함께 이 주소로 돌아온다.
 * 원문이 바뀌어 문단을 찾지 못한 댓글은 "모두 보기" 끝에 모은다.
 */
export function ParagraphComments({
  bookId,
  sectionId,
  paragraphKeys,
}: {
  bookId: string;
  sectionId: string;
  paragraphKeys: string[];
}) {
  const api = `/api/books/${bookId}/${sectionId}/comments`;
  const [data, setData] = useState<Data | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  // 처음 그릴 때는 data가 없어 아무것도 그리지 않으므로 서버와 달라도 된다
  const [drafts, setDrafts] = useState<Record<string, string>>(savedDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ pk: string; text: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hintClosed, setHintClosed] = useState(false);
  const mounted = useSyncExternalStore(noSubscribe, () => true, () => false);
  const touch = useSyncExternalStore(subscribeHover, () => matchMedia("(hover: none)").matches, () => false);
  const hintOpen = !useSyncExternalStore(noSubscribe, hintSeen, () => true) && !hintClosed;
  const dialog = useRef<HTMLDialogElement>(null);
  const sectionInput = useRef<HTMLTextAreaElement>(null);

  const openSheet = useCallback((next: NonNullable<Sheet>) => {
    setError(null);
    setSelected(null);
    setHintClosed(true);
    remember(HINT_KEY);
    setSheet(next);
  }, []);
  const openParagraph = useCallback(
    (pk: string) => openSheet({ mode: "paragraph", pk, excerpt: excerptOf(blockOf(pk)) }),
    [openSheet],
  );

  // 절이나 본문이 바뀌면 page가 key로 새로 그리므로 처음 한 번만 불러온다.
  // 주소가 #c-<키>면 불러온 뒤 그 문단의 댓글을 열거나 절 끝 칸으로 간다(로그인하고 돌아온 경우 포함)
  useEffect(() => {
    let alive = true;
    fetch(api, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .catch(() => ({ enabled: false }))
      .then((d: Data) => {
        if (!alive) return;
        setData(d);
        const m = location.hash.match(/^#c-(.+)$/);
        if (!d.enabled || !m) return;
        const pk = decodeURIComponent(m[1]);
        history.replaceState(history.state, "", location.pathname + location.search);
        try {
          sessionStorage.removeItem(DRAFT_KEY); // 쓰던 글은 첫 상태(savedDraft)로 이미 되살렸다
        } catch {}
        if (pk === SECTION) {
          requestAnimationFrame(() => {
            document.getElementById("c-section")?.scrollIntoView({ block: "center" });
            sectionInput.current?.focus({ preventScroll: true });
          });
          return;
        }
        const block = blockOf(pk);
        if (!block) return;
        block.scrollIntoView({ block: "center" });
        openParagraph(pk);
      });
    return () => {
      alive = false;
    };
  }, [api, openParagraph]);

  const byPk = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of data?.comments ?? []) map.set(c.pk, [...(map.get(c.pk) ?? []), c]);
    return map;
  }, [data]);

  // 문단마다 버튼 달기 (댓글 수가 바뀌면 다시)
  useEffect(() => {
    if (!data?.enabled) return;
    const blocks = [...document.querySelectorAll<HTMLElement>(".rd-prose [data-pk]")];
    const buttons = blocks.map((block) => {
      const count = byPk.get(block.dataset.pk!)?.length ?? 0;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `rd-pc-btn${count ? " has" : ""}`;
      btn.dataset.pcOpen = block.dataset.pk;
      if (count) btn.dataset.count = String(count);
      btn.setAttribute("aria-label", count ? `이 문단의 댓글 ${count}개 보기` : "이 문단에 댓글 남기기");
      btn.innerHTML = ICON;
      // 목록은 첫 항목 안에 단다 (ul/ol의 자식은 li만 두기 위해)
      (/^(UL|OL)$/.test(block.tagName) && block.firstElementChild ? block.firstElementChild : block).append(btn);
      return btn;
    });
    return () => buttons.forEach((b) => b.remove());
  }, [data, byPk]);

  // 버튼 누르면 시트 열기 · 터치 화면에서는 문단을 누르면 고른 문단이 되고 아래에 버튼 줄이 뜬다
  useEffect(() => {
    if (!data?.enabled) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const btn = target.closest<HTMLElement>("[data-pc-open]");
      if (btn) {
        openParagraph(btn.dataset.pcOpen!);
        return;
      }
      if (!touch || target.closest("a, button, img, input, textarea, pre, dialog, .rd-pc-bar")) return;
      const block = target.closest<HTMLElement>(".rd-prose [data-pk]");
      setSelected((prev) => (block && block.dataset.pk !== prev ? block.dataset.pk! : null));
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [data?.enabled, touch, openParagraph]);

  // 고른 문단·시트로 연 문단에 바탕색
  const shown = sheet?.mode === "paragraph" ? sheet.pk : selected;
  useEffect(() => {
    const block = shown ? blockOf(shown) : null;
    block?.classList.add("pc-show");
    return () => block?.classList.remove("pc-show");
  }, [shown]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (sheet && !d.open) d.showModal();
    if (!sheet && d.open) d.close();
  }, [sheet]);

  if (!data?.enabled) return null;

  const comments = data.comments ?? [];
  const known = new Set(paragraphKeys);
  const orphans = comments.filter((c) => c.pk !== SECTION && !known.has(c.pk));
  const sectionComments = byPk.get(SECTION) ?? [];
  const paragraphCount = comments.length - sectionComments.length;
  const maxLength = data.maxLength ?? 500;
  const selectedCount = selected ? (byPk.get(selected)?.length ?? 0) : 0;

  const setDraft = (pk: string, body: string) => setDrafts((d) => ({ ...d, [pk]: body }));

  const submit = async (pk: string) => {
    const body = drafts[pk] ?? "";
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk, body }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError({ pk, text: json.error || "댓글을 남기지 못했습니다." });
        return;
      }
      setDraft(pk, "");
      setHintClosed(true);
      remember(HINT_KEY);
      setData((d) => d && { ...d, remaining: json.remaining, comments: [...(d.comments ?? []), json.comment] });
    } catch {
      setError({ pk, text: "네트워크 오류로 댓글을 남기지 못했습니다." });
    } finally {
      setBusy(false);
    }
  };

  const login = (pk: string) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ path: location.pathname, pk, body: drafts[pk] ?? "" }));
    } catch {}
    signIn("google", { callbackUrl: `${location.origin}${location.pathname}#c-${pk}` });
  };

  const remove = async (c: Comment) => {
    if (!confirm("이 댓글을 지울까요? 지워도 오늘 남긴 댓글 수는 돌아오지 않습니다.")) return;
    const res = await fetch(`${api}/${c.id}`, { method: "DELETE" });
    if (res.ok) setData((d) => d && { ...d, comments: (d.comments ?? []).filter((x) => x.id !== c.id) });
    else setError({ pk: c.pk, text: (await res.json().catch(() => ({}))).error || "댓글을 지우지 못했습니다." });
  };

  const goTo = (pk: string) => {
    setSheet(null);
    const block = blockOf(pk);
    if (!block) return;
    block.scrollIntoView({ block: "center", behavior: "smooth" });
    block.classList.add("pc-flash");
    setTimeout(() => block.classList.remove("pc-flash"), 1800);
  };

  const toTalk = (event: React.MouseEvent) => {
    event.preventDefault();
    document.getElementById("c-section")?.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  const formProps = { data, drafts, setDraft, busy, error, maxLength, onSubmit: submit, onLogin: login };
  // 서버가 그린 자리(메타 줄, 본문 위 안내)에 포털로 그린다
  const metaSlot = mounted ? document.querySelector("[data-pc-meta]") : null;
  const hintSlot = mounted ? document.querySelector("[data-pc-hint]") : null;
  const groups = paragraphKeys.filter((pk) => byPk.has(pk));

  return (
    <>
      {metaSlot &&
        createPortal(
          <a href="#c-section" onClick={toTalk}>
            {comments.length ? `댓글 ${comments.length}개` : "댓글 남기기"}
          </a>,
          metaSlot,
        )}
      {hintSlot &&
        hintOpen &&
        createPortal(
          <p className="rd-pc-hint">
            <span dangerouslySetInnerHTML={{ __html: ICON }} />
            <span>
              {touch ? "문단을 누르면" : "문단 오른쪽의 말풍선을 누르면"} 그 문단에 댓글을 남길 수 있습니다. 절 전체에 대한
              생각은 맨 아래 댓글 칸에 남겨 주세요.
            </span>
            <button
              type="button"
              onClick={() => {
                setHintClosed(true);
                remember(HINT_KEY);
              }}
            >
              닫기
            </button>
          </p>,
          hintSlot,
        )}

      <section className="rd-talk" id="c-section" aria-labelledby="rd-talk-title">
        <h2 id="rd-talk-title">
          댓글 {comments.length > 0 && <small>{comments.length}</small>}
        </h2>
        <p className="rd-talk-lead">
          이 절을 읽고 든 생각이나 질문을 남겨 주세요. {touch ? "문단을 누르면" : "문단 오른쪽 말풍선을 누르면"} 그 문단에만 남길 수도
          있습니다.
        </p>
        {paragraphCount > 0 && (
          <p className="rd-talk-more">
            문단에 남긴 댓글 {paragraphCount}개
            <button type="button" onClick={() => openSheet({ mode: "all" })}>
              모두 보기
            </button>
          </p>
        )}
        {sectionComments.length > 0 && <CommentList comments={sectionComments} onDelete={remove} />}
        <CommentForm {...formProps} pk={SECTION} inputRef={sectionInput} placeholder="이 절에 댓글 남기기" />
      </section>

      {touch && selected && (
        <div className="rd-pc-bar" role="region" aria-label="고른 문단">
          <button type="button" className="btn btn-primary" onClick={() => openParagraph(selected)}>
            {selectedCount ? `이 문단 댓글 ${selectedCount}개 보기` : "이 문단에 댓글 남기기"}
          </button>
          <button type="button" className="rd-pc-bar-close" onClick={() => setSelected(null)}>
            닫기
          </button>
        </div>
      )}

      <dialog
        ref={dialog}
        className="rd-sheet rd-pc-sheet"
        aria-label={sheet?.mode === "all" ? "문단 댓글 모두" : "문단 댓글"}
        onClose={() => setSheet(null)}
      >
        <div className="rd-sheet-head">
          <b>
            {sheet?.mode === "all" ? "문단 댓글 모두" : "문단 댓글"}
            {sheet?.mode === "paragraph" && (byPk.get(sheet.pk)?.length ?? 0) > 0 && <small>{byPk.get(sheet.pk)!.length}</small>}
          </b>
          <button type="button" data-close>
            닫기
          </button>
        </div>
        {sheet?.mode === "paragraph" && (
          <div className="rd-pc-body">
            {sheet.excerpt && <blockquote className="rd-pc-quote">{sheet.excerpt}</blockquote>}
            {byPk.get(sheet.pk)?.length ? (
              <CommentList comments={byPk.get(sheet.pk)!} onDelete={remove} />
            ) : (
              <p className="rd-pc-empty">아직 댓글이 없습니다. 이 문단에 대한 생각이나 질문을 남겨 보세요.</p>
            )}
            <CommentForm {...formProps} pk={sheet.pk} placeholder="이 문단에 댓글 남기기" />
          </div>
        )}
        {sheet?.mode === "all" && (
          <div className="rd-pc-body">
            {groups.map((pk) => (
              <section key={pk} className="rd-pc-group">
                <blockquote className="rd-pc-quote">{excerptOf(blockOf(pk))}</blockquote>
                <CommentList comments={byPk.get(pk)!} onDelete={remove} />
                <button type="button" className="rd-pc-goto" onClick={() => goTo(pk)}>
                  본문에서 보기
                </button>
              </section>
            ))}
            {orphans.length > 0 && (
              <section className="rd-pc-group">
                <h3>원문이 바뀐 문단의 댓글 {orphans.length}개</h3>
                <CommentList comments={orphans} onDelete={remove} />
              </section>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function CommentForm({
  pk,
  data,
  drafts,
  setDraft,
  busy,
  error,
  maxLength,
  placeholder,
  inputRef,
  onSubmit,
  onLogin,
}: {
  pk: string;
  data: Data;
  drafts: Record<string, string>;
  setDraft: (pk: string, body: string) => void;
  busy: boolean;
  error: { pk: string; text: string } | null;
  maxLength: number;
  placeholder: string;
  inputRef?: React.Ref<HTMLTextAreaElement>;
  onSubmit: (pk: string) => void;
  onLogin: (pk: string) => void;
}) {
  const draft = drafts[pk] ?? "";
  const remaining = data.remaining;
  return (
    <>
      {data.loggedIn ? (
        <form
          className="rd-pc-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(pk);
          }}
        >
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(pk, e.target.value)}
            maxLength={maxLength}
            rows={3}
            placeholder={remaining === 0 ? "오늘은 댓글을 모두 남겼어요. 내일 다시 남길 수 있습니다." : placeholder}
            disabled={remaining === 0 || busy}
            aria-label={placeholder}
          />
          <div className="rd-pc-form-foot">
            <small>
              {remaining === null ? "관리자" : `오늘 남은 댓글 ${remaining}/${data.limit}`} · {draft.length}/{maxLength}자
            </small>
            <button type="submit" className="btn btn-primary" disabled={!draft.trim() || busy || remaining === 0}>
              {busy ? "남기는 중…" : "남기기"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rd-pc-login">
          <p>
            댓글은 구글 계정으로 로그인한 뒤 남길 수 있어요. 한 사람당 하루 {data.limit}개까지입니다. 로그인하면{" "}
            <a href="/terms">이용약관</a>과 <a href="/privacy">개인정보처리방침</a>에 동의하게 됩니다.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => onLogin(pk)}>
            구글로 로그인하고 댓글 남기기
          </button>
        </div>
      )}
      {error?.pk === pk && (
        <p className="rd-pc-error" role="alert">
          {error.text}
        </p>
      )}
    </>
  );
}

function CommentList({ comments, onDelete }: { comments: Comment[]; onDelete: (c: Comment) => void }) {
  return (
    <ol className="rd-pc-list">
      {comments.map((c) => (
        <li key={c.id}>
          <div className="rd-pc-who">
            {c.authorImage ? (
              // 구글 프로필 사진(외부 주소)이라 next/image 대신 img, 리퍼러는 보내지 않는다
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.authorImage} alt="" width={24} height={24} referrerPolicy="no-referrer" loading="lazy" />
            ) : (
              <span aria-hidden="true">{c.authorName.slice(0, 1)}</span>
            )}
            <b>{c.authorName}</b>
            {c.byEditor && <em className="rd-pc-editor">편집자P</em>}
            <time dateTime={c.createdAt}>{dateText(c.createdAt)}</time>
            {c.canDelete && (
              <button type="button" onClick={() => onDelete(c)}>
                삭제
              </button>
            )}
          </div>
          <p>{c.body}</p>
        </li>
      ))}
    </ol>
  );
}
