import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { ADMIN_EMAIL, deleteComment, getComment } from '@/lib/qna';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: '게시판이 아직 준비되지 않았습니다.' }, { status: 503 });
  }

  try {
    const { id, commentId } = await params;
    const comment = await getComment(id, commentId);
    if (!comment) {
      return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAdmin = session.user.email === ADMIN_EMAIL;
    const isAuthor = session.user.email === comment.authorEmail;
    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    await deleteComment(id, commentId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
