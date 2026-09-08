import { notFound } from "next/navigation";
import { RoadmapCanvas } from "@/components/RoadmapCanvas";
import { RoadmapDescription } from "@/components/RoadmapDescription";
import { getRoadmapData, type Roadmap } from "@/lib/roadmap-data";

async function getRoadmap(id: string): Promise<Roadmap | null> {
  const data = await getRoadmapData();
  return data.roadmaps.find((r) => r.id === id && r.isActive !== false) || null;
}

export const revalidate = 0; // Prevent caching

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roadmap = await getRoadmap(id);

  if (!roadmap) {
    notFound();
  }

  return (
    <div className="roadmap-detail-page">
      <style>{`
        .roadmap-detail-page {
          display: flex;
          flex-direction: column;
          height: auto;
        }
        .roadmap-canvas-slot {
          padding-top: 22px;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 900px) {
          .roadmap-detail-page {
            height: auto;
          }
        }
      `}</style>

      {/* Compact Roadmap Title Band */}
      <section
        style={{
          padding: "16px 0",
          borderBottom: "1px solid var(--colors-hairline)",
          backgroundColor: "var(--colors-canvas)",
          flexShrink: 0,
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "6px",
            }}
          >
            <h1
              className="serif-display"
              style={{
                fontSize: "22px",
                margin: 0,
                color: "var(--colors-ink)",
              }}
            >
              {roadmap.title}
            </h1>
            <span
              className="badge badge-cream"
              style={{ fontSize: "11px", fontWeight: 600 }}
            >
              총 {roadmap.nodes.length}개 강의
            </span>
          </div>
          <div style={{ maxWidth: "800px" }}>
            <RoadmapDescription
              description={roadmap.description}
              isCompact={true}
            />
          </div>
        </div>
      </section>

      {/* Interactive Visual Canvas Container */}
      <div className="roadmap-canvas-slot">
        <RoadmapCanvas roadmap={roadmap} />
      </div>
    </div>
  );
}
