import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { ADMIN_EMAIL, deleteQuestion, getQuestion } from '@/lib/qna';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: '게시판이 아직 준비되지 않았습니다.' }, { status: 503 });
  }

  try {
    const { id } = await params;
    const question = await getQuestion(id);
    if (!question) {
      return NextResponse.json({ error: '질문을 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAdmin = session.user.email === ADMIN_EMAIL;
    const isAuthor = session.user.email === question.authorEmail;
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    await deleteQuestion(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
