import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/layouts/Navbar';
import { auth } from '@/auth';

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
          <Link href="/arena/map-guessing" className="group">
            <div className="relative h-full p-1 rounded-[32px] bg-gradient-to-b from-white to-slate-50/50 shadow-[0_20px_40px_rgba(8,47,73,0.06)] hover:shadow-[0_20px_40px_rgba(244,63,94,0.15)] transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-white">
              
              {/* Hình Cover */}
              <div className="h-48 rounded-[28px] bg-slate-200 overflow-hidden relative border border-slate-100">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80')] bg-cover bg-center group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#082F49] via-[#082F49]/40 to-transparent opacity-80" />
                
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white font-bold text-xs">
                    🌎 Địa lý Tự nhiên & Kinh tế
                  </div>
                  <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg font-black text-lg">
                    🎯
                  </div>
                </div>
              </div>

              {/* Thông tin */}
              <div className="p-6">
                <h3 className="text-xl font-extrabold text-[#082F49] mb-2 group-hover:text-rose-500 transition-colors">
                  Bút Toán Bản Đồ
                </h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">
                  Trò chơi trắc nghiệm bản đồ. Bạn có 5 lượt để tìm ra vị trí chính xác của ngọn núi, dòng sông, hay quốc gia bí ẩn. Càng gần mục tiêu, điểm càng cao!
                </p>

                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold border border-green-100">Chơi đơn</span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold border border-amber-100">Tính điểm</span>
                </div>
              </div>

            </div>
          </Link>

          {/* Sẵn sàng thêm game khác */}
          <div className="relative h-full p-1 rounded-[32px] bg-white/40 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
            <span className="text-4xl mb-3 grayscale">🧩</span>
            <p className="font-bold text-slate-400">Trò chơi mới sắp ra mắt...</p>
          </div>

        </div>
      </div>
    </div>
  );
}
