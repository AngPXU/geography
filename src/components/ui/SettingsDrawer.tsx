'use client';

import React, { useState, useEffect } from 'react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { name?: string | null; image?: string | null; role?: number };
}

export function SettingsDrawer({ isOpen, onClose, user }: SettingsDrawerProps) {
  // States
  const [graphics, setGraphics] = useState<'ultra' | 'smooth'>('ultra');
  const [unit, setUnit] = useState<'km' | 'mile'>('km');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load initial from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedGraphics = localStorage.getItem('geo_graphics') as 'ultra' | 'smooth';
      if (savedGraphics) setGraphics(savedGraphics);
    }
  }, []);

  // Handlers
  const handleSetGraphics = (val: 'ultra' | 'smooth') => {
    setGraphics(val);
    localStorage.setItem('geo_graphics', val);
    window.dispatchEvent(new Event('geo_settings_changed'));
  };

  // Nút Switch Component nội bộ
  const ToggleSwitch = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <div 
      onClick={onClick}
      className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-300 ${active ? 'bg-green-500' : 'bg-slate-300'}`}
    >
      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 shadow-sm ${active ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <>
      {/* Nền Đen Mờ (Overlay) */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9990] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
      />

      {/* Tấm trượt (Drawer) */}
      <div className={`fixed top-0 right-0 h-full w-[90%] md:w-[400px] bg-white/95 backdrop-blur-2xl border-l border-white/50 shadow-[-20px_0_40px_rgba(8,47,73,0.1)] z-[9999] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-5 border-b border-slate-100 flex items-center justify-between z-10 hidden-scrollbar">
          <h2 className="text-xl font-black text-[#082F49] flex items-center gap-2">
            <span>⚙️</span> Cài đặt & Tùy chọn
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors font-bold">
            ✕
          </button>
        </div>

        {/* Cụm Setting */}
        <div className="p-6 space-y-8">
          
          {/* Nhóm 1: Hồ Sơ */}
          <div>
            <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-4">1. Tài Khoản & Hồ Sơ</h3>
            <div className="bg-slate-50 p-4 rounded-[20px] border border-slate-100 flex items-center gap-4">
              <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-cyan-400 to-blue-500 flex flex-col justify-center items-center text-white font-bold p-1 shadow-inner relative overflow-hidden group">
                {user?.image ? (
                   <img src={user.image} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                   <span className="text-2xl z-10 relative">{(user?.name?.charAt(0) || 'K').toUpperCase()}</span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/40 h-5 flex items-center justify-center text-[8px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Sửa</div>
              </div>
              <div className="flex-1">
                <input type="text" readOnly value={user?.name || 'Người chơi Khách'} className="w-full bg-white border border-slate-200 outline-none text-[#082F49] font-bold text-sm px-3 py-1.5 rounded-lg mb-2 focus:border-cyan-400 focus:bg-cyan-50/20" />
                <p className="text-[10px] font-bold text-slate-400">Danh hiệu: <span className="text-orange-500">Tân Thủ 🔰</span></p>
              </div>
            </div>
          </div>

          {/* Nhóm 2: Đồ họa */}
          <div>
            <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-4">2. Hiệu Năng 3D</h3>
            <div className="bg-slate-50 p-1 rounded-[16px] border border-slate-100 flex mb-2 relative">
              {/* Highlight Slider */}
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[12px] shadow-sm border border-slate-200 transition-transform duration-300 ${graphics === 'ultra' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`} />
              
              <button 
                onClick={() => handleSetGraphics('smooth')}
                className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${graphics === 'smooth' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Mượt Mà (Máy Yếu)
              </button>
              <button 
                onClick={() => handleSetGraphics('ultra')}
                className={`flex-1 py-2 text-sm font-bold z-10 transition-colors ${graphics === 'ultra' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Cực Độ (Đẹp)
              </button>
            </div>
            <p className="text-[10px] text-slate-500 px-2 leading-relaxed">
              * Mượt mà: Tắt hiệu ứng Khí quyển & Sương trong không gian. Cực độ: Đổ bóng thực tế, mây bay.
            </p>
          </div>

          {/* Nhóm 3: Bản đồ */}
          <div>
            <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-4">3. Tùy Chọn Bản Đồ</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-[16px] border border-slate-100">
                <span className="text-sm font-bold text-[#334155]">Ngôn ngữ nhãn map</span>
                <select 
                  value={lang} onChange={(e) => setLang(e.target.value as any)}
                  className="bg-white border border-slate-200 text-sm font-bold text-[#082F49] rounded-lg px-2 py-1 outline-none"
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh (Gốc)</option>
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-[16px] border border-slate-100">
                <span className="text-sm font-bold text-[#334155]">Hệ Thống Đo Lường</span>
                <select 
                  value={unit} onChange={(e) => setUnit(e.target.value as any)}
                  className="bg-white border border-slate-200 text-sm font-bold text-[#082F49] rounded-lg px-2 py-1 outline-none"
                >
                  <option value="km">Km / Độ °C</option>
                  <option value="mile">Dặm / Độ °F</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nhóm 4: Âm thanh & Thông báo */}
          <div>
            <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest mb-4">4. Trải Nghiệm</h3>
            
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-[16px] border border-slate-100 cursor-pointer" onClick={() => setSoundEnabled(!soundEnabled)}>
              <div>
                <p className="text-sm font-bold text-[#334155]">Âm thanh Trò Chơi</p>
                <p className="text-[10px] text-slate-500">Tiếng Ting! & Nhạc nền lúc làm Quiz</p>
              </div>
              <ToggleSwitch active={soundEnabled} onClick={() => setSoundEnabled(!soundEnabled)} />
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="absolute bottom-0 inset-x-0 p-6 text-center text-xs text-slate-400 font-medium">
          Phiên bản 1.0 (PWA Ready) <br/>
          Hệ thống Dữ liệu World Bank & Natural Earth
        </div>

      </div>
    </>
  );
}
