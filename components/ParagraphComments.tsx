"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
}

interface Data {
  enabled: boolean;
  loggedIn?: boolean;
  limit?: number;
  maxLength?: number;
  remaining?: number | null; // null = 관리자(제한 없음)
  comments?: Comment[];
}

const ICON =
  '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

const dateText = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/**
 * 문단 댓글. 리더가 붙인 data-pk 블록마다 오른쪽 여백에 말풍선 버튼을 달고(서버 HTML에 DOM으로 붙인다),
 * 누르면 그 문단의 댓글 시트를 연다. 읽기는 누구나, 쓰기는 로그인한 사람만(하루 한도는 서버가 검사).
 * 원문이 바뀌어 문단을 찾지 못한 댓글은 절 끝에 모아 보여준다.
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
  const [openPk, setOpenPk] = useState<string | null>(null);
  const [excerpt, setExcerpt] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sheet = useRef<HTMLDialogElement>(null);

  // 절이나 본문이 바뀌면 page가 key로 새로 그리므로 처음 한 번만 불러온다
  useEffect(() => {
    let alive = true;
    fetch(api, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .catch(() => ({ enabled: false }))
      .then((d: Data) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, [api]);

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

  // 버튼 누르면 시트 열기 · 터치 화면에서는 문단을 누르면 버튼이 보인다
  useEffect(() => {
    if (!data?.enabled) return;
    const touch = matchMedia("(hover: none)");
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const btn = target.closest<HTMLElement>("[data-pc-open]");
      if (btn) {
        const block = btn.closest<HTMLElement>("[data-pk]");
        const text = (block?.textContent ?? "").replace(/\s+/g, " ").trim();
        setExcerpt(block?.tagName === "FIGURE" ? "그림" : text.length > 90 ? `${text.slice(0, 90)}…` : text);
        setError("");
        setOpenPk(btn.dataset.pcOpen!);
        return;
      }
      if (!touch.matches || target.closest("a, button, img, input, textarea, pre")) return;
      const block = target.closest<HTMLElement>(".rd-prose [data-pk]");
      document.querySelectorAll(".rd-prose .pc-show").forEach((el) => el !== block && el.classList.remove("pc-show"));
      block?.classList.toggle("pc-show");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [data?.enabled]);

  useEffect(() => {
    const d = sheet.current;
    if (!d) return;
    if (openPk && !d.open) d.showModal();
    if (!openPk && d.open) d.close();
  }, [openPk]);

  if (!data?.enabled) return null;

  const known = new Set(paragraphKeys);
  const orphans = (data.comments ?? []).filter((c) => !known.has(c.pk));
  const list = openPk ? (byPk.get(openPk) ?? []) : [];
  const remaining = data.remaining;
  const maxLength = data.maxLength ?? 500;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!openPk || !draft.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pk: openPk, body: draft }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "댓글을 남기지 못했습니다.");
        return;
      }
      setDraft("");
      setData((d) => d && { ...d, remaining: json.remaining, comments: [...(d.comments ?? []), json.comment] });
    } catch {
      setError("네트워크 오류로 댓글을 남기지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Comment) => {
    if (!confirm("이 댓글을 지울까요? 지워도 오늘 남긴 댓글 수는 돌아오지 않습니다.")) return;
    const res = await fetch(`${api}/${c.id}`, { method: "DELETE" });
    if (res.ok) setData((d) => d && { ...d, comments: (d.comments ?? []).filter((x) => x.id !== c.id) });
    else setError((await res.json().catch(() => ({}))).error || "댓글을 지우지 못했습니다.");
  };

  return (
    <>
      {orphans.length > 0 && (
        <section className="rd-pc-orphans" aria-label="원문이 바뀐 문단의 댓글">
          <h2>원문이 바뀐 문단의 댓글 {orphans.length}개</h2>
          <CommentList comments={orphans} onDelete={remove} />
        </section>
      )}

      <dialog ref={sheet} className="rd-sheet rd-pc-sheet" aria-label="문단 댓글" onClose={() => setOpenPk(null)}>
        <div className="rd-sheet-head">
          <b>문단 댓글 {list.length > 0 && <small>{list.length}</small>}</b>
          <button type="button" data-close>
            닫기
          </button>
        </div>
        <div className="rd-pc-body">
          {excerpt && <blockquote className="rd-pc-quote">{excerpt}</blockquote>}
          {list.length > 0 ? (
            <CommentList comments={list} onDelete={remove} />
          ) : (
            <p className="rd-pc-empty">아직 댓글이 없습니다. 이 문단에 대한 생각이나 질문을 남겨 보세요.</p>
          )}

          {data.loggedIn ? (
            <form className="rd-pc-form" onSubmit={submit}>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={maxLength}
                rows={3}
                placeholder={remaining === 0 ? "오늘은 댓글을 모두 남겼어요. 내일 다시 남길 수 있습니다." : "이 문단에 댓글 남기기"}
                disabled={remaining === 0 || busy}
                aria-label="댓글 내용"
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
              <p>댓글은 구글 계정으로 로그인한 뒤 남길 수 있어요. 한 사람당 하루 {data.limit}개까지입니다.</p>
              <button type="button" className="btn btn-primary" onClick={() => signIn("google", { callbackUrl: location.href })}>
                구글로 로그인하고 댓글 남기기
              </button>
            </div>
          )}
          {error && (
            <p className="rd-pc-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </dialog>
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
