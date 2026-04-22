import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { Navbar } from "@/layouts/Navbar";
import { EarthGlobe } from "@/components/ui/EarthGlobe";
import { FaRocket, FaMap } from "react-icons/fa";
import { EarthRecords } from "@/components/ui/EarthRecords";
import { DashboardOverview } from "@/components/ui/DashboardOverview";
import { GeoQuestions } from "@/components/ui/GeoQuestions";
import { GeoFunFacts } from "@/components/ui/GeoFunFacts";
import { Footer } from "@/layouts/Footer";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import { getVietnamDateStr } from "@/utils/missions";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  await dbConnect();
  const dbUser = await User.findOne({ username: session.user.name }).lean() as {
    role?: number; exp?: number; streak?: number;
    studyTimeToday?: number; studyTimeDate?: string;
  } | null;
  const userRole: number = dbUser?.role ?? 3;
  const userExp: number = dbUser?.exp ?? 0;
  const userStreak: number = dbUser?.streak ?? 0;
  const today = getVietnamDateStr();
  const userStudySeconds: number =
    dbUser?.studyTimeDate === today ? (dbUser.studyTimeToday ?? 0) : 0;

  return (
    <div className="bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans">
      <Navbar user={session.user} />

      {/* Liquid Mesh Gradient Nền (Apple iOS 26 Style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-violet-300/20 rounded-full blur-[100px] animate-[liquid-blob_18s_infinite_2s]"></div>
      </div>

      <main className="w-[95%] max-w-[1300px] mx-auto px-4 sm:px-6 xl:px-8 pt-32 pb-24 min-h-[90vh] flex flex-col items-center justify-center relative z-10">
        
        {/* The Grand Glass Panel - iOS 26 Inspired */}
        <div 
          className="w-full flex flex-col lg:flex-row items-center justify-between gap-10 p-8 lg:p-12 rounded-[32px] overflow-hidden relative"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
          }}
        >
          {/* Inner Highlight for Glass Edge */}
          <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>

          {/* Left Column: Text & CTA */}
          <div className="lg:w-5/12 w-full text-center lg:text-left flex flex-col items-center lg:items-start gap-6 relative z-30 shrink-0">
            {/* New Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_4px_12px_rgba(14,165,233,0.1)] mb-2">
              <span className="text-xl">✨</span>
              <span className="text-[#06B6D4] font-black text-xs uppercase tracking-wider">Khám phá thế giới 3D</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black text-[#082F49] leading-[1.15] tracking-tight relative">
              Chinh phục<br />
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-[#06B6D4] drop-shadow-sm">
                ĐỊA LÝ.
              </span>
            </h1>

            <div className="relative w-full">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-full hidden lg:block" />
              <p className="text-[#334155] text-lg max-w-[28rem] mx-auto lg:mx-0 leading-relaxed font-medium lg:pl-6">
                Giáo trình Địa Lý số hoá đầu tiên tại Việt Nam được trợ lực bởi <strong className="font-extrabold text-[#082F49] border-b-[2px] border-[#06B6D4]">AI Nhận Diện</strong>, Bản đồ 3D thực tế ảo và cá nhân hóa lộ trình. Học mượt, nhớ sâu!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-2 w-full">
              {/* Primary Button: Pill-shape (9999px) - chuẩn AGENTS.md */}
              <Link href="/map" className="group h-14 px-8 rounded-full bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black text-base shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_30px_rgba(34,211,238,0.5)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                Bắt đầu hành trình <FaRocket className="text-lg group-hover:scale-125 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </Link>
              
              {/* Secondary Button */}
              <Link href="/roadmap" className="h-14 px-8 rounded-full bg-white/50 backdrop-blur-md border-[2px] border-white/80 text-[#082F49] font-black text-base shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:bg-white hover:border-white hover:shadow-[0_12px_24px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                Xem lộ trình <FaMap className="text-lg text-[#06B6D4]" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Earth Globe */}
          <div className="lg:w-1/2 w-full relative z-30 flex items-center justify-center pointer-events-auto min-h-[350px] lg:min-h-[500px]">
            {/* Glowing orb behind earth */}
            <div className="absolute inset-10 bg-gradient-to-tr from-[#06B6D4]/30 to-[#22C55E]/20 rounded-full blur-[80px]"></div>
            
            {/* Wrapper to control max size of the earth to avoid overwhelming the view */}
            <div className="w-full max-w-[500px] aspect-square relative hover:scale-[1.02] transition-transform duration-700">
              <EarthGlobe userRole={userRole} />
            </div>
          </div>

        </div>
      </main>

      {/* Bảng điều khiển tổng quan */}
      <DashboardOverview username={session.user.name ?? 'Bạn'} avatar={session.user.image ?? undefined} initialExp={userExp} initialStreak={userStreak} initialStudySeconds={userStudySeconds} />

      {/* Kỷ Lục Trái Đất */}
      <EarthRecords />

      {/* 10 Vạn Câu Hỏi Vì Sao */}
      <GeoQuestions />

      {/* Bạn Có Biết Không? (Fun Facts) */}
      <GeoFunFacts />

      {/* Chân trang */}
      <Footer />
    </div>
  );
}
