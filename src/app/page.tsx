import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/layouts/Navbar";
import { EarthGlobe } from "@/components/ui/EarthGlobe";
import { FaRocket, FaMap } from "react-icons/fa";
import { BookExplorer } from "@/components/ui/BookExplorer";
import { GeoQuestions } from "@/components/ui/GeoQuestions";
import { GeoFunFacts } from "@/components/ui/GeoFunFacts";
import { Footer } from "@/layouts/Footer";
import dbConnect from "@/utils/db";
import User from "@/models/User";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  await dbConnect();
  const dbUser = await User.findOne({ username: session.user.name }).lean() as { role?: number } | null;
  const userRole: number = dbUser?.role ?? 3;

  return (
    <div className="bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans">
      <Navbar user={session.user} />

      {/* Decorative blurred circles behind the UI */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-[100px]"></div>
        <div className="absolute top-[80%] right-[-10%] w-[40%] h-[40%] bg-green-300/30 rounded-full blur-[100px]"></div>
      </div>

      <main className="w-[90%] max-w-[1400px] mx-auto px-4 xl:px-8 pt-32 pb-24 min-h-[90vh] flex flex-col lg:flex-row items-center justify-center gap-16 relative z-10">

        {/* Left Column: Text & CTA */}
        <div className="flex-1 w-full text-center lg:text-left flex flex-col items-center lg:items-start gap-8 relative z-20">

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-[#082F49] leading-[1.1] tracking-tight relative">
            Chinh phục<br />
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-400 drop-shadow-sm">
              ĐỊA LÝ.
            </span>
            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-r from-fuchsia-500/20 to-transparent blur-md -z-10"></div>
          </h1>

          <p className="text-[#334155] text-lg lg:text-xl max-w-xl leading-relaxed mt-2 font-medium">
            Giáo trình Địa Lý số hoá đầu tiên tại Việt Nam được trợ lực bởi <strong className="font-extrabold text-[#082F49] border-b-[2px] border-cyan-400">AI Nhận Diện</strong>, Bản đồ 3D thực tế ảo và cá nhân hóa lộ trình. Học mượt, nhớ sâu!
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-5 mt-4">
            <button className="group h-[60px] px-10 rounded-[24px] bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black text-lg shadow-[0_15px_30px_-5px_rgba(236,72,153,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(236,72,153,0.5)] hover:-translate-y-1 transition-all flex items-center gap-3">
              Bắt đầu hành trình <FaRocket className="text-xl group-hover:scale-125 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
            <button className="h-[60px] px-10 rounded-[24px] bg-white/70 backdrop-blur-xl border-[2px] border-white text-[#082F49] font-black text-lg shadow-[0_10px_20px_rgba(0,0,0,0.05)] hover:bg-white hover:shadow-[0_15px_30px_rgba(14,165,233,0.1)] hover:-translate-y-1 transition-all flex items-center gap-3">
              Xem lộ trình <FaMap className="text-xl text-blue-500" />
            </button>
          </div>
        </div>

        {/* Right Column: 3D Earth Globe */}
        <div className="flex-1 w-full relative z-10 flex items-center justify-center pointer-events-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-200/20 to-transparent rounded-full blur-3xl scale-75"></div>
          <EarthGlobe userRole={userRole} />
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
