import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { RoadmapCanvas } from '@/components/RoadmapCanvas';
import { RoadmapDescription } from '@/components/RoadmapDescription';


interface Node {
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

interface Roadmap {
  id: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  nodes: Node[];
}

function getRoadmap(id: string): Roadmap | null {
  const filePath = path.join(process.cwd(), 'data', 'roadmap.json');
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    const roadmap = data.roadmaps.find((r: Roadmap) => r.id === id && r.isActive !== false);
    return roadmap || null;
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    return null;
  }
}

export const revalidate = 0; // Prevent caching

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roadmap = getRoadmap(id);

  if (!roadmap) {
    notFound();
  }

  return (
    <div className="roadmap-detail-page">
      <style>{`
        .roadmap-detail-page {
          display: flex;
          flex-direction: column;
          /* Fill the viewport below the 64px sticky header so the canvas gets a bounded height */
          height: calc(100dvh - 64px);
        }
        .roadmap-canvas-slot {
          flex: 1;
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
          padding: '16px 0',
          borderBottom: '1px solid var(--colors-hairline)',
          backgroundColor: 'var(--colors-canvas)',
          flexShrink: 0,
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1
              className="serif-display"
              style={{
                fontSize: '22px',
                margin: 0,
                color: 'var(--colors-ink)',
              }}
            >
              {roadmap.title}
            </h1>
            <span className="badge badge-cream" style={{ fontSize: '11px', fontWeight: 600 }}>
              총 {roadmap.nodes.length}개 강의
            </span>
          </div>
          <div style={{ maxWidth: '800px' }}>
            <RoadmapDescription description={roadmap.description} isCompact={true} />
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
