'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { STREAK_MILESTONES, getNextStreakMilestone } from '@/utils/streakSystem';

interface StreakModalProps {
  streak: number;
  onClose: () => void;
}

export function StreakModal({ streak, onClose }: StreakModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const nextMilestone = getNextStreakMilestone(streak);

  const modal = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-[28px] overflow-hidden animate-[slide-up_0.35s_cubic-bezier(.34,1.56,.64,1)]"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(32px)',
          border: '1.5px solid rgba(255,255,255,1)',
          boxShadow: '0 24px 60px rgba(8,47,73,0.18)',
        }}
      >
        {/* Header gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400" />

        {/* Header content */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-2xl shadow-[0_4px_16px_rgba(249,115,22,0.35)]">
              🔥
            </div>
            <div>
              <h3 className="font-black text-[#082F49] text-xl leading-tight">Chuỗi ngày học</h3>
              <p className="text-slate-400 text-sm font-semibold">
                Hiện tại: <span className="text-orange-500 font-black">{streak} ngày</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Next milestone banner */}
        {nextMilestone && (
          <div className="mx-6 mb-4 rounded-[16px] px-4 py-3 flex items-center justify-between"
            style={{ background: 'rgba(254,240,138,0.5)', border: '1px solid rgba(251,191,36,0.4)' }}>
            <div className="flex items-center gap-2 text-sm font-bold text-amber-700">
              <span className="text-lg">{nextMilestone.icon}</span>
              <span>Mốc tiếp theo: <strong>{nextMilestone.days} ngày</strong></span>
            </div>
            <div className="flex items-center gap-1 font-black text-amber-600 text-sm">
              🪙 +{nextMilestone.reward} Xu
            </div>
          </div>
        )}

        {/* Milestones list */}
        <div className="px-6 pb-6 space-y-2.5 max-h-[55vh] overflow-y-auto custom-scrollbar">
          {STREAK_MILESTONES.map((m, i) => {
            const reached = streak >= m.days;
            const isCurrent = m.days === STREAK_MILESTONES.find(x => x.days > streak)?.days;
            const pct = isCurrent
              ? Math.min(100, Math.round((streak / m.days) * 100))
              : reached ? 100 : 0;

            return (
              <div
                key={m.days}
                className={`rounded-[16px] p-4 flex items-center gap-4 transition-all duration-300 ${
                  reached
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200'
                    : isCurrent
                    ? 'bg-gradient-to-r from-sky-50 to-cyan-50 border-2 border-cyan-300 shadow-md'
                    : 'bg-white/60 border border-slate-100 opacity-60'
                }`}
              >
                {/* Left: Icon circle */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 border-2 ${
                  reached
                    ? 'bg-gradient-to-br from-orange-400 to-rose-500 border-orange-200 shadow-md'
                    : isCurrent
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 border-cyan-200 shadow-md'
                    : 'bg-slate-100 border-slate-200'
                }`}>
                  {reached ? '✅' : m.icon}
                </div>

                {/* Middle */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-black text-sm ${reached ? 'text-orange-600' : isCurrent ? 'text-cyan-600' : 'text-slate-400'}`}>
                        {m.days} ngày
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        reached ? 'bg-orange-100 text-orange-600' : isCurrent ? 'bg-cyan-100 text-cyan-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {m.label}
                      </span>
                      {isCurrent && <span className="text-[10px] font-black text-cyan-500 bg-cyan-100 px-2 py-0.5 rounded-full animate-pulse">SẮP ĐẾN</span>}
                    </div>
                    <span className={`font-black text-sm shrink-0 ${reached ? 'text-amber-600' : isCurrent ? 'text-amber-500' : 'text-slate-400'}`}>
                      🪙 +{m.reward}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {isCurrent && (
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  {reached && !isCurrent && (
                    <div className="w-full h-2 rounded-full bg-orange-100 overflow-hidden">
                      <div className="h-full w-full rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mx-6 mb-6 rounded-[16px] p-4 text-center"
          style={{ background: 'rgba(224,242,254,0.6)', border: '1px solid rgba(186,230,253,0.6)' }}>
          <p className="text-xs font-semibold text-sky-600">
            💡 Hoàn thành nhiệm vụ mỗi ngày để duy trì chuỗi và nhận xu thưởng tại các mốc!
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(14,165,233,0.25); border-radius: 10px; }
      ` }} />
    </div>
  );

  if (!mounted || typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}
