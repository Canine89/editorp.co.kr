import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getDb } from './firebase-admin';

export const ADMIN_EMAIL = 'hgpark@goldenrabbit.co.kr';
export const POST_CATEGORIES = ['질문', '정보', '잡담'] as const;
export type PostCategory = (typeof POST_CATEGORIES)[number];
export const PAGE_SIZE = 15;

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
  const ref = await posts().add({
    ...input,
    views: 0,
    commentCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
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
  const batch = db.batch();
  batch.create(postRef.collection('comments').doc(), {
    ...input,
    createdAt: Timestamp.now(),
  });
  batch.update(postRef, { commentCount: FieldValue.increment(1) });
  await batch.commit();
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
