import Image from "next/image";
import manifest from "@/public/character/manifest.json";

export type CharacterId = keyof typeof manifest;

/**
 * 편집자P 클레이 캐릭터 삽화 (public/character/*.webp, 투명 배경).
 * 이미지 아래 끝이 캐릭터 아랫면이라, 바로 아래 구분선 위에 앉힌 것처럼 보인다.
 * 정보를 전달하지 않는 장식이므로 alt는 비운다. 배치 규칙은 DESIGN.md "캐릭터" 절.
 */
export function Character({
  id,
  height = 104,
  align = "right",
  className,
}: {
  id: CharacterId;
  height?: number;
  align?: "right" | "left" | "center";
  className?: string;
}) {
  const { width, height: h } = manifest[id];
  return (
    <Image
      src={`/character/${id}.webp`}
      alt=""
      width={width}
      height={h}
      className={["perch", align === "right" ? "" : align, className].filter(Boolean).join(" ")}
      style={{ "--h": `${height}px` } as React.CSSProperties}
      sizes={`${Math.ceil((height * width) / h)}px`}
    />
  );
}
