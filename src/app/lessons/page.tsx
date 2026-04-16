import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Navbar } from '@/layouts/Navbar';
import LessonsHub from './LessonsHub';

export const metadata = {
  title: 'Bài Giảng Tương Tác | GeoExplore',
  description: 'Khám phá các bài giảng Địa Lý lớp 6–9 theo phong cách Scrollytelling tương tác.',
};

export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background:
          'radial-gradient(at 0% 0%, #E0F2FE 0px, transparent 50%), radial-gradient(at 100% 100%, #DCFCE7 0px, transparent 50%), #FFFFFF',
      }}
    >
      <Navbar user={session.user} />
      <LessonsHub />
    </div>
  );
}
