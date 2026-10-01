/** 브라우저 독서 기록. 책마다 읽은 절, 마지막 절, 방문 시각, 읽던 위치를 저장하고 서버로 보내지 않는다. */
export interface BookProgress {
  read: string[];
  last: string | null;
  visitedAt: number;
  /** 마지막으로 읽던 절과 그 절 본문 안에서의 위치(0~1). 글자 크기가 바뀌어도 맞도록 비율로 둔다 */
  pos?: { id: string; r: number };
}

const PREFIX = "book-progress-";
const EVENT = "editorp-reading-progress";
const EMPTY: BookProgress = { read: [], last: null, visitedAt: 0 };

export function subscribeReading(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}

/** useSyncExternalStore용 스냅샷: 모든 책의 기록을 한 문자열로 */
export function readingSnapshot(): string {
  try {
    const entries: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) entries[key] = localStorage.getItem(key) || "";
    }
    return JSON.stringify(entries);
  } catch {
    return "";
  }
}

/** 저장값이 깨졌거나 목차에서 사라진 절은 버린다 */
export function parseBookProgress(snapshot: string, bookId: string, validIds: string[]): BookProgress {
  try {
    const raw = JSON.parse(JSON.parse(snapshot || "{}")[PREFIX + bookId] || "null");
    if (!raw || typeof raw !== "object") return EMPTY;
    const valid = new Set(validIds);
    const read: string[] = Array.isArray(raw.read)
      ? [...new Set<string>(raw.read.filter((id: unknown): id is string => typeof id === "string" && valid.has(id)))]
      : [];
    const last = typeof raw.last === "string" && valid.has(raw.last) ? raw.last : null;
    const visitedAt = typeof raw.visitedAt === "number" ? raw.visitedAt : 0;
    const pos =
      raw.pos && typeof raw.pos.id === "string" && valid.has(raw.pos.id) && typeof raw.pos.r === "number" && raw.pos.r >= 0 && raw.pos.r <= 1
        ? { id: raw.pos.id as string, r: raw.pos.r as number }
        : undefined;
    return { read, last, visitedAt, ...(pos && { pos }) };
  } catch {
    return EMPTY;
  }
}

export function updateBookProgress(bookId: string, validIds: string[], update: (p: BookProgress) => BookProgress) {
  try {
    const next = update(parseBookProgress(readingSnapshot(), bookId, validIds));
    localStorage.setItem(PREFIX + bookId, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)에서는 기록 없이 읽기만 한다
  }
}

/** 이어 읽을 절: 마지막 절을 다 읽지 않았으면 그 절, 다 읽었으면 그 뒤의 첫 안 읽은 절, 없으면 처음부터의 첫 안 읽은 절 */
export function nextToRead<T extends { id: string }>(sections: T[], progress: BookProgress): T | undefined {
  const unread = (s: T) => !progress.read.includes(s.id);
  const lastIndex = sections.findIndex((s) => s.id === progress.last);
  if (lastIndex !== -1 && unread(sections[lastIndex])) return sections[lastIndex];
  return sections.slice(lastIndex + 1).find(unread) ?? sections.find(unread);
}
