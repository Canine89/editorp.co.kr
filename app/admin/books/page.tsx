import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { listBooks, countSections, flattenSections, listOverriddenSections } from '@/lib/books';
import { BookAdminList } from '@/components/BookAdminList';
import { isAdminEmail } from '@/lib/admin';

export const revalidate = 0;

export default async function AdminBooksPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    redirect('/auth/unauthorized');
  }

  const books = await listBooks(true); // 비공개 책 포함
  const withCounts = await Promise.all(
    books.map(async (book) => {
      // 사이트에서 고친 절(오버레이) — 되돌리기 전에 어느 절인지 보여 준다
      const ids = new Set(await listOverriddenSections(book.id));
      const overridden = flattenSections(book)
        .filter((f) => ids.has(f.section.id))
        .map((f) => f.section.title);
      return { ...book, sectionCount: countSections(book), overridden };
    })
  );
  return <BookAdminList initialBooks={withCounts} />;
}
