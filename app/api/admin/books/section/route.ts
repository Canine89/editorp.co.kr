import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import {
  getBook,
  flattenSections,
  renderSectionHtml,
  saveSectionMarkdown,
  revertSectionMarkdown,
} from '@/lib/books';
import { sanitizeBookHtml } from '@/lib/sanitize';
import { htmlToMarkdown } from '@/lib/html-to-md';

const ADMIN_EMAIL = 'hgpark@goldenrabbit.co.kr';

async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/** 절 본문을 에디터용 HTML로 반환 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const bookId = req.nextUrl.searchParams.get('bookId') ?? '';
  const sectionId = req.nextUrl.searchParams.get('sectionId') ?? '';

  const book = await getBook(bookId, true);
  const flat = book ? flattenSections(book).find((f) => f.section.id === sectionId) : null;
  if (!book || !flat) {
    return NextResponse.json({ error: '존재하지 않는 절입니다.' }, { status: 404 });
  }

  const html = await renderSectionHtml(book.id, flat.section);
  if (html === null) {
    return NextResponse.json({ error: '절 본문을 읽을 수 없습니다.' }, { status: 404 });
  }
  return NextResponse.json({ html, title: flat.section.title });
}

/** 에디터 HTML을 마크다운으로 변환해 저장 */
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { bookId, sectionId, html } = await req.json();
    if (typeof bookId !== 'string' || typeof sectionId !== 'string' || typeof html !== 'string') {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }
    const markdown = htmlToMarkdown(sanitizeBookHtml(html));
    const message = await saveSectionMarkdown(bookId, sectionId, markdown);
    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '저장에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** 수정사항(오버레이)을 버리고 파일 원본으로 복원 */
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { bookId, sectionId } = await req.json();
    if (typeof bookId !== 'string' || typeof sectionId !== 'string') {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }
    const message = await revertSectionMarkdown(bookId, sectionId);
    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '되돌리기에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
