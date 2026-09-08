import channel from "@/data/youtube-channel.json";
import seeds from "@/data/learning-paths.json";
import type { Roadmap } from "./roadmap-data";

export const youtubeChannel = channel;
export type ChannelVideo = (typeof channel.videos)[number];

export interface LearningPath {
  id: string;
  title: string;
  summary: string;
  audience: string;
  outcome: string;
  level: string;
  topic: string;
  prerequisite: string;
  next: string[];
  lessons: { id: string; goal: string }[];
}

// 초기 추천 경로. 운영 중 편집한 경로는 Firestore에서 우선 읽는다.
export const learningPaths: LearningPath[] = seeds;

export function videoById(id: string): ChannelVideo {
  const video = channel.videos.find((item) => item.id === id);
  if (!video) throw new Error(`채널에서 확인하지 못한 영상: ${id}`);
  return video;
}

export function pathMinutes(path: LearningPath) {
  return Math.ceil(
    path.lessons.reduce((sum, lesson) => {
      const seconds = videoById(lesson.id)
        .duration.split(":")
        .reduce((time, part) => time * 60 + Number(part), 0);
      return sum + seconds;
    }, 0) / 60,
  );
}

export function asRoadmap(path: LearningPath): Roadmap {
  return {
    id: `learn-${path.id}`,
    title: path.title,
    description: path.summary,
    category: path.topic,
    isActive: true,
    curation: {
      audience: path.audience,
      outcome: path.outcome,
      level: path.level,
      prerequisite: path.prerequisite,
      next: path.next,
    },
    nodes: path.lessons.map((lesson, index) => {
      const video = videoById(lesson.id);
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
  };
}
