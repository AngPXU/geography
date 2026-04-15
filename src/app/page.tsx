import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/layouts/Navbar";
import { EarthGlobe } from "@/components/ui/EarthGlobe";
import { FaRocket, FaMap } from "react-icons/fa";
import { BookExplorer } from "@/components/ui/BookExplorer";
import { GeoQuestions } from "@/components/ui/GeoQuestions";
import { GeoFunFacts } from "@/components/ui/GeoFunFacts";
import { Footer } from "@/layouts/Footer";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans">
      <Navbar user={session.user} />
      
      {/* Decorative blurred circles behind the UI */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-[100px]"></div>
        <div className="absolute top-[80%] right-[-10%] w-[40%] h-[40%] bg-green-300/30 rounded-full blur-[100px]"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-16 min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 relative z-10">
        
        {/* Left Column: Text & CTA */}
        <div className="flex-1 w-full max-w-2xl text-center lg:text-left flex flex-col items-center lg:items-start gap-6 relative z-20">
          
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            <span className="text-xs font-bold text-[#082F49] uppercase tracking-wider">Hệ thống AI đã sẵn sàng</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-[#082F49] leading-tight tracking-tight mt-2">
            Chinh phục<br />
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-pink-500 drop-shadow-sm">
              ĐỊA LÝ 12.
            </span>
          </h1>

          <p className="text-[#334155] text-lg md:text-xl max-w-lg leading-relaxed mt-4">
            Giáo trình Địa Lý được tái tạo bằng <strong className="font-bold">AI Nhận Diện Bản Đồ</strong>, Thống kê 3D sinh động và Lộ trình Cá nhân hóa. Học mượt, đỗ sâu!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <button className="h-14 px-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-bold text-lg hover:shadow-[0_10px_25px_rgba(236,72,153,0.4)] hover:-translate-y-1 transition-all flex items-center gap-3">
              Bắt đầu cày <FaRocket className="text-xl" />
            </button>
            <button className="h-14 px-8 rounded-full bg-white/70 backdrop-blur-md border border-white text-[#082F49] font-bold text-lg hover:bg-white hover:shadow-[0_10px_25px_rgba(14,165,233,0.1)] hover:-translate-y-1 transition-all flex items-center gap-3">
              Xem lộ trình <FaMap className="text-xl text-blue-500" />
            </button>
          </div>
        </div>

        {/* Right Column: 3D Earth Globe */}
        <div className="flex-1 w-full relative z-10 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-200/20 to-transparent rounded-full blur-3xl scale-75"></div>
          <EarthGlobe />
          
          {/* Floating Action Cards just like the design */}
          <div className="hidden md:flex absolute top-[10%] left-[0%] bg-white/75 backdrop-blur-md border border-white rounded-[24px] p-3 shadow-[0_10px_30px_rgba(14,165,233,0.08)] items-center gap-3 animate-bounce" style={{animationDuration: '4s'}}>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-xl">🗺️</div>
            <div className="pr-2">
              <p className="font-bold text-[#082F49] text-sm leading-tight">Bản đồ</p>
              <p className="text-[10px] text-[#94A3B8]">Kỹ năng Atlat</p>
            </div>
          </div>
          
          <div className="hidden md:flex absolute bottom-[15%] right-[0%] bg-white/75 backdrop-blur-md border border-white rounded-[24px] p-3 shadow-[0_10px_30px_rgba(14,165,233,0.08)] items-center gap-3 animate-[bounce_5s_ease-in-out_infinite]" style={{animationDelay: '1s'}}>
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 text-xl">⚔️</div>
            <div className="pr-2">
              <p className="font-bold text-[#082F49] text-sm leading-tight">Đánh Boss</p>
              <p className="text-[10px] text-[#94A3B8]">Học qua Game RPG</p>
            </div>
          </div>
        </div>

      </main>

      {/* Book Explorer Section */}
      <BookExplorer />

      {/* 10 Vạn Câu Hỏi Vì Sao */}
      <GeoQuestions />

      {/* Bạn Có Biết Không? (Fun Facts) */}
      <GeoFunFacts />

      {/* Chân trang */}
      <Footer />
    </div>
  );
}
