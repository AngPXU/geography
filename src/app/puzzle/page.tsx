import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/layouts/Navbar';
import { Footer } from '@/layouts/Footer';
import { PuzzleClient } from './PuzzleClient';

export const metadata = { title: 'Ghép Bản Đồ | Vui Học Địa Lý' };

export default async function PuzzlePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const params = await searchParams;
  const initialSet = typeof params.set === 'string' ? params.set : 'sea';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans">
      <Navbar user={session.user} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/15 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 pt-24 pb-16">
        <PuzzleClient initialSet={initialSet} />
      </main>

      <Footer />
    </div>
  );
}
