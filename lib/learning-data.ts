import { getRoadmapData, type RoadmapData } from "./roadmap-data";
import {
  learningPaths,
  type LearningPath,
  youtubeChannel,
} from "./learning-paths";

/** 운영 추천 경로도 기존 roadmaps 컬렉션과 관리자 저장 흐름을 사용한다. */
export async function getLearningPaths(
  data?: RoadmapData,
): Promise<LearningPath[]> {
  const stored = (data ?? (await getRoadmapData())).roadmaps.filter(
    (roadmap) => roadmap.curation,
  );
  // 최초 등록 전에는 검증한 공개 영상으로 구성된 초기 경로를 보여 준다.
  if (stored.length === 0) return learningPaths;
  return stored
    .filter((roadmap) => roadmap.isActive !== false)
    .map((roadmap) => ({
      id: roadmap.id.replace(/^learn-/, ""),
      title: roadmap.title,
      summary: roadmap.description,
      topic: roadmap.category,
      ...roadmap.curation!,
      lessons: roadmap.nodes.map((node) => ({
        id: node.youtubeId,
        goal: node.description?.replace(/^실습 목표:\s*/, "") || node.title,
      })),
    }));
}

export function learningMinutes(path: LearningPath): number | null {
  let seconds = 0;
  for (const lesson of path.lessons) {
    const video = youtubeChannel.videos.find((video) => video.id === lesson.id);
    if (!video?.duration) return null;
    seconds += video.duration
      .split(":")
      .reduce((time, part) => time * 60 + Number(part), 0);
  }
  return Math.ceil(seconds / 60);
}
