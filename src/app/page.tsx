import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <GlassCard className="max-w-2xl text-center">
        <h1 className="text-4xl text-[#082F49] mb-4">
          Chào mừng {session.user.name} đến với Khám Phá Địa Lý!
        </h1>
        <p className="text-[#334155] mb-8 text-lg">
          Đây là sảnh chính. Các tính năng về bài học và bài Quiz sẽ sớm được ra mắt.
        </p>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: '/login' });
          }}
        >
          <Button type="submit" variant="outline">
            Đăng xuất
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
