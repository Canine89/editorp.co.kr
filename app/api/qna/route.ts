import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { isFirebaseConfigured } from '@/lib/firebase-admin';
import { createPost, POST_CATEGORIES, RateLimitError, type PostCategory } from '@/lib/qna';
import { sanitizePostHtml, htmlToText } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }
  if (!isFirebaseConfigured()) {
    return NextResponse.json({ error: '게시판이 아직 준비되지 않았습니다.' }, { status: 503 });
  }

  try {
    const { title, body, category } = await req.json();
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    // 리치텍스트 HTML은 서버에서 허용 태그만 남기고 정화한다 (XSS 방지)
    const safeBody = sanitizePostHtml(typeof body === 'string' ? body : '');
    const bodyText = htmlToText(safeBody);

    if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
      return NextResponse.json({ error: '제목은 2~120자로 입력해 주세요.' }, { status: 400 });
    }
    if (bodyText.length < 2 || safeBody.length > 100000) {
      return NextResponse.json({ error: '내용은 2자 이상으로 입력해 주세요.' }, { status: 400 });
    }
    if (!(POST_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: '말머리를 선택해 주세요.' }, { status: 400 });
    }

    const id = await createPost({
      title: trimmedTitle,
      body: safeBody,
      format: 'html',
      category: category as PostCategory,
      authorEmail: session.user.email,
      authorName: session.user.name || '익명',
    });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
