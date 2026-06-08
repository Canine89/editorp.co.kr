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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Roadmap Title Band */}
      <section
        style={{
          padding: 'var(--spacing-lg) 0',
          borderBottom: '1px solid var(--colors-hairline)',
          backgroundColor: 'var(--colors-canvas)',
        }}
      >
        <div className="container">
          <h1
            className="serif-display"
            style={{
              fontSize: '32px',
              marginBottom: '8px',
              color: 'var(--colors-ink)',
            }}
          >
            {roadmap.title}
          </h1>
          <div style={{ maxWidth: '800px' }}>
            <RoadmapDescription description={roadmap.description} />
          </div>
        </div>
      </section>

      {/* Interactive Visual Canvas Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <RoadmapCanvas roadmap={roadmap} />
      </div>
    </div>
  );
}
