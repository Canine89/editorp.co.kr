import fs from 'fs';
import path from 'path';
import { getDb, isFirebaseConfigured } from './firebase-admin';

export interface RoadmapNode {
  id: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeId: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  x: number;
  y: number;
  parentId: string | null;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  order?: number;
  nodes: RoadmapNode[];
}

export interface RoadmapData {
  categories: string[];
  roadmaps: Roadmap[];
}

const EMPTY: RoadmapData = { categories: [], roadmaps: [] };

const DIFFICULTIES = new Set(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
// roadmap.id는 Firestore 문서 ID로 그대로 쓰이므로 안전한 문자만 허용한다.
const SAFE_DOC_ID = /^[A-Za-z0-9_-]{1,128}$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** 저장 전 스키마 검증 — 유효하면 null, 아니면 오류 메시지를 반환한다. */
export function validateRoadmapData(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return '데이터가 객체가 아닙니다.';
  const { categories, roadmaps } = data as Record<string, unknown>;

  if (!Array.isArray(categories) || !categories.every(isNonEmptyString)) {
    return 'categories는 비어 있지 않은 문자열 배열이어야 합니다.';
  }
  if (!Array.isArray(roadmaps)) return 'roadmaps는 배열이어야 합니다.';

  for (const [i, roadmap] of roadmaps.entries()) {
    const label = `roadmaps[${i}]`;
    if (typeof roadmap !== 'object' || roadmap === null) return `${label}이 객체가 아닙니다.`;
    const r = roadmap as Record<string, unknown>;

    if (!isNonEmptyString(r.id) || !SAFE_DOC_ID.test(r.id)) {
      return `${label}.id가 유효하지 않습니다 (영문/숫자/하이픈/언더스코어, 128자 이내).`;
    }
    if (!isNonEmptyString(r.title)) return `${label}.title이 비어 있습니다.`;
    if (typeof r.description !== 'string') return `${label}.description은 문자열이어야 합니다.`;
    if (!isNonEmptyString(r.category)) return `${label}.category가 비어 있습니다.`;
    if (typeof r.isActive !== 'boolean') return `${label}.isActive는 boolean이어야 합니다.`;
    if (r.order !== undefined && !isFiniteNumber(r.order)) return `${label}.order는 숫자여야 합니다.`;
    if (!Array.isArray(r.nodes)) return `${label}.nodes는 배열이어야 합니다.`;

    for (const [j, node] of r.nodes.entries()) {
      const nodeLabel = `${label}.nodes[${j}]`;
      if (typeof node !== 'object' || node === null) return `${nodeLabel}이 객체가 아닙니다.`;
      const n = node as Record<string, unknown>;

      if (!isNonEmptyString(n.id)) return `${nodeLabel}.id가 비어 있습니다.`;
      if (!isNonEmptyString(n.title)) return `${nodeLabel}.title이 비어 있습니다.`;
      if (n.description !== undefined && typeof n.description !== 'string') {
        return `${nodeLabel}.description은 문자열이어야 합니다.`;
      }
      if (typeof n.youtubeUrl !== 'string') return `${nodeLabel}.youtubeUrl은 문자열이어야 합니다.`;
      if (typeof n.youtubeId !== 'string') return `${nodeLabel}.youtubeId는 문자열이어야 합니다.`;
      if (typeof n.difficulty !== 'string' || !DIFFICULTIES.has(n.difficulty)) {
        return `${nodeLabel}.difficulty는 BEGINNER/INTERMEDIATE/ADVANCED 중 하나여야 합니다.`;
      }
      if (!isFiniteNumber(n.x) || !isFiniteNumber(n.y)) {
        return `${nodeLabel}의 좌표(x, y)는 숫자여야 합니다.`;
      }
      if (n.parentId !== null && !isNonEmptyString(n.parentId)) {
        return `${nodeLabel}.parentId는 null 또는 문자열이어야 합니다.`;
      }
    }
  }
  return null;
}

function readLocalRoadmapData(): RoadmapData {
  const filePath = path.join(process.cwd(), 'data', 'roadmap.json');
  if (!fs.existsSync(filePath)) {
    return EMPTY;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error('Error reading local roadmap JSON:', error);
    return EMPTY;
  }
}

/**
 * Firestore에서 로드맵 데이터를 읽는다.
 * Firestore가 미설정이거나 비어 있거나 읽기에 실패하면 data/roadmap.json으로 폴백한다.
 */
export async function getRoadmapData(): Promise<RoadmapData> {
  if (isFirebaseConfigured()) {
    try {
      const db = getDb();
      const [settingsSnap, roadmapsSnap] = await Promise.all([
        db.doc('settings/roadmap').get(),
        db.collection('roadmaps').orderBy('order').get(),
      ]);
      if (!roadmapsSnap.empty) {
        return {
          categories: (settingsSnap.data()?.categories as string[]) ?? [],
          roadmaps: roadmapsSnap.docs.map((d) => d.data() as Roadmap),
        };
      }
    } catch (error) {
      console.error('Firestore roadmap read failed, falling back to local JSON:', error);
    }
  }
  return readLocalRoadmapData();
}

/**
 * 전체 로드맵 데이터를 Firestore에 저장한다.
 * 로드맵당 1문서(roadmaps/{id}) + 카테고리(settings/roadmap)로 분해하고,
 * 에디터에서 삭제된 로드맵 문서는 함께 지운다.
 */
export async function saveRoadmapData(data: RoadmapData): Promise<void> {
  const db = getDb();
  const batch = db.batch();

  const existing = await db.collection('roadmaps').listDocuments();
  const keep = new Set(data.roadmaps.map((r) => r.id));
  for (const docRef of existing) {
    if (!keep.has(docRef.id)) {
      batch.delete(docRef);
    }
  }

  data.roadmaps.forEach((roadmap, index) => {
    batch.set(db.collection('roadmaps').doc(roadmap.id), { ...roadmap, order: index });
  });
  batch.set(db.doc('settings/roadmap'), { categories: data.categories });

  await batch.commit();
}
