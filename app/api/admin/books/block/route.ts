import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { BlockConflictError, getSectionBlock, replaceSectionBlock } from '@/lib/books';
import { isAdminEmail } from '@/lib/admin';

/**
 * 리더에서 블록 하나 바로 고치기 (관리자).
 * 방어 2겹: middleware(관리자 이메일 + same-origin) → 여기서 세션 재검사.
 */
async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

const MAX_BLOCK_LENGTH = 20_000;
const validIndex = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 10_000;

function fail(error: unknown, fallback: string) {
  if (error instanceof BlockConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

/** 블록의 원고(마크다운) */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const q = req.nextUrl.searchParams;
  const index = Number(q.get('index'));
  if (!validIndex(index)) return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
  try {
    const raw = await getSectionBlock(q.get('bookId') ?? '', q.get('sectionId') ?? '', index);
    return NextResponse.json({ raw }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return fail(error, '원고를 읽지 못했습니다.');
  }
}

/** 블록 하나를 새 마크다운으로 바꿔 저장 (빈 내용이면 블록 삭제) */
export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { bookId, sectionId, index, original, markdown } = await req.json();
    if (
      typeof bookId !== 'string' ||
      typeof sectionId !== 'string' ||
      !validIndex(index) ||
      typeof original !== 'string' ||
      typeof markdown !== 'string' ||
      markdown.length > MAX_BLOCK_LENGTH
    ) {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }
    const message = await replaceSectionBlock(bookId, sectionId, index, original, markdown);
    return NextResponse.json({ success: true, message });
  } catch (error) {
    return fail(error, '저장에 실패했습니다.');
  }
}
