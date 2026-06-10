import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { ADMIN_EMAIL, addComment, getPost, RateLimitError } from '@/lib/qna';

export async function POST(
  req: NextRequest,
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
    if (!(await getPost(id))) {
      return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });
    }

    const { body } = await req.json();
    const trimmed = typeof body === 'string' ? body.trim() : '';
    if (trimmed.length < 1 || trimmed.length > 2000) {
      return NextResponse.json({ error: '댓글은 1~2000자로 입력해 주세요.' }, { status: 400 });
    }

    await addComment(id, {
      body: trimmed,
      authorEmail: session.user.email,
      authorName: session.user.name || '익명',
      isAdmin: session.user.email === ADMIN_EMAIL,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
