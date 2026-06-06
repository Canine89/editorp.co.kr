import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  // 1. Session Verification
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== 'hgpark@goldenrabbit.co.kr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();

    // Validate that the JSON structure matches our schema
    if (!data.categories || !data.roadmaps) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // 2. Development Mode -> Write to local disk
    if (process.env.NODE_ENV === 'development') {
      const dataDir = path.join(process.cwd(), 'data');
      
      // Ensure the directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, 'roadmap.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      
      return NextResponse.json({ 
        success: true, 
        message: '개발 모드: 로컬 data/roadmap.json에 저장되었습니다.' 
      });
    }

    // 3. Production Mode -> Commit to GitHub via API
    const token = process.env.GITHUB_PAT;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const filePath = 'data/roadmap.json';

    if (!token || !owner || !repo) {
      return NextResponse.json({ 
        error: 'GitHub API 환경 변수(GITHUB_PAT, GITHUB_OWNER, GITHUB_REPO)가 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    
    // Get the current file SHA first to update the content
    let sha = '';
    try {
      const getFileRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      });

      if (getFileRes.ok) {
        const fileInfo = await getFileRes.json();
        sha = fileInfo.sha;
      }
    } catch (err) {
      console.warn('Existing file sha fetch failed, attempting to create new file.', err);
    }

    // Commit changes to GitHub
    const commitMessage = 'admin: update data/roadmap.json via roadmap visual editor';
    const contentBase64 = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    
    const updateRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentBase64,
        sha: sha || undefined, // undefined will create the file if it doesn't exist
      }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return NextResponse.json({ 
        error: `GitHub API 업데이트 실패: ${errText}` 
      }, { status: 502 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '프로덕션 모드: GitHub 저장소에 변경사항을 성공적으로 커밋했습니다. Vercel 재배포가 진행됩니다.' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
