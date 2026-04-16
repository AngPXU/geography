import { auth } from "@/auth";
import { Navbar } from "@/layouts/Navbar";
import Link from "next/link";
import { FaMapMarkedAlt, FaGamepad, FaTrophy, FaTree } from "react-icons/fa";

export default async function RoadmapPage() {
  const session = await auth();

  const milestones = [
    {
      id: 1,
      title: "Khởi tạo Hành trang",
      desc: "Làm quen với Bản đồ 3D và giao diện khám phá tự do. Tìm kiếm Quốc gia của bạn để mở khóa các mảng bản đồ đầu tiên.",
      icon: <FaMapMarkedAlt className="text-2xl" />,
      color: "from-blue-400 to-cyan-400",
      status: "completed", // completed | current | locked
    },
    {
      id: 2,
      title: "Chinh phục Địa hình",
      desc: "Mở khóa kho tàng Dữ liệu Natural Earth. Truy tìm các đỉnh núi hùng vĩ và các rãnh đại dương sâu thẳm.",
      icon: <FaTree className="text-2xl" />,
      color: "from-emerald-400 to-green-500",
      status: "current",
    },
    {
      id: 3,
      title: "Trinh sát Kinh tế",
      desc: "Bước vào thế giới vĩ mô với số liệu từ World Bank. Phân tích GDP, Tuổi thọ và Quy mô dân số của các cường quốc.",
      icon: <FaGamepad className="text-2xl" />,
      color: "from-amber-400 to-orange-500",
      status: "locked",
    },
    {
      id: 4,
      title: "Nhà thông thái Địa lý",
      desc: "Tham gia thi đấu xếp hạng trên Đấu trường Bản đồ. Hạ gục bạn bè và khẳng định trí nhớ siêu phàm của bạn.",
      icon: <FaTrophy className="text-2xl" />,
      color: "from-fuchsia-400 to-rose-500",
      status: "locked",
    }
  ];

  return (
    <div className="bg-[#F0F9FF] min-h-screen font-sans">
      <Navbar user={session?.user} />

      {/* Decorative blurred circles behind the UI */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-[100px]"></div>
        <div className="absolute top-[60%] right-[-10%] w-[30%] h-[50%] bg-emerald-200/30 rounded-full blur-[100px]"></div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-24">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-widest mb-4 border border-blue-200">
            Roadmap 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-[#082F49] tracking-tight">
            Lộ trình <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Khám Phá</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl mx-auto mt-4">
            Theo dõi tiến độ học thuật của bạn qua từng cấp độ. Chơi càng nhiều, mở khóa càng sâu.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-300 via-emerald-300 to-slate-200 rounded-full transform md:-translate-x-1/2"></div>

          <div className="space-y-12">
            {milestones.map((ms, idx) => {
              const isEven = idx % 2 === 0;
              const isLocked = ms.status === 'locked';

              return (
                <div key={ms.id} className={`relative flex flex-col md:flex-row items-center justify-between w-full ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  
                  {/* Empty space for alternating layout */}
                  <div className="hidden md:block w-[45%]"></div>

                  {/* Icon Node */}
                  <div className={`absolute z-20 left-8 md:left-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-xl transform -translate-x-1/2 bg-gradient-to-br ${isLocked ? 'from-slate-200 to-slate-300' : ms.color} border-4 border-white`}>
                    <div className={isLocked ? "text-slate-400" : "text-white"}>
                      {ms.icon}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={`w-full md:w-[45%] pl-24 md:pl-0 ${isEven ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
                    <div className={`p-6 rounded-3xl backdrop-blur-xl border-2 transition-all duration-300 ${isLocked ? 'bg-white/40 border-white/50 grayscale opacity-70' : 'bg-white/80 border-white hover:bg-white shadow-[0_15px_30px_-5px_rgba(14,165,233,0.15)] hover:shadow-[0_20px_40px_-5px_rgba(14,165,233,0.25)] hover:-translate-y-1 cursor-pointer'}`}>
                      <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${isLocked ? 'text-slate-400' : 'text-cyan-600'}`}>
                        Chặng {ms.id}
                      </div>
                      <h3 className={`text-2xl font-black mb-3 ${isLocked ? 'text-slate-500' : 'text-[#082F49]'}`}>
                        {ms.title}
                      </h3>
                      <p className={`text-sm leading-relaxed font-medium ${isLocked ? 'text-slate-400' : 'text-slate-600'}`}>
                        {ms.desc}
                      </p>
                      
                      {!isLocked && (
                        <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold ${ms.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 animate-pulse'}`}>
                          {ms.status === 'completed' ? '✓ Đã hoàn thành' : '⚡ Đang thực hiện'}
                        </div>
                      )}
                      {isLocked && (
                        <div className="mt-4 inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                          🔒 Yêu cầu Cấp 10
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Back action */}
        <div className="mt-20 text-center relative z-20">
          <Link href="/map" className="inline-block px-10 py-4 rounded-full bg-[#082F49] text-white font-bold text-lg hover:bg-cyan-600 hover:shadow-lg hover:-translate-y-1 transition-all shadow-md">
            Quay lại Bản đồ Chinh phạt 🚀
          </Link>
        </div>

      </main>
    </div>
  );
}
