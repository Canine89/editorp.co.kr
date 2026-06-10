/**
 * data/roadmap.json -> Firestore 1회성 마이그레이션 스크립트.
 *
 * 사용법:
 *   node scripts/migrate-roadmap.mjs
 *
 * .env.local(또는 환경 변수)에 다음 값이 필요합니다:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// .env.local 간이 로더 (이미 환경 변수가 있으면 건드리지 않음)
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error('FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY 가 필요합니다.');
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore(app);

const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'roadmap.json'), 'utf8'));

const batch = db.batch();
data.roadmaps.forEach((roadmap, index) => {
  batch.set(db.collection('roadmaps').doc(roadmap.id), { ...roadmap, order: index });
});
batch.set(db.doc('settings/roadmap'), { categories: data.categories });

await batch.commit();
console.log(`마이그레이션 완료: 로드맵 ${data.roadmaps.length}개, 카테고리 ${data.categories.length}개`);
process.exit(0);
