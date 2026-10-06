import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { revertBookSections } from '@/lib/books';
import { isAdminEmail } from '@/lib/admin';

/**
 * 책 한 권에서 사이트에서 고친 절(오버레이)을 모두 지우고 파일 원본으로 되돌린다.
 * 원고를 재임포트한 뒤 옛 오버레이가 새 원고를 가릴 때 쓴다.
 * 방어 2겹: middleware(관리자 이메일 + same-origin) → 여기서 세션 재검사.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookId } = await req.json();
    if (typeof bookId !== 'string') {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }
    const message = await revertBookSections(bookId);
    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '되돌리기에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
