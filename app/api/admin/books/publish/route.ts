import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { setBookPublished } from '@/lib/books';
import { ADMIN_EMAIL } from '@/lib/admin';

/** 도서 공개 여부 변경 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookId, isPublished } = await req.json();
    if (typeof bookId !== 'string' || typeof isPublished !== 'boolean') {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }
    const message = await setBookPublished(bookId, isPublished);
    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '저장에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
