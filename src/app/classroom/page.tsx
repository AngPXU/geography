import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/layouts/Navbar";
import { Footer } from "@/layouts/Footer";
import { ClassroomTabs } from "@/components/ui/ClassroomTabs";

export default async function ClassroomPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] relative overflow-x-hidden font-sans">
      <Navbar user={session.user} />

      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[60%] right-[-10%] w-[35%] h-[35%] bg-green-300/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-[30%] left-[60%] w-[25%] h-[25%] bg-purple-300/15 rounded-full blur-[80px]"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16 relative z-10">
        <ClassroomTabs user={session.user} />
      </main>

      <Footer />
    </div>
  );
}
