import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { ADMIN_EMAIL, answerQuestion, getQuestion } from '@/lib/qna';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: '운영자만 답변할 수 있습니다.' }, { status: 403 });
  }
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: '게시판이 아직 준비되지 않았습니다.' }, { status: 503 });
  }

  try {
    const { id } = await params;
    if (!(await getQuestion(id))) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { body } = await req.json();
    const trimmed = typeof body === 'string' ? body.trim() : '';
    if (trimmed.length < 1 || trimmed.length > 10000) {
      return NextResponse.json({ error: '답변 내용을 입력해 주세요.' }, { status: 400 });
    }

    await answerQuestion(id, trimmed);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
