/** 추천 경로를 기존 Firestore roadmaps에 추가한다. 기존 문서는 절대 덮어쓰지 않는다. */
import fs from "node:fs";
import { createRequire } from "node:module";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
const require = createRequire(import.meta.url);
const paths = JSON.parse(
  fs.readFileSync(
    new URL("../data/learning-paths.json", import.meta.url),
    "utf8",
  ),
);
const channel = JSON.parse(
  fs.readFileSync(
    new URL("../data/youtube-channel.json", import.meta.url),
    "utf8",
  ),
);
const roadmaps = paths.map((path, order) => ({
  id: `learn-${path.id}`,
  title: path.title,
  description: path.summary,
  category: path.topic,
  isActive: true,
  order: 1000 + order,
  curation: {
    audience: path.audience,
    outcome: path.outcome,
    level: path.level,
    prerequisite: path.prerequisite,
    next: path.next,
  },
  nodes: path.lessons.map((lesson, index) => {
    const video = channel.videos.find((video) => video.id === lesson.id);
    if (!video || video.membersOnly)
      throw new Error(`공개 강의 확인 필요: ${lesson.id}`);
    return {
      id: video.id,
      title: video.title,
      description: `실습 목표: ${lesson.goal}`,
      youtubeId: video.id,
      youtubeUrl: video.url,
      difficulty:
        path.level === "심화"
          ? "ADVANCED"
          : path.level === "활용"
            ? "INTERMEDIATE"
            : "BEGINNER",
      x: 300,
      y: 75 + index * 120,
      parentId: index ? path.lessons[index - 1].id : null,
    };
  }),
}));
if (!process.argv.includes("--apply")) {
  console.log(
    "미리보기: 기존 데이터를 보존하고 다음 추천 로드맵을 추가합니다.",
  );
  console.log(
    roadmaps.map((r) => `${r.id}: ${r.title} (${r.nodes.length}강)`).join("\n"),
  );
  console.log("Firestore 반영: node scripts/import-learning-paths.mjs --apply");
  process.exit(0);
}
require("@next/env").loadEnvConfig(process.cwd());
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
  process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY)
  throw new Error("Firebase 환경 변수가 필요합니다.");
const db = getFirestore(
  initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  }),
);
const added = await db.runTransaction(async (transaction) => {
  const refs = roadmaps.map((r) => db.collection("roadmaps").doc(r.id));
  const snapshots = await transaction.getAll(...refs);
  const settingsRef = db.doc("settings/roadmap");
  const settings = await transaction.get(settingsRef);
  let count = 0;
  snapshots.forEach((snapshot, index) => {
    if (!snapshot.exists) {
      transaction.create(refs[index], roadmaps[index]);
      count++;
    }
  });
  const categories = [
    ...new Set([
      ...(settings.data()?.categories ?? []),
      ...roadmaps.map((r) => r.category),
    ]),
  ];
  transaction.set(settingsRef, { categories }, { merge: true });
  return count;
});
console.log(`완료: ${added}개 추가. 기존 로드맵은 보존했습니다.`);
await db.terminate();
