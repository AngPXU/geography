import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/layouts/Navbar';
import type { Metadata } from 'next';
import { auth } from '@/auth';

export const metadata: Metadata = {
  title: 'Đấu trường Địa lý',
  description:
    'Luyện tập câu hỏi Địa lý theo chủ đề, thi đấu trắc nghiệm, đoán vị trí bản đồ — rèn luyện kiến thức Địa lý nhanh và vui.',
  openGraph: {
    title: 'Đấu trường Địa lý | Khám Phá Địa Lý',
    description: 'Câu hỏi trắc nghiệm, đoán bản đồ, luyện Địa lý mỗi ngày.',
    url: 'https://vuihocdialy.edu.vn/arena',
  },
};
import MapGuessGateway from '@/components/arena/MapGuessGateway';
import MapPuzzleGateway from '@/components/arena/MapPuzzleGateway';
import ArenaHistory from '@/components/arena/ArenaHistory';

export default async function ArenaLobby() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] flex flex-col pt-4 relative overflow-x-hidden font-sans">
      
      {/* Navbar Component */}
      <div className="fixed top-2 left-0 right-0 z-50 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
        <Navbar user={session?.user} />
      </div>
      
      {/* Liquid Mesh Gradient Nền (Apple iOS 26 Style) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-violet-300/20 rounded-full blur-[100px] animate-[liquid-blob_18s_infinite_2s]"></div>
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

          {/* Card: Map Puzzle */}
          <MapPuzzleGateway />

        </div>

        {/* Lịch sử thi đấu — hiển thị khi đã đăng nhập */}
        {session?.user && <ArenaHistory />}
      </div>
    </div>
  );
}
