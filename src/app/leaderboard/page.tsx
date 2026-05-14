import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/layouts/Navbar";
import { Footer } from "@/layouts/Footer";
import dbConnect from "@/utils/db";
import User from "@/models/User";
import { LeaderboardClient } from "./LeaderboardClient";

export const metadata: Metadata = {
  title: "Bảng Vàng Đấu Trường | Vui học địa lý",
  description: "Bảng xếp hạng Top 50 học sinh có thành tích xuất sắc nhất toàn quốc.",
};

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  await dbConnect();
  const { getPetInfo } = await import('@/utils/petSystem');

  // Lấy Top 50 EXP
  const topExpRaw = await User.find({ role: 3 }).sort({ exp: -1 }).limit(50).select('username fullName avatar exp').lean();
  const topExpUsers = topExpRaw.map(u => ({
    _id: u._id.toString(),
    username: u.username,
    fullName: u.fullName as string | undefined,
    avatar: u.avatar as string | undefined,
    score: (u as any).exp || 0
  }));

  // Lấy Top 50 Pet
  const topPetRaw = await User.find({ role: 3 }).sort({ petExp: -1 }).limit(50).select('username fullName avatar petExp').lean();
  const topPetUsers = topPetRaw.map(u => ({
    _id: u._id.toString(),
    username: u.username,
    fullName: u.fullName as string | undefined,
    avatar: u.avatar as string | undefined,
    score: getPetInfo((u as any).petExp || 0).currentLevel.level
  }));

  // Lấy thông tin user hiện tại để hiển thị avatar mới nhất
  const currentUser = await User.findOne({ username: session.user.name }).select('avatar fullName').lean();

  return (
    <div className="bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans min-h-screen flex flex-col">
      <Navbar user={{ ...session.user, image: (currentUser as any)?.avatar || session.user.image, fullName: (currentUser as any)?.fullName || session.user.fullName }} />

      {/* Liquid Mesh Gradient Nền (Apple iOS 26 Style) */}
      <div className="absolute top-0 left-0 w-full h-[100vh] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[80px] md:blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[80px] md:blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-violet-300/20 rounded-full blur-[60px] md:blur-[100px] animate-[liquid-blob_18s_infinite_2s]"></div>
      </div>

      <main className="w-[95%] md:w-[90%] max-w-[1300px] mx-auto pt-32 pb-24 flex-1 relative z-10">
        <div className="text-center mb-12 relative z-20">
          <h1 className="text-5xl md:text-6xl font-black text-[#082F49] tracking-tight mb-4">
            Đấu Trường <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Vinh Danh</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
            Nơi ghi nhận nỗ lực học tập và khám phá của các nhà thám hiểm địa lý xuất sắc nhất.
          </p>
        </div>

        <LeaderboardClient topExpUsers={topExpUsers} topPetUsers={topPetUsers} />
      </main>

      <Footer />
    </div>
  );
}
