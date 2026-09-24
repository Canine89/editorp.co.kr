import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { isAdminEmail } from '@/lib/admin';
import {
  addSectionComment,
  commentsEnabled,
  CommentLimitError,
  DAILY_COMMENT_LIMIT,
  listSectionComments,
  MAX_COMMENT_LENGTH,
  PARAGRAPH_KEY,
  remainingToday,
  type BookComment,
} from '@/lib/book-comments';
import { isSameOrigin, sectionExists } from './shared';

type Params = { params: Promise<{ bookId: string; sectionId: string }> };

/** 화면에 내보내는 모양: 작성자 이메일은 빼고, 지울 수 있는지만 알려준다 */
function toPublic(c: BookComment, email: string | null) {
  return {
    id: c.id,
    pk: c.pk,
    body: c.body,
    authorName: c.authorName,
    authorImage: c.authorImage,
    createdAt: c.createdAt,
    mine: Boolean(email) && c.authorEmail === email,
    canDelete: Boolean(email) && (c.authorEmail === email || isAdminEmail(email)),
  };
}

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(_req: NextRequest, { params }: Params) {
  const { bookId, sectionId } = await params;
  if (!commentsEnabled()) return NextResponse.json({ enabled: false }, { headers: noStore });
  if (!(await sectionExists(bookId, sectionId))) {
    return NextResponse.json({ error: '절을 찾을 수 없습니다.' }, { status: 404 });
  }
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    const [comments, remaining] = await Promise.all([
      listSectionComments(bookId, sectionId),
      email ? remainingToday(email) : Promise.resolve(0),
    ]);
    return NextResponse.json(
      {
        enabled: true,
        loggedIn: Boolean(email),
        limit: DAILY_COMMENT_LIMIT,
        maxLength: MAX_COMMENT_LENGTH,
        remaining, // null = 관리자(제한 없음)
        comments: comments.map((c) => toPublic(c, email)),
      },
      { headers: noStore },
    );
  } catch (error) {
    console.error('문단 댓글 불러오기 실패', error);
    return NextResponse.json({ error: '댓글을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { bookId, sectionId } = await params;
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  if (!commentsEnabled()) return NextResponse.json({ error: '댓글 기능이 아직 준비되지 않았습니다.' }, { status: 503 });
  if (!(await sectionExists(bookId, sectionId))) {
    return NextResponse.json({ error: '절을 찾을 수 없습니다.' }, { status: 404 });
  }

  let input: { pk?: unknown; body?: unknown };
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }
  const pk = typeof input.pk === 'string' ? input.pk : '';
  // 제어 문자는 지우고(줄바꿈·탭은 남김), 빈 줄이 여러 개면 하나로
  const body =
    typeof input.body === 'string'
      ? input.body.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\n{3,}/g, '\n\n').trim()
      : '';
  if (!PARAGRAPH_KEY.test(pk)) return NextResponse.json({ error: '문단을 찾을 수 없습니다.' }, { status: 400 });
  if (body.length < 1 || body.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: `댓글은 1~${MAX_COMMENT_LENGTH}자로 남겨 주세요.` }, { status: 400 });
  }

  try {
    const comment = await addSectionComment({
      bookId,
      sectionId,
      pk,
      body,
      authorEmail: email,
      authorName: (session.user?.name || '독자').slice(0, 40),
      authorImage: /^https:\/\//.test(session.user?.image ?? '') ? session.user!.image! : null,
    });
    return NextResponse.json({ comment: toPublic(comment, email), remaining: await remainingToday(email) });
  } catch (error) {
    if (error instanceof CommentLimitError) return NextResponse.json({ error: error.message }, { status: 429 });
    console.error('문단 댓글 저장 실패', error);
    return NextResponse.json({ error: '댓글을 저장하지 못했습니다.' }, { status: 500 });
  }
}
