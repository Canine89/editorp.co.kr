import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/AdminDashboard';

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

interface RoadmapData {
  categories: string[];
  roadmaps: Roadmap[];
}

function getRoadmapData(): RoadmapData {
  const filePath = path.join(process.cwd(), 'data', 'roadmap.json');
  if (!fs.existsSync(filePath)) {
    return { categories: ['AI', 'Agent', 'Vibe Coding'], roadmaps: [] };
  }
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading roadmap JSON in admin page:', error);
    return { categories: ['AI', 'Agent', 'Vibe Coding'], roadmaps: [] };
  }
}

export const revalidate = 0; // Disable server-side routing cache

export default async function AdminPage() {
  // Session check
  const session = await getServerSession(authOptions);
  
  if (!session || session.user?.email !== 'hgpark@goldenrabbit.co.kr') {
    redirect('/auth/unauthorized');
  }

  const initialData = getRoadmapData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <AdminDashboard initialData={initialData} />
    </div>
  );
}
