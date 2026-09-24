import { NextRequest } from 'next/server';
import { getBook, flattenSections } from '@/lib/books';

/** 공개된 책의 실제 절인지 확인 (Firestore 경로에 쓰이므로 여기서 걸러낸다) */
export async function sectionExists(bookId: string, sectionId: string): Promise<boolean> {
  const book = await getBook(bookId);
  return Boolean(book && flattenSections(book).some((f) => f.section.id === sectionId));
}

/** 상태를 바꾸는 요청은 같은 사이트에서 온 것만 받는다 (CSRF 완화) */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  try {
    return Boolean(origin) && new URL(origin!).host === req.nextUrl.host;
  } catch {
    return false;
  }
}
