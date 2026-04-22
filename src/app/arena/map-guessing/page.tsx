'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { trackMission } from '@/utils/missionTracker';
import { TOPIC_MODES } from '@/utils/map-guessing-utils';
import MapGuessSolo from '@/components/arena/MapGuessSolo';

export default function MapGuessingRouter() {
  const [dbFeatures, setDbFeatures] = useState<any[]>([]);
  
  // States: LOADING | MENU | SOLO_PLAYING | SOLO_SUMMARY
  const [status, setStatus] = useState<'LOADING' | 'MENU' | 'SOLO_PLAYING' | 'SOLO_SUMMARY'>('LOADING');
  const [topic, setTopic] = useState('all');
  
  // Shared properties
  const [score, setScore] = useState(0);
  
  // History properties
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expAwarded, setExpAwarded] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/map/features?category=physical').then(r => r.json()),
      fetch('/api/map/features?category=economic').then(r => r.json()),
    ]).then(([phys, econ]) => {
      const all = [
        ...phys.map((f: any) => ({ ...f, ...f.attributes })),
        ...econ.map((f: any) => ({ ...f, ...f.attributes })),
      ].filter(f => f.lat && f.lng);
      setDbFeatures(all);
      setStatus('MENU');
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/arena/map-guessing/history');
      const data = await res.json();
      if (data.success) {
        setMatchHistory(data.history);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    if (status === 'MENU') {
      fetchHistory();
      setExpAwarded(null);
      setShowAllHistory(false);
    }
  }, [status, fetchHistory]);

  const handleStartSolo = (sel: string) => {
    setTopic(sel);
    setStatus('SOLO_PLAYING');
  };

  const handleSoloEnd = async (finalScore: number) => {
    setScore(finalScore);
    setStatus('SOLO_SUMMARY');
    setSubmitting(true);
    try {
      const res = await fetch('/api/arena/map-guessing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, score: finalScore })
      });
      const data = await res.json();
      if (data.success && data.expEarned > 0) setExpAwarded(data.expEarned);
    } catch (err) {}
    setSubmitting(false);
  };

  if (status === 'LOADING') return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#E0F2FE] to-[#DCFCE7]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        <p className="text-xl font-black text-[#082F49]">Đang chuẩn bị bản đồ...</p>
      </div>
    </div>
  );

  if (status === 'SOLO_PLAYING') {
    return <MapGuessSolo topic={topic} dbFeatures={dbFeatures} onSummary={handleSoloEnd} />;
  }

  if (status === 'SOLO_SUMMARY') {
    const pct = Math.round((score / 10000) * 100);
    const sg = score >= 8000 ? { icon: '🏆', label: 'Thần Đồng Địa Lý', c: 'text-yellow-400' }
             : score >= 5000 ? { icon: '🥇', label: 'Nhà Thám Hiểm',    c: 'text-cyan-400'   }
             : score >= 3000 ? { icon: '🥈', label: 'Người Học Việc',    c: 'text-slate-300'  }
             :                 { icon: '🌱', label: 'Tập Sự Địa Lý',     c: 'text-emerald-400'};
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Liquid Mesh Gradient Nền */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
        </div>

        <div className="w-full max-w-lg rounded-[32px] p-8 text-center relative z-10"
             style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
          <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
          <div className="text-7xl mb-3 relative z-30">{sg.icon}</div>
          <p className={`font-black text-2xl mb-1 relative z-30 ${sg.c.replace('text-slate-300', 'text-slate-500').replace('text-yellow-400', 'text-amber-500')}`}>{sg.label}</p>
          <p className="text-slate-500 font-medium mb-4 relative z-30">Chủ đề: {topic}</p>
          
          {submitting ? (
             <div className="inline-flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full mb-6 relative z-30 shadow-sm border border-white/80">
                <div className="w-4 h-4 rounded-full border-2 border-[#06B6D4] border-t-transparent animate-spin"/>
                <span className="text-xs font-bold text-[#082F49]">Đang lưu kết quả...</span>
             </div>
          ) : expAwarded ? (
             <div className="inline-flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 font-black px-4 py-2 rounded-full mb-6 max-w-max mx-auto shadow-sm animate-bounce relative z-30">
                🎉 Nhận {expAwarded} EXP!
             </div>
          ) : (
             <div className="h-10 mb-6 relative z-30"></div> // spacer
          )}

          <div className="text-7xl font-black text-[#082F49] mb-1 tabular-nums relative z-30 drop-shadow-sm">{score.toLocaleString('vi-VN')}</div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-3 relative z-30">/ 10,000 điểm tối đa</p>
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden mb-8 relative z-30 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex gap-3 relative z-30">
            <button onClick={() => setStatus('MENU')} className="flex-1 py-4 rounded-full bg-white/50 hover:bg-white text-slate-500 font-black transition-all border border-white/80 shadow-sm">Menu</button>
            <button onClick={() => setStatus('SOLO_PLAYING')} className="flex-1 py-4 rounded-full bg-gradient-to-r from-[#06B6D4] to-[#0369A1] text-white font-black transition-all shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_30px_rgba(34,211,238,0.5)] hover:-translate-y-0.5 border-[2px] border-[#06B6D4]">Thử Lại 🔄</button>
          </div>
        </div>
      </div>
    );
  }

  // SOLO MENU ONLY
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] flex items-center justify-center flex-col p-4 relative overflow-hidden">
      {/* Liquid Mesh Gradient Nền */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
      </div>
      
      <div className="w-full max-w-lg mb-8 relative z-10">
        <div className="text-center mb-7 mt-8">
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-600 font-bold text-xs uppercase tracking-widest mb-3 border border-cyan-100">Bút Toán Bản Đồ</span>
          <h1 className="text-4xl font-black text-[#082F49]">Luyện Tập Đơn</h1>
          <p className="text-slate-500 font-medium mt-2">Chọn chủ đề và thử thách kiến thức cá nhân</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5 p-5 rounded-[32px] relative"
             style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
          <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
           {TOPIC_MODES.map(m => (
              <div key={m.key} className={`${m.span ? 'col-span-2' : ''} flex items-center gap-2 p-3 rounded-[16px] bg-white border border-slate-100 hover:shadow-md transition-all group cursor-pointer`} onClick={() => handleStartSolo(m.key)}>
                 <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${m.grad} flex items-center justify-center text-lg shadow-sm ${m.sh} shrink-0 group-hover:scale-110 transition-transform`}>{m.icon}</div>
                 <div>
                   <p className="font-black text-[#082F49] text-sm leading-none">{m.label}</p>
                 </div>
              </div>
           ))}
        </div>
      </div>

      <Link href="/arena" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-rose-500 transition-colors mb-6">← Trở về Đấu Trường</Link>

      {/* History Area */}
      {status === 'MENU' && matchHistory.length > 0 && (
         <div className="w-full max-w-3xl rounded-[32px] overflow-hidden relative"
              style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
            <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
            <div className="px-5 py-4 bg-gradient-to-r from-cyan-50 to-emerald-50 border-b border-white flex items-center justify-between">
              <h2 className="font-black text-[#082F49] text-base">🕒 Lịch sử thi đấu</h2>
              <span className="px-2 py-1 bg-white rounded-full text-xs font-bold text-slate-400 shadow-sm border border-slate-100">{matchHistory.length} trận gần nhất</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white">Thời gian</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white">Chế độ</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white text-right">Điểm</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-white text-right">Thưởng</th>
                  </tr>
                </thead>
                <tbody>
                  {(showAllHistory ? matchHistory : matchHistory.slice(0, 6)).map((mh, idx) => (
                    <tr key={mh._id || idx} className="hover:bg-cyan-50/30 transition-colors border-b border-slate-50/50 last:border-0">
                      <td className="px-4 py-3 align-middle text-xs font-bold text-slate-500 whitespace-nowrap">
                        {new Date(mh.playedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 align-middle text-xs font-bold text-[#082F49] whitespace-nowrap flex items-center gap-1.5">
                        {mh.gameMode === 'map-guessing-duo' ? <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase inline-block">DUO</span> : <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px] font-black uppercase inline-block">SOLO</span>}
                        {mh.topic === 'all' ? 'Ngẫu nhiên' : TOPIC_MODES.find(m => m.key === mh.topic)?.label || mh.topic}
                      </td>
                      <td className="px-4 py-3 align-middle text-right font-black text-cyan-600 tabular-nums">
                        {mh.score}
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        {mh.expEarned > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-xs font-black">
                            +{mh.expEarned} XP
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {matchHistory.length > 6 && (
              <div className="p-3 bg-slate-50/50 border-t border-white text-center">
                <button 
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-700 bg-white px-4 py-1.5 rounded-full shadow-sm hover:shadow border border-slate-100 transition-all"
                >
                  {showAllHistory ? 'Thu gọn bớt' : `Xem thêm ${matchHistory.length - 6} trận nữa ↓`}
                </button>
              </div>
            )}
         </div>
      )}

    </div>
  );
}