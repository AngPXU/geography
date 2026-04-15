import Link from 'next/link';
import { FaFacebook, FaGithub, FaYoutube, FaMapMarkedAlt } from 'react-icons/fa';

export function Footer() {
  return (
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
                <p className="font-black text-[#082F49] text-2xl leading-none tracking-tight">GeoExplore</p>
                <p className="text-xs text-cyan-600 font-bold tracking-[0.15em] uppercase mt-1">Học Địa Lý Vui Nhộn</p>
              </div>
            </Link>
            <p className="text-[#334155] text-sm leading-relaxed max-w-sm mb-6">
              Nền tảng học hỏi, khám phá và chinh phục thế giới dành cho học sinh THCS. 
              Cùng nhau đi khắp năm châu bốn bể ngay trên màn hình của bạn!
            </p>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-blue-50 transition-all text-lg">
                <FaFacebook />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-red-50 transition-all text-lg">
                <FaYoutube />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-sm hover:shadow-md hover:-translate-y-1 hover:bg-slate-50 transition-all text-lg">
                <FaGithub />
              </a>
            </div>
          </div>

          {/* Sitemaps */}
          <div>
            <h4 className="font-black text-[#082F49] uppercase tracking-wider text-sm mb-5">Khám phá</h4>
            <ul className="space-y-3">
              <li><Link href="/lessons" className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">📚 Bài học</Link></li>
              <li><Link href="/map" className="text-sm font-bold text-[#334155] hover:text-green-500 transition-colors">🗺️ Bản đồ 3D</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black text-[#082F49] uppercase tracking-wider text-sm mb-5">Hỗ trợ</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">🤖 10 Vạn Câu Hỏi</a></li>
              <li><a href="#" className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">❓ Câu hỏi thường gặp</a></li>
              <li><a href="#" className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">💬 Liên hệ</a></li>
              <li><a href="#" className="text-sm font-bold text-[#334155] hover:text-cyan-500 transition-colors">🛡️ Bảo mật</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-[#94A3B8]">
            © {new Date().getFullYear()} GeoExplore. Thiết kế bởi trái tim yêu địa lý ❤️
          </p>
          <div className="flex items-center gap-4 text-xs font-bold tracking-wide text-[#94A3B8]">
            <a href="#" className="hover:text-cyan-600 transition-colors">Điều khoản dịch vụ</a>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <a href="#" className="hover:text-cyan-600 transition-colors">Chính sách quyền riêng tư</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
