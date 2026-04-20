import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/layouts/Navbar';
import { auth } from '@/auth';
import MapGuessGateway from '@/components/arena/MapGuessGateway';
import ArenaHistory from '@/components/arena/ArenaHistory';

export default async function ArenaLobby() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col pt-4">
      
      {/* Navbar Component */}
      <div className="fixed top-2 left-0 right-0 z-50 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <Navbar user={session?.user} />
      </div>
      
      {/* Mảng trang trí dạng mây & sương */}
      <div className="absolute top-0 left-0 w-full h-[400px] overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-cyan-300/30 rounded-full blur-[100px]" />
        <div className="absolute top-10 right-0 w-[500px] h-[500px] bg-rose-300/20 rounded-full blur-[80px]" />
      </div>

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-rose-100 text-rose-600 font-bold text-xs uppercase tracking-widest mb-3 border border-rose-200 shadow-sm shadow-rose-100">
            Khu Vực Giải Trí
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#082F49] mb-4 tracking-tight drop-shadow-sm">
            Đấu Trường <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">Địa Lý</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Học mà chơi, chơi mà học. Khám phá thế giới qua những thử thách bản đồ thú vị và cạnh tranh kỷ lục với bạn bè!
          </p>
        </div>

        {/* Danh sách Game */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card: Map Guessing */}
          <MapGuessGateway />

          {/* Sẵn sàng thêm game khác */}
          <div className="relative h-full p-1 rounded-[32px] bg-white/40 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
            <span className="text-4xl mb-3 grayscale">🧩</span>
            <p className="font-bold text-slate-400">Trò chơi mới sắp ra mắt...</p>
          </div>

        </div>

        {/* Lịch sử thi đấu — hiển thị khi đã đăng nhập */}
        {session?.user && <ArenaHistory />}
      </div>
    </div>
  );
}
