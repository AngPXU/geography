'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FaFacebook, FaGithub, FaYoutube, FaMapMarkedAlt } from 'react-icons/fa';

const MODAL_CONTENT = {
  faq: { 
    title: "❓ Câu hỏi thường gặp (FAQ)", 
    body: "1. Làm sao để có thêm EXP và xu (Coins)?\nHoàn thành các bài Quiz trong Đấu trường (Arena), chơi xếp hình bản đồ, hoặc học bài thường xuyên.\n\n2. Tại sao tôi không thể vào lớp học ảo?\nBạn cần có Mã lớp học từ giáo viên. Vào mục 'Lớp học Ảo', nhập mã để tham gia.\n\n3. Tôi có thể đổi tên và Avatar không?\nCó, hãy vào mục Hồ sơ (Profile) ở góc trên bên phải màn hình để thay đổi Avatar và thông tin cá nhân." 
  },
  guide: { 
    title: "📖 Hướng dẫn sử dụng", 
    body: "- Bản đồ 3D: Kéo rê chuột để xoay Quả địa cầu. Dùng con lăn chuột để phóng to/thu nhỏ. Có thể chuyển các chế độ bản đồ như Khí hậu, Địa hình, Kinh tế.\n- Đấu trường: Tham gia mini-game Đoán vị trí hoặc Ghép bản đồ để đua top với bạn bè.\n- Bài giảng: Trải nghiệm bài học bằng cách cuộn chuột từ từ (Scrollytelling) để xem các hình ảnh trực quan." 
  },
  contact: { 
    title: "💬 Liên hệ", 
    body: "Tất cả các vấn đề về lỗi hệ thống, quên mật khẩu hoặc góp ý, học sinh vui lòng liên hệ Ban Quản trị qua Email: admin@vuihocdialy.com hoặc báo cáo trực tiếp với Giáo viên chủ nhiệm." 
  },
  terms: { 
    title: "📜 Điều khoản dịch vụ", 
    body: "Tất cả học sinh sử dụng tài khoản hệ thống phải chấp hành nội quy học tập. Không sử dụng từ ngữ thiếu văn hóa trên Bảng xếp hạng. Nghiêm cấm chia sẻ tài khoản cho người ngoài." 
  },
  privacy: { 
    title: "🛡️ Quyền riêng tư", 
    body: "Nền tảng Vui học Địa Lý cam kết bảo mật thông tin người dùng. Chúng tôi chỉ lưu trữ tiến độ học, điểm số, và dữ liệu cá nhân hóa (như exp, thú cưng) nhằm tối ưu trải nghiệm học tập của bạn." 
  }
};

export function Footer() {
  const [activeModal, setActiveModal] = useState<keyof typeof MODAL_CONTENT | null>(null);

  return (
    <>
      <footer className="relative mt-20 border-t border-white/60 bg-white/40 backdrop-blur-xl">
      {/* Wave decoration on top */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none transform -translate-y-[99%]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-[50px] fill-white/40">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.45,130.85,121.26,193.3,109.86,238.16,101.62,282.89,75.44,321.39,56.44Z"></path>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-16">
          
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-3 group mb-4">
              <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-105 group-hover:rotate-6 transition-transform">
                <FaMapMarkedAlt />
              </div>
              <div>
                <p className="font-black text-[#082F49] text-2xl leading-none tracking-tight">Vui học Địa Lý</p>
                <p className="text-xs text-cyan-600 font-bold tracking-[0.15em] uppercase mt-1">Học Địa Lý Vui Nhộn</p>
              </div>
            </Link>
            <p className="text-[#334155] text-sm leading-relaxed max-w-sm mb-6">
              Nền tảng học hỏi, khám phá và chinh phục thế giới dành cho học sinh THCS. 
              Cùng nhau đi khắp năm châu bốn bể ngay trên màn hình của bạn!
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-blue-50 transition-all text-lg">
                <FaFacebook />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-red-50 transition-all text-lg">
                <FaYoutube />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-slate-50 transition-all text-lg">
                <FaGithub />
              </a>
            </div>
          </div>

          {/* Sitemaps */}
          <div>
            <h4 className="font-black text-[#082F49] uppercase tracking-wider text-sm mb-5">Khám phá</h4>
            <ul className="space-y-3">
              <li><Link href="/map" className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">🗺️ Bản đồ Tương tác</Link></li>
              <li><Link href="/arena" className="text-sm font-bold text-[#334155] hover:text-rose-500 transition-colors">⚔️ Đấu trường Trí tuệ</Link></li>
              <li><Link href="/roadmap" className="text-sm font-bold text-[#334155] hover:text-emerald-500 transition-colors">🚀 Lộ trình Khám phá</Link></li>
              <li><Link href="/classroom" className="text-sm font-bold text-[#334155] hover:text-blue-500 transition-colors">🏫 Lớp học Ảo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[#082F49] uppercase tracking-wider text-sm mb-5">Hỗ trợ</h4>
            <ul className="space-y-3">
              <li><button onClick={() => setActiveModal('faq')} className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">❓ Câu hỏi thường gặp (FAQ)</button></li>
              <li><button onClick={() => setActiveModal('guide')} className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">📖 Hướng dẫn sử dụng Bản đồ</button></li>
              <li><button onClick={() => setActiveModal('contact')} className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">💬 Liên hệ Ban Giám Hiệu</button></li>
              <li><Link href="/settings" className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">🛡️ Quản lý Tài khoản</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-[#94A3B8]">
            © {new Date().getFullYear()} Vui học Địa Lý. Thiết kế bởi trái tim yêu địa lý ❤️
          </p>
          <div className="flex items-center gap-4 text-xs font-bold tracking-wide text-[#94A3B8]">
            <button onClick={() => setActiveModal('terms')} className="hover:text-cyan-600 transition-colors cursor-pointer">Điều khoản dịch vụ</button>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-cyan-600 transition-colors cursor-pointer">Chính sách quyền riêng tư</button>
          </div>
        </div>
      </div>
      </footer>

      {/* Pop up Modal UI (Nằm ngoài thẻ footer để không bị z-index và backdrop-blur của footer đè) */}
      {activeModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white/95 backdrop-blur-3xl border border-white max-w-lg w-full rounded-3xl shadow-[0_30px_60px_rgba(8,47,73,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
              <h3 className="text-lg font-black text-[#082F49]">
                {MODAL_CONTENT[activeModal].title}
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors font-bold"
              >
                ✕
              </button>
            </div>
            {/* Body */}
            <div className="p-6">
              <p className="whitespace-pre-line text-[#334155] font-medium leading-relaxed">
                {MODAL_CONTENT[activeModal].body}
              </p>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
              <button onClick={() => setActiveModal(null)} className="px-6 py-2 rounded-xl bg-[#082F49] text-white font-bold text-sm shadow-md hover:bg-cyan-600 transition-colors">
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
