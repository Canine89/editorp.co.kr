import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { BookInputError, saveBookDetails } from '@/lib/books';
import { isAdminEmail } from '@/lib/admin';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: '관리자만 변경할 수 있습니다.' }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (typeof body?.bookId !== 'string') throw new BookInputError('도서를 선택해 주세요.');
    const result = await saveBookDetails(body.bookId, body.details);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '소개 저장에 실패했습니다.' },
      { status: error instanceof BookInputError || error instanceof SyntaxError ? 400 : 500 });
  }
}
