import { createHash, randomUUID } from 'node:crypto';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getDb, isFirebaseConfigured } from './firebase-admin';
import { isAdminEmail } from './admin';

/**
 * 도서 문단 댓글.
 *
 * 저장: Firestore `bookComments/{bookId}/sections/{sectionId}/comments/{id}` (운영).
 * Firebase 없이 띄운 개발 서버에서는 프로세스 메모리에 둔다(재시작하면 사라짐). 운영에서 Firebase가
 * 없으면 기능을 끈다.
 * 문단은 리더가 붙이는 `data-pk`(문단 글 내용의 해시, lib/reader-render.ts)로 가리킨다.
 * 원고가 바뀌어 문단이 사라진 댓글도 지우지 않고, 화면에서 "원문이 바뀐 문단의 댓글"로 모은다.
 *
 * 도배 방지(관리자 제외): 하루 5개(한국 시간 기준), 작성 간격 10초, 직전과 같은 내용 금지.
 * 지운 댓글도 그날 개수에 남는다(쓰고 지우기로 한도를 피하지 못하게).
 */

export const DAILY_COMMENT_LIMIT = 5;
export const MAX_COMMENT_LENGTH = 500;
const COOLDOWN_MS = 10_000;
const MAX_PER_SECTION = 500;
/** 리더가 붙이는 문단 키 형식: 해시 10자, 같은 글이 또 나오면 -2, -3 … */
export const PARAGRAPH_KEY = /^[0-9a-f]{10}(?:-\d{1,3})?$/;

export class CommentLimitError extends Error {}

export interface BookComment {
  id: string;
  pk: string;
  body: string;
  authorEmail: string;
  authorName: string;
  authorImage: string | null;
  createdAt: string; // ISO
}

interface Activity {
  dayKey?: string;
  today?: number;
  lastAt?: number;
  lastHash?: string;
}

export function commentsEnabled(): boolean {
  return isFirebaseConfigured() || process.env.NODE_ENV === 'development';
}

const inMemoryMode = () => !isFirebaseConfigured();

// 개발 모드 전용 메모리 저장소 (HMR에도 유지되게 globalThis에 둔다)
const memory = (() => {
  const g = globalThis as unknown as {
    __bookComments?: { comments: Map<string, BookComment[]>; activity: Map<string, Activity> };
  };
  g.__bookComments ??= { comments: new Map(), activity: new Map() };
  return g.__bookComments;
})();

function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', dateStyle: 'short' }).format(new Date());
}

const hashOf = (body: string) => createHash('sha256').update(body).digest('hex');
const sectionRef = (bookId: string, sectionId: string) =>
  getDb().collection('bookComments').doc(bookId).collection('sections').doc(sectionId).collection('comments');

function toComment(id: string, d: FirebaseFirestore.DocumentData): BookComment {
  return {
    id,
    pk: d.pk,
    body: d.body,
    authorEmail: d.authorEmail,
    authorName: d.authorName,
    authorImage: d.authorImage ?? null,
    createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date(0).toISOString(),
  };
}

export async function listSectionComments(bookId: string, sectionId: string): Promise<BookComment[]> {
  if (inMemoryMode()) return [...(memory.comments.get(`${bookId}/${sectionId}`) ?? [])];
  const snap = await sectionRef(bookId, sectionId).orderBy('createdAt', 'asc').limit(MAX_PER_SECTION).get();
  return snap.docs.map((d) => toComment(d.id, d.data()));
}

/** 오늘 더 쓸 수 있는 댓글 수. 관리자는 제한이 없어 null */
export async function remainingToday(email: string): Promise<number | null> {
  if (isAdminEmail(email)) return null;
  const act = await readActivity(email);
  const used = act.dayKey === todayKey() ? (act.today ?? 0) : 0;
  return Math.max(0, DAILY_COMMENT_LIMIT - used);
}

async function readActivity(email: string): Promise<Activity> {
  if (inMemoryMode()) return memory.activity.get(email) ?? {};
  const d = (await getDb().collection('userActivity').doc(email).get()).data() ?? {};
  return fromStored(d);
}

function fromStored(d: FirebaseFirestore.DocumentData): Activity {
  return {
    dayKey: d.bookCommentsDayKey,
    today: d.bookCommentsToday,
    lastAt: d.lastBookCommentAt instanceof Timestamp ? d.lastBookCommentAt.toMillis() : 0,
    lastHash: d.lastBookCommentHash,
  };
}

/** 한도를 검사하고 다음 활동 기록을 돌려준다. 넘으면 CommentLimitError */
function checkLimit(act: Activity, body: string): Activity {
  const now = Date.now();
  const since = now - (act.lastAt ?? 0);
  if (since < COOLDOWN_MS) {
    throw new CommentLimitError(`너무 빨라요. ${Math.ceil((COOLDOWN_MS - since) / 1000)}초 뒤에 다시 남겨 주세요.`);
  }
  const day = todayKey();
  const used = act.dayKey === day ? (act.today ?? 0) : 0;
  if (used >= DAILY_COMMENT_LIMIT) {
    throw new CommentLimitError(`댓글은 하루 ${DAILY_COMMENT_LIMIT}개까지 남길 수 있어요. 내일 다시 남겨 주세요.`);
  }
  const hash = hashOf(body);
  if (act.lastHash === hash) throw new CommentLimitError('직전에 남긴 댓글과 같은 내용이에요.');
  return { dayKey: day, today: used + 1, lastAt: now, lastHash: hash };
}

export async function addSectionComment(input: {
  bookId: string;
  sectionId: string;
  pk: string;
  body: string;
  authorEmail: string;
  authorName: string;
  authorImage: string | null;
}): Promise<BookComment> {
  const { bookId, sectionId, ...fields } = input;
  const exempt = isAdminEmail(input.authorEmail);

  if (inMemoryMode()) {
    if (!exempt) memory.activity.set(input.authorEmail, checkLimit(memory.activity.get(input.authorEmail) ?? {}, input.body));
    const comment: BookComment = { id: randomUUID(), ...fields, createdAt: new Date().toISOString() };
    const key = `${bookId}/${sectionId}`;
    memory.comments.set(key, [...(memory.comments.get(key) ?? []), comment]);
    return comment;
  }

  const db = getDb();
  const ref = sectionRef(bookId, sectionId).doc();
  const createdAt = Timestamp.now();
  await db.runTransaction(async (tx) => {
    if (!exempt) {
      const actRef = db.collection('userActivity').doc(input.authorEmail);
      const next = checkLimit(fromStored((await tx.get(actRef)).data() ?? {}), input.body);
      tx.set(
        actRef,
        {
          bookCommentsDayKey: next.dayKey,
          bookCommentsToday: next.today,
          lastBookCommentAt: Timestamp.fromMillis(next.lastAt!),
          lastBookCommentHash: next.lastHash,
        },
        { merge: true },
      );
    }
    tx.create(ref, { ...fields, bookId, sectionId, createdAt });
    // 관리자 화면에서 책별로 훑어볼 수 있게 책 문서에 개수를 둔다
    tx.set(db.collection('bookComments').doc(bookId), { count: FieldValue.increment(1) }, { merge: true });
  });
  return { id: ref.id, ...fields, createdAt: createdAt.toDate().toISOString() };
}

/** 작성자 본인 또는 관리자만 지운다 */
export async function deleteSectionComment(
  bookId: string,
  sectionId: string,
  id: string,
  requesterEmail: string,
): Promise<'ok' | 'not-found' | 'forbidden'> {
  const allowed = (c: { authorEmail: string }) => isAdminEmail(requesterEmail) || c.authorEmail === requesterEmail;

  if (inMemoryMode()) {
    const key = `${bookId}/${sectionId}`;
    const list = memory.comments.get(key) ?? [];
    const found = list.find((c) => c.id === id);
    if (!found) return 'not-found';
    if (!allowed(found)) return 'forbidden';
    memory.comments.set(key, list.filter((c) => c.id !== id));
    return 'ok';
  }

  const db = getDb();
  const ref = sectionRef(bookId, sectionId).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return 'not-found';
  if (!allowed(snap.data() as { authorEmail: string })) return 'forbidden';
  const batch = db.batch();
  batch.delete(ref);
  batch.set(db.collection('bookComments').doc(bookId), { count: FieldValue.increment(-1) }, { merge: true });
  await batch.commit();
  return 'ok';
}
