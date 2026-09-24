"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Editing {
  index: number;
  raw: string;
  block: HTMLElement;
  host: HTMLElement;
}

const PENCIL =
  '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M13.5 3.5l3 3L7 16H4v-3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

/**
 * 관리자 바로 고치기. 관리자로 로그인하면 리더의 블록(data-src)마다 왼쪽 여백에 수정 버튼이 생기고,
 * 누르면 그 자리에서 블록의 원고(마크다운)를 고쳐 저장한다. 저장은 절 전체 원고 중 그 블록만 바꾼다
 * (/api/admin/books/block → saveSectionMarkdown: 운영은 Firestore 오버레이, 개발은 파일).
 */
export function InlineBookEditor({ bookId, sectionId }: { bookId: string; sectionId: string }) {
  const { data: session } = useSession();
  const isAdmin = Boolean(session?.user?.isAdmin);
  const router = useRouter();
  const [editing, setEditing] = useState<Editing | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const current = useRef<Editing | null>(null);

  const close = () => {
    const e = current.current;
    if (e) {
      e.host.remove();
      e.block.hidden = false;
    }
    current.current = null;
    setEditing(null);
    setError("");
  };

  // 블록마다 수정 버튼 달기
  useEffect(() => {
    if (!isAdmin) return;
    const html = document.documentElement;
    html.classList.add("rd-admin");
    const blocks = [...document.querySelectorAll<HTMLElement>(".rd-prose [data-src]")];
    const buttons = blocks.map((block) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rd-edit-btn";
      btn.dataset.editSrc = block.dataset.src;
      btn.setAttribute("aria-label", "이 블록 고치기 (관리자)");
      btn.innerHTML = `${PENCIL}<span>수정</span>`;
      (/^(UL|OL)$/.test(block.tagName) && block.firstElementChild ? block.firstElementChild : block).append(btn);
      return btn;
    });
    return () => {
      buttons.forEach((b) => b.remove());
      html.classList.remove("rd-admin");
    };
  }, [isAdmin]);

  // 수정 버튼 → 원고 받아서 그 자리에 편집기
  useEffect(() => {
    if (!isAdmin) return;
    const onClick = async (event: MouseEvent) => {
      const btn = (event.target as HTMLElement).closest<HTMLElement>("[data-edit-src]");
      if (!btn || current.current) return;
      const block = btn.closest<HTMLElement>("[data-src]");
      const index = Number(btn.dataset.editSrc);
      if (!block) return;
      const res = await fetch(`/api/admin/books/block?bookId=${bookId}&sectionId=${sectionId}&index=${index}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || typeof json.raw !== "string") {
        alert(json.error || "원고를 불러오지 못했습니다. 관리자로 다시 로그인해 주세요.");
        return;
      }
      const host = document.createElement(block.tagName === "LI" ? "li" : "div");
      host.className = "rd-edit-host";
      block.after(host);
      block.hidden = true;
      const next = { index, raw: json.raw as string, block, host };
      current.current = next;
      setDraft(next.raw.trimEnd());
      setError("");
      setEditing(next);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [isAdmin, bookId, sectionId]);

  // 언마운트 때 편집기 흔적 정리
  useEffect(() => () => {
    const e = current.current;
    if (e) {
      e.host.remove();
      e.block.hidden = false;
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!isAdmin) return null;

  const save = async () => {
    if (!editing || saving) return;
    if (!draft.trim() && !confirm("내용을 비우면 이 블록이 지워집니다. 지울까요?")) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/books/block", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, sectionId, index: editing.index, original: editing.raw, markdown: draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "저장하지 못했습니다.");
        setSaving(false);
        return;
      }
      // 편집기를 닫고, 새 원고로 다시 그려질 때까지 옛 블록을 흐리게 둔다
      const block = editing.block;
      close();
      setSaving(false);
      block.classList.add("rd-edit-pending");
      setTimeout(() => block.classList.remove("rd-edit-pending"), 4000);
      setToast(json.message || "저장했습니다.");
      router.refresh();
    } catch {
      setError("네트워크 오류로 저장하지 못했습니다.");
      setSaving(false);
    }
  };

  const onKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      save();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      if (draft === editing?.raw.trimEnd() || confirm("고친 내용을 버릴까요?")) close();
    }
  };

  const code = editing?.raw.startsWith("```");
  const rows = Math.min(28, Math.max(3, draft.split("\n").length + 1, Math.ceil(draft.length / 48)));

  return (
    <>
      {editing &&
        createPortal(
          <div className="rd-edit">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              rows={rows}
              className={code ? "mono" : undefined}
              aria-label="블록 원고(마크다운)"
              autoFocus
              disabled={saving}
            />
            <div className="rd-edit-foot">
              <small>마크다운 · 비우고 저장하면 블록 삭제 · ⌘/Ctrl+Enter 저장 · Esc 취소</small>
              <button type="button" className="btn btn-secondary" onClick={close} disabled={saving}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={save} disabled={saving || draft === editing.raw.trimEnd()}>
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
            {error && (
              <p className="rd-edit-error" role="alert">
                {error}
              </p>
            )}
          </div>,
          editing.host,
        )}
      {toast && (
        <p className="rd-edit-toast" role="status">
          {toast}
        </p>
      )}
    </>
  );
}
