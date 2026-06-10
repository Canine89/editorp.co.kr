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
