import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { saveRoadmapData, validateRoadmapData } from '@/lib/roadmap-data';
import { isAdminEmail } from '@/lib/admin';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  // 1. Session Verification
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();

    // 스키마 검증 — 구조가 깨진 데이터가 Firestore/로컬 파일을 오염시키지 않도록 차단
    const validationError = validateRoadmapData(data);
    if (validationError) {
      return NextResponse.json(
        { error: `잘못된 데이터 형식: ${validationError}` },
        { status: 400 }
      );
    }

    // 2. Firestore가 설정되어 있으면 Firestore에 저장 (재배포 없이 즉시 반영)
    if (isFirebaseConfigured()) {
      await saveRoadmapData(data);
      return NextResponse.json({
        success: true,
        message: 'Firestore에 저장되었습니다. 재배포 없이 바로 반영됩니다.',
      });
    }

    // 3. Firestore 미설정 + 개발 모드 -> 로컬 파일에 저장
    if (process.env.NODE_ENV === 'development') {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(dataDir, 'roadmap.json'),
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      return NextResponse.json({
        success: true,
        message: '개발 모드: 로컬 data/roadmap.json에 저장되었습니다.',
      });
    }

    return NextResponse.json(
      { error: 'Firebase 환경 변수가 설정되지 않아 저장할 수 없습니다.' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
