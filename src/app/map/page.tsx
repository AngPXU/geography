import { Navbar } from "@/layouts/Navbar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MapWrapper } from "@/components/ui/MapWrapper";

export default async function MapPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans min-h-screen">
      <Navbar user={session.user} />

      {/* Decorative blurred circles behind the UI */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300/30 rounded-full blur-[120px]"></div>
        <div className="absolute top-[60%] right-[-10%] w-[50%] h-[50%] bg-green-300/30 rounded-full blur-[120px]"></div>
      </div>

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 pt-24 pb-8 relative z-10 flex flex-col items-center h-screen">

        {/* Tiêu đề & Giới thiệu ngắn */}
        <div className="w-full text-center mt-4">
          <h1 className="text-4xl md:text-5xl font-black text-[#082F49] tracking-tight">
            Thế Giới Qua Quăng Kính
          </h1>
          <p className="text-[#334155] font-medium mt-2 max-w-2xl mx-auto">
            Trải nghiệm các khía cạnh khác nhau của Trái Đất thông qua 4 lớp bản đồ: Địa Hình, Thiên Nhiên, Dân Cư và Ngày/Đêm.
          </p>
        </div>

        {/* Map Container */}
        <div className="w-full flex-1 min-h-[500px]">
          <MapWrapper />
        </div>

      </main>
    </div>
  );
}
