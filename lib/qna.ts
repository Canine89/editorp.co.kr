import { createHash } from 'node:crypto';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getDb } from './firebase-admin';

import { ADMIN_EMAIL } from './admin';

export { ADMIN_EMAIL };
export const POST_CATEGORIES = ['질문', '정보', '잡담'] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];
export const PAGE_SIZE = 15;

/** 도배 방지 한도 — 운영자(ADMIN_EMAIL)는 적용 제외 */
const POST_COOLDOWN_MS = 60_000; // 글 작성 간격 60초
const DAILY_POST_LIMIT = 20; // 하루 글 한도
const COMMENT_COOLDOWN_MS = 10_000; // 댓글 작성 간격 10초

/** 작성 한도 초과 시 던지는 오류 — API에서 429로 변환 */
export class RateLimitError extends Error {}

function contentHash(title: string, body: string): string {
  return createHash('sha256').update(`${title}\n${body}`).digest('hex');
}

function todayKey(): string {
  // 한국 시간 기준 날짜로 일일 한도를 계산
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', dateStyle: 'short' }).format(
    new Date()
  );
}

function toMillis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

// 목록/검색은 최신 글 MAX_SCAN개 안에서 서버 메모리 필터링한다.
// Firestore에 전문 검색이 없고, 이 규모(수백 글)에서는 이 방식이 가장 단순하고 충분하다.
const MAX_SCAN = 500;

export interface Post {
  id: string;
  title: string;
  body: string;
  /** 'html': 리치텍스트(정화된 HTML) · 'text': 구버전 일반 텍스트 */
  format: 'html' | 'text';
  category: PostCategory;
  authorEmail: string;
  authorName: string;
  createdAt: string; // ISO
  views: number;
  commentCount: number;
}

export interface PostComment {
  id: string;
  body: string;
  authorEmail: string;
  authorName: string;
  isAdmin: boolean;
  createdAt: string; // ISO
}

export interface PostListResult {
  posts: Post[];
  total: number;
  page: number;
  totalPages: number;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return typeof value === 'string' ? value : new Date(0).toISOString();
}

function toPost(id: string, data: FirebaseFirestore.DocumentData): Post {
  return {
    id,
    title: data.title ?? '',
    body: data.body ?? '',
    format: data.format === 'html' ? 'html' : 'text',
    category: POST_CATEGORIES.includes(data.category) ? data.category : '질문',
    authorEmail: data.authorEmail ?? '',
    authorName: data.authorName ?? '익명',
    createdAt: toIso(data.createdAt),
    views: typeof data.views === 'number' ? data.views : 0,
    commentCount: typeof data.commentCount === 'number' ? data.commentCount : 0,
  };
}

function toComment(id: string, data: FirebaseFirestore.DocumentData): PostComment {
  return {
    id,
    body: data.body ?? '',
    authorEmail: data.authorEmail ?? '',
    authorName: data.authorName ?? '익명',
    isAdmin: data.isAdmin === true,
    createdAt: toIso(data.createdAt),
  };
}

function posts(db = getDb()) {
  return db.collection('questions');
}

export async function listPosts(opts: {
  page?: number;
  q?: string;
  cat?: string;
}): Promise<PostListResult> {
  const snap = await posts().orderBy('createdAt', 'desc').limit(MAX_SCAN).get();
  let all = snap.docs.map((d) => toPost(d.id, d.data()));

  if (opts.cat && (POST_CATEGORIES as readonly string[]).includes(opts.cat)) {
    all = all.filter((p) => p.category === opts.cat);
  }
  const q = opts.q?.trim().toLowerCase();
  if (q) {
    all = all.filter((p) => p.title.toLowerCase().includes(q));
  }

  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, opts.page || 1), totalPages);
  return {
    posts: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    totalPages,
  };
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await posts().doc(id).get();
  return snap.exists ? toPost(snap.id, snap.data()!) : null;
}

export async function incrementViews(id: string): Promise<void> {
  try {
    await posts().doc(id).update({ views: FieldValue.increment(1) });
  } catch {
    // 조회수 증가 실패는 페이지 렌더링을 막지 않는다
  }
}

export async function createPost(input: {
  title: string;
  body: string;
  format: 'html' | 'text';
  category: PostCategory;
  authorEmail: string;
  authorName: string;
}): Promise<string> {
  const db = getDb();
  const postRef = posts(db).doc();
  const isAdmin = input.authorEmail === ADMIN_EMAIL;

  await db.runTransaction(async (tx) => {
    if (!isAdmin) {
      const actRef = db.collection('userActivity').doc(input.authorEmail);
      const act = (await tx.get(actRef)).data() ?? {};
      const now = Date.now();

      const sinceLast = now - toMillis(act.lastPostAt);
      if (sinceLast < POST_COOLDOWN_MS) {
        const wait = Math.ceil((POST_COOLDOWN_MS - sinceLast) / 1000);
        throw new RateLimitError(`도배 방지를 위해 ${wait}초 후에 다시 글을 쓸 수 있어요.`);
      }

      const day = todayKey();
      const postsToday = act.postsDayKey === day ? (act.postsToday ?? 0) : 0;
      if (postsToday >= DAILY_POST_LIMIT) {
        throw new RateLimitError(`하루 글 작성 한도(${DAILY_POST_LIMIT}개)에 도달했어요. 내일 다시 작성해 주세요.`);
      }

      const hash = contentHash(input.title, input.body);
      if (act.lastPostHash === hash) {
        throw new RateLimitError('직전에 작성한 글과 같은 내용이에요.');
      }

      tx.set(
        actRef,
        { lastPostAt: Timestamp.now(), postsDayKey: day, postsToday: postsToday + 1, lastPostHash: hash },
        { merge: true }
      );
    }

    tx.create(postRef, {
      ...input,
      views: 0,
      commentCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  return postRef.id;
}

export async function deletePost(id: string): Promise<void> {
  const db = getDb();
  const postRef = posts(db).doc(id);
  const comments = await postRef.collection('comments').listDocuments();
  const batch = db.batch();
  comments.forEach((c) => batch.delete(c));
  batch.delete(postRef);
  await batch.commit();
}

export async function listComments(postId: string): Promise<PostComment[]> {
  const snap = await posts().doc(postId).collection('comments').orderBy('createdAt', 'asc').get();
  return snap.docs.map((d) => toComment(d.id, d.data()));
}

export async function addComment(
  postId: string,
  input: { body: string; authorEmail: string; authorName: string; isAdmin: boolean }
): Promise<void> {
  const db = getDb();
  const postRef = posts(db).doc(postId);

  await db.runTransaction(async (tx) => {
    if (!input.isAdmin) {
      const actRef = db.collection('userActivity').doc(input.authorEmail);
      const act = (await tx.get(actRef)).data() ?? {};
      const sinceLast = Date.now() - toMillis(act.lastCommentAt);
      if (sinceLast < COMMENT_COOLDOWN_MS) {
        const wait = Math.ceil((COMMENT_COOLDOWN_MS - sinceLast) / 1000);
        throw new RateLimitError(`도배 방지를 위해 ${wait}초 후에 다시 댓글을 쓸 수 있어요.`);
      }
      tx.set(actRef, { lastCommentAt: Timestamp.now() }, { merge: true });
    }

    tx.create(postRef.collection('comments').doc(), {
      ...input,
      createdAt: Timestamp.now(),
    });
    tx.update(postRef, { commentCount: FieldValue.increment(1) });
  });
}

export async function getComment(postId: string, commentId: string): Promise<PostComment | null> {
  const snap = await posts().doc(postId).collection('comments').doc(commentId).get();
  return snap.exists ? toComment(snap.id, snap.data()!) : null;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  const db = getDb();
  const postRef = posts(db).doc(postId);
  const batch = db.batch();
  batch.delete(postRef.collection('comments').doc(commentId));
  batch.update(postRef, { commentCount: FieldValue.increment(-1) });
  await batch.commit();
}
