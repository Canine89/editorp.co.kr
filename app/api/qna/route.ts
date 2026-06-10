import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { createQuestion } from '@/lib/qna';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: '게시판이 아직 준비되지 않았습니다.' }, { status: 503 });
  }

  try {
    const { title, body } = await req.json();
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedBody = typeof body === 'string' ? body.trim() : '';

    if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
      return NextResponse.json({ error: '제목은 2~120자로 입력해 주세요.' }, { status: 400 });
    }
    if (trimmedBody.length < 2 || trimmedBody.length > 5000) {
      return NextResponse.json({ error: '내용은 2~5000자로 입력해 주세요.' }, { status: 400 });
    }

    const id = await createQuestion({
      title: trimmedTitle,
      body: trimmedBody,
      authorEmail: session.user.email,
      authorName: session.user.name || '익명',
    });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
