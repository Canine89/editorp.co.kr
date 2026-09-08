/** 브라우저 학습 기록. 기존 완료·마지막 강의 키를 그대로 유지한다. */
export interface ProgressCourse {
  id: string;
  title: string;
  href: string;
  nodes: { id: string; title: string }[];
}
export interface CourseProgress {
  completed: string[];
  lastId: string | null;
  visitedAt: number;
}
const ACTIVITY = "editorp-learning-activity";
const EVENT = "editorp-learning-progress";
export function subscribeProgress(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENT, callback);
  };
}
export function progressSnapshot(): string {
  try {
    const entries: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("completed-nodes-") ||
          key.startsWith("last-node-") ||
          key === ACTIVITY)
      )
        entries[key] = localStorage.getItem(key) || "";
    }
    return JSON.stringify(entries);
  } catch {
    return "";
  }
}
export function parseProgress(
  snapshot: string,
  course: ProgressCourse,
): CourseProgress {
  try {
    const entries = JSON.parse(snapshot || "{}");
    const raw: unknown = JSON.parse(
      entries[`completed-nodes-${course.id}`] || "[]",
    );
    const valid = new Set(course.nodes.map((n) => n.id));
    const completed = Array.isArray(raw)
      ? [
          ...new Set(
            raw.filter(
              (id): id is string => typeof id === "string" && valid.has(id),
            ),
          ),
        ]
      : [];
    const last = entries[`last-node-${course.id}`];
    let visitedAt = 0;
    try {
      const activity = JSON.parse(entries[ACTIVITY] || "{}");
      if (
        typeof activity[course.id] === "number" &&
        Number.isFinite(activity[course.id])
      )
        visitedAt = activity[course.id];
    } catch {}
    return { completed, lastId: valid.has(last) ? last : null, visitedAt };
  } catch {
    return { completed: [], lastId: null, visitedAt: 0 };
  }
}
export function recordVisit(id: string, nodeId: string) {
  try {
    localStorage.setItem(`last-node-${id}`, nodeId);
    let activity: Record<string, number> = {};
    try {
      const parsed = JSON.parse(localStorage.getItem(ACTIVITY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        activity = parsed;
    } catch {}
    activity[id] = Date.now();
    localStorage.setItem(ACTIVITY, JSON.stringify(activity));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}
export function saveCompleted(id: string, completed: string[]): boolean {
  try {
    localStorage.setItem(`completed-nodes-${id}`, JSON.stringify(completed));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}
