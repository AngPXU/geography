'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TOPIC_MODES } from '@/utils/map-guessing-utils';

// ── Toast Component ────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: 'error' | 'info'; onClose: () => void }) {
  const bg = type === 'error' ? 'rgba(254,226,226,0.92)' : 'rgba(186,230,253,0.92)';
  const text = type === 'error' ? '#DC2626' : '#0284C7';
  const border = type === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(2,132,199,0.2)';
  const icon = type === 'error' ? '❌' : 'ℹ️';
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] animate-[toast-in_0.3s_ease-out]">
      <style>{`@keyframes toast-in { from { opacity:0; transform: translate(-50%,-16px); } to { opacity:1; transform: translate(-50%,0); } }`}</style>
      <div className="flex items-center gap-3 px-5 py-3.5 rounded-[18px] shadow-2xl backdrop-blur-2xl border"
        style={{ background: bg, borderColor: border, color: text, minWidth: 260, maxWidth: 380 }}>
        <span className="text-lg shrink-0">{icon}</span>
        <p className="font-bold text-sm flex-1 leading-snug">{msg}</p>
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity font-black text-base leading-none">×</button>
      </div>
    </div>
  );
}

// ── Password Modal (Glassmorphism) ─────────────────────────────────────────────
function PasswordModal({ roomCode, onConfirm, onCancel }: { roomCode: string; onConfirm: (p: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-xs rounded-[32px] p-7 shadow-2xl text-center"
        style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
        <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200 text-2xl">🔒</div>
        <h3 className="text-lg font-black text-[#082F49] mb-1">Phòng Kín</h3>
        <p className="text-slate-500 text-sm font-medium mb-5">Phòng <span className="font-black text-[#082F49]">{roomCode}</span> yêu cầu mật khẩu</p>
        <input
          autoFocus
          type="password"
          placeholder="Nhập mật khẩu..."
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && val && onConfirm(val)}
          className="w-full bg-white border-2 border-amber-100 rounded-xl px-4 py-3 text-sm font-bold text-amber-700 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50 transition-all placeholder:text-slate-300 mb-5"
        />
        <div className="grid grid-cols-2 gap-3 relative z-30">
          <button onClick={onCancel} className="py-3 rounded-full text-slate-500 font-bold bg-white/50 backdrop-blur-md border border-white/80 hover:bg-white hover:text-[#082F49] transition-colors">Hủy</button>
          <button disabled={!val} onClick={() => onConfirm(val)} className="py-3 rounded-full bg-[#06B6D4] text-white font-black shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 hover:bg-[#22D3EE] transition-all disabled:opacity-40 border border-[#06B6D4]">Vào phòng</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Gateway Component ─────────────────────────────────────────────────────
export default function MapGuessGateway() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(false);
  const [topic, setTopic] = useState('all');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'error' | 'info' } | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ roomCode: string } | null>(null);
  const [joinCode, setJoinCode] = useState('');

  const showToast = useCallback((msg: string, type: 'error' | 'info' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleCreateRoom = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/arena/map-guessing/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, password: isPrivate ? password : '' })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/arena/map-guessing/room/${data.roomCode}`);
      } else {
        setError(data.message);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const doJoin = useCallback(async (code: string, pass: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/arena/map-guessing/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, password: pass })
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/arena/map-guessing/room/${data.roomCode}`);
        return;
      }
      if (data.message === 'Sai mật khẩu') {
        showToast('Sai mật khẩu! Vui lòng thử lại.', 'error');
        setPasswordModal({ roomCode: code });
      } else {
        showToast(data.message || 'Không thể vào phòng.', 'error');
      }
    } catch (e: any) {
      showToast(e.message, 'error');
    }
    setLoading(false);
  }, [router, showToast]);

  const handleJoin = async () => {
    if (!joinCode) return;
    // First try joining without password; if private, modal will appear
    await doJoin(joinCode, '');
  };

  const handlePasswordConfirm = async (pass: string) => {
    if (!passwordModal) return;
    setPasswordModal(null);
    await doJoin(passwordModal.roomCode, pass);
  };

  return (
    <>
      {/* Toast notifications */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Password modal for private rooms */}
      {passwordModal && (
        <PasswordModal
          roomCode={passwordModal.roomCode}
          onConfirm={handlePasswordConfirm}
          onCancel={() => { setPasswordModal(null); setLoading(false); }}
        />
      )}

      <div className="relative h-full p-2 rounded-[32px] transition-all duration-300 flex flex-col group hover:-translate-y-1"
        style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
        <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20 transition-all group-hover:border-cyan-300/50"></div>
        
        {/* Hình Cover */}
        <Link href="/arena/map-guessing" className="block relative h-48 rounded-[28px] bg-slate-200 overflow-hidden border border-slate-100 cursor-pointer">
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
        </Link>

        {/* Thông tin */}
        <div className="p-5 flex-1 flex flex-col">
          <Link href="/arena/map-guessing" className="block cursor-pointer">
            <h3 className="text-xl font-extrabold text-[#082F49] mb-2 group-hover:text-rose-500 transition-colors">
              Bút Toán Bản Đồ
            </h3>
            <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">
              Nơi tranh tài nhận diện bản đồ thế giới! Mở phòng đấu cùng bạn bè hoặc vào chơi đơn luyện tập.
            </p>
          </Link>
          
          <div className="mt-auto grid grid-cols-2 gap-3 relative z-30">
            <Link href="/arena/map-guessing" className="flex items-center justify-center py-3 bg-[#22C55E] hover:bg-[#4ADE80] text-white font-black rounded-full shadow-[0_10px_20px_rgba(34,197,94,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 text-sm border border-[#22C55E]">
              🎮 Chơi Đơn
            </Link>
            <button onClick={() => setShowPopup(true)} className="flex items-center justify-center py-3 bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black rounded-full shadow-[0_10px_20px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 text-sm border border-[#06B6D4]">
              🚀 Tạo/Vào Phòng
            </button>
          </div>
          
          {/* Quick Join */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã phòng..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinCode && !loading && handleJoin()}
              className="flex-1 bg-white/80 border border-[#BAE6FD] rounded-full px-4 text-sm font-bold text-[#082F49] focus:outline-none focus:border-[#06B6D4] focus:ring-4 focus:ring-cyan-50 uppercase placeholder:normal-case placeholder:text-[#94A3B8] h-11 transition-all"
            />
            <button disabled={!joinCode || loading} onClick={() => handleJoin()} className="bg-[#082F49] text-white font-bold text-xs px-5 rounded-full hover:bg-[#0F172A] transition-all shadow-[0_5px_15px_rgba(8,47,73,0.3)] disabled:opacity-50 h-11 border border-[#082F49]">
              {loading ? '...' : 'VÀO'}
            </button>
          </div>
        </div>
      </div>

      {/* Create Room Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !loading && setShowPopup(false)} />
          <div className="relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
            <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-200 mx-auto mb-3 text-2xl">
                🚀
              </div>
              <h3 className="text-xl font-black text-[#082F49]">Tạo phòng</h3>
            </div>

            {error && (
              <div className="mb-4 px-4 py-2.5 rounded-xl border flex items-center gap-2" style={{ background: 'rgba(254,226,226,0.8)', borderColor: 'rgba(220,38,38,0.2)', color: '#DC2626' }}>
                <span className="text-base">❌</span>
                <p className="font-bold text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-[#082F49] mb-2 block relative z-30">Chủ đề</label>
                <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full bg-white/80 border border-[#BAE6FD] rounded-full px-4 py-3.5 text-sm font-bold text-[#082F49] outline-none hover:border-[#06B6D4] focus:border-[#06B6D4] focus:ring-4 focus:ring-cyan-50 transition-all cursor-pointer relative z-30 appearance-none">
                  {TOPIC_MODES.map(m => <option key={m.key} value={m.key}>{m.icon} {m.label}</option>)}
                </select>
              </div>

              <div className="bg-white/80 rounded-full px-5 py-3.5 border border-[#BAE6FD] flex items-center justify-between cursor-pointer relative z-30" onClick={() => setIsPrivate(!isPrivate)}>
                <span className="font-bold text-sm text-[#082F49]">Phòng kín (Cần mật khẩu)</span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isPrivate ? 'bg-emerald-400' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPrivate ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              {isPrivate && (
                <input
                  type="text"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border-2 border-emerald-100 rounded-xl px-4 py-3 text-sm font-bold text-emerald-600 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-slate-300"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8 relative z-30">
              <button disabled={loading} onClick={() => setShowPopup(false)} className="py-3.5 rounded-full text-slate-500 font-bold bg-white/50 backdrop-blur-md border border-white/80 hover:bg-white hover:text-[#082F49] transition-colors">
                Hủy bỏ
              </button>
              <button disabled={loading} onClick={handleCreateRoom} className="py-3.5 rounded-full bg-[#06B6D4] text-white font-black shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all border border-[#06B6D4] hover:bg-[#22D3EE]">
                {loading ? '⏳ Đang tạo...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
