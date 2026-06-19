import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import { getBook } from '@/lib/books';
import { BookAdminDetail } from '@/components/BookAdminDetail';
import { isAdminEmail } from '@/lib/admin';

export const revalidate = 0;

export default async function AdminBookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminEmail(session.user?.email)) {
    redirect('/auth/unauthorized');
  }

  const { bookId } = await params;
  const book = await getBook(bookId, true); // 비공개 책도 관리 대상
  if (!book) notFound();

  return <BookAdminDetail initialBook={book} />;
}
