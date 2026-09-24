import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../auth/[...nextauth]/route';
import { commentsEnabled, deleteSectionComment } from '@/lib/book-comments';
import { isSameOrigin, sectionExists } from '../shared';

const SAFE_COMMENT_ID = /^[A-Za-z0-9-]{1,40}$/;

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string; sectionId: string; commentId: string }> },
) {
  const { bookId, sectionId, commentId } = await params;
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (!commentsEnabled()) return NextResponse.json({ error: '댓글 기능이 아직 준비되지 않았습니다.' }, { status: 503 });
  if (!SAFE_COMMENT_ID.test(commentId) || !(await sectionExists(bookId, sectionId))) {
    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
  }

  try {
    const result = await deleteSectionComment(bookId, sectionId, commentId, email);
    if (result === 'not-found') return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
    if (result === 'forbidden') return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('문단 댓글 삭제 실패', error);
    return NextResponse.json({ error: '댓글을 지우지 못했습니다.' }, { status: 500 });
  }
}
