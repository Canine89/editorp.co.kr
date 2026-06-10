import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { getDb } from './firebase-admin';

export const ADMIN_EMAIL = 'hgpark@goldenrabbit.co.kr';

export interface QuestionAnswer {
  body: string;
  createdAt: string; // ISO
}

export interface Question {
  id: string;
  title: string;
  body: string;
  authorEmail: string;
  authorName: string;
  createdAt: string; // ISO
  status: 'pending' | 'answered';
  answer?: QuestionAnswer;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return typeof value === 'string' ? value : new Date(0).toISOString();
}

function toQuestion(id: string, data: FirebaseFirestore.DocumentData): Question {
  return {
    id,
    title: data.title ?? '',
    body: data.body ?? '',
    authorEmail: data.authorEmail ?? '',
    authorName: data.authorName ?? '익명',
    createdAt: toIso(data.createdAt),
    status: data.status === 'answered' ? 'answered' : 'pending',
    answer: data.answer
      ? { body: data.answer.body ?? '', createdAt: toIso(data.answer.createdAt) }
      : undefined,
  };
}

export async function listQuestions(max = 50): Promise<Question[]> {
  const snap = await getDb()
    .collection('questions')
    .orderBy('createdAt', 'desc')
    .limit(max)
    .get();
  return snap.docs.map((d) => toQuestion(d.id, d.data()));
}

export async function getQuestion(id: string): Promise<Question | null> {
  const snap = await getDb().collection('questions').doc(id).get();
  return snap.exists ? toQuestion(snap.id, snap.data()!) : null;
}

export async function createQuestion(input: {
  title: string;
  body: string;
  authorEmail: string;
  authorName: string;
}): Promise<string> {
  const ref = await getDb().collection('questions').add({
    ...input,
    status: 'pending',
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function answerQuestion(id: string, body: string): Promise<void> {
  await getDb().collection('questions').doc(id).update({
    answer: { body, createdAt: Timestamp.now() },
    status: 'answered',
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await getDb().collection('questions').doc(id).delete();
}
