/** 내용 없이 남은 알려진 학습 안내 표제만 읽기 화면에서 숨긴다. 원고와 관리자 편집 내용은 보존한다. */
export function removeEmptyStudyLabels(html: string): string {
  const label = String.raw`<p>\s*<strong>\[(?:학습 목표|핵심 키워드|여기서 공부하는 내용)\]<\/strong>\s*<\/p>`;
  return html.replace(new RegExp(`${label}\\s*(?=${label}|$)`, "g"), "");
}
