import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/layouts/Navbar';
import BooksPage from './BooksPage';

export const metadata = {
  title: 'Thư Viện Sách | GeoExplore',
  description: 'Đọc Sách Giáo Khoa Địa Lý lớp 6 – 9 trực tuyến.',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="min-h-screen font-sans"
      style={{ background: 'radial-gradient(at 0% 0%, #E0F2FE 0px, transparent 50%), radial-gradient(at 100% 100%, #DCFCE7 0px, transparent 50%), #FFFFFF' }}>
      <Navbar user={session.user} />
      <BooksPage isAdmin={(session.user as any)?.role === 1} />
    </div>
  );
}
