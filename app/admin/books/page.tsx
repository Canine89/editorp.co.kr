import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { listBooks, countSections } from '@/lib/books';
import { BookAdminList } from '@/components/BookAdminList';
import { isAdminEmail } from '@/lib/admin';

export const revalidate = 0;

export default async function AdminBooksPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    redirect('/auth/unauthorized');
  }

  const books = await listBooks(true); // 비공개 책 포함
  const withCounts = books.map((book) => ({ ...book, sectionCount: countSections(book) }));
  return <BookAdminList initialBooks={withCounts} />;
}
