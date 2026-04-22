import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/layouts/Navbar';
import BooksPage from './BooksPage';

export const metadata = {
  title: 'Thư Viện Sách | Vui học Địa Lý',
  description: 'Đọc Sách Giáo Khoa Địa Lý lớp 6 – 9 trực tuyến.',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] flex flex-col relative overflow-x-hidden font-sans">
      {/* Liquid Mesh Gradient Nền (Apple iOS 26 Style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-violet-300/20 rounded-full blur-[100px] animate-[liquid-blob_18s_infinite_2s]"></div>
      </div>
      
      <div className="relative z-50">
      <Navbar user={session.user} />
      </div>
      <div className="flex-1 relative z-10 w-full max-w-[1440px] mx-auto">
        <BooksPage isAdmin={(session.user as any)?.role === 1} />
      </div>
    </div>
  );
}
