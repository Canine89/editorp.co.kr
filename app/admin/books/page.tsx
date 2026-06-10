import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { listBooks } from '@/lib/books';
import { BookAdminDashboard } from '@/components/BookAdminDashboard';

export const revalidate = 0;

export default async function AdminBooksPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.email !== 'hgpark@goldenrabbit.co.kr') {
    redirect('/auth/unauthorized');
  }

  const books = await listBooks(true); // 비공개 책 포함
  return <BookAdminDashboard initialBooks={books} />;
}
