import type { Metadata } from 'next';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/layouts/Navbar";
import { Footer } from "@/layouts/Footer";
import { ClassroomTabs } from "@/components/ui/ClassroomTabs";

export const metadata: Metadata = {
  title: 'Lớp học',
  description:
    'Tham gia lớp học Địa lý trực tuyến và tại nhà — giáo viên giao bài, học sinh nộp bài, chấm điểm tự động.',
  openGraph: {
    title: 'Lớp học | Khám Phá Địa Lý',
    description: 'Lớp học Địa lý online & offline — giao bài, nộp bài, chấm điểm.',
    url: 'https://vuihocdialy.edu.vn/classroom',
  },
};

export default async function ClassroomPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans">
      <Navbar user={session.user} />

      {/* Liquid Mesh Gradient Nền (Apple iOS 26 Style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-violet-300/20 rounded-full blur-[100px] animate-[liquid-blob_18s_infinite_2s]"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16 relative z-10">
        <ClassroomTabs user={session.user} />
      </main>

      <Footer />
    </div>
  );
}
