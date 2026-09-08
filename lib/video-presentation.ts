import labels from "@/data/lesson-labels.json";

export function lessonTitle(id: string, original: string): string {
  const label = (
    labels as Record<string, { title: string; originalTitle: string }>
  )[id];
  // 관리자가 바꾼 제목은 별칭으로 덮어쓰지 않는다.
  if (label) return label.originalTitle === original ? label.title : original;
  return original.replace(/^(?:\[[^\]]+\]\s*)+/, "").trim() || original;
}
export function searchText(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/claude/g, "클로드")
    .replace(/cursor/g, "커서")
    .replace(/codex/g, "코덱스")
    .replace(/chatgpt|챗\s*gpt/g, "챗지피티")
    .replace(/\s+/g, " ")
    .trim();
}
