'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PUZZLE_SETS } from '@/data/puzzleSets';

export default function MapPuzzleGateway() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedSet, setSelectedSet] = useState('sea');

  const set = PUZZLE_SETS.find(s => s.id === selectedSet)!;

  return (
    <>
      {/* ── Card ─────────────────────────────────────────────── */}
      <div
        className="relative h-full p-2 rounded-[32px] transition-all duration-300 flex flex-col group hover:-translate-y-1"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
        }}
      >
        <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20 transition-all group-hover:border-amber-300/50" />

        {/* Cover Image */}
        <div className="relative h-48 rounded-[28px] bg-slate-200 overflow-hidden border border-slate-100">
          {/* Stylised puzzle-map illustration using SVG overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#082F49] via-[#082F49]/40 to-transparent opacity-85" />

          {/* Floating pieces decoration */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-60 pointer-events-none">
            {['🧩','🗺️','🧩'].map((e, i) => (
              <span key={i} className={`text-3xl drop-shadow-lg ${i === 1 ? 'text-4xl opacity-100' : 'opacity-70'}`}>{e}</span>
            ))}
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white font-bold text-xs">
              🌍 6 khu vực · 63 quốc gia
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg font-black text-lg">
              🧩
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-extrabold text-[#082F49] mb-2 group-hover:text-amber-500 transition-colors">
            Ghép Bản Đồ
          </h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">
            Kéo-thả các mảnh ghép quốc gia vào đúng vị trí trên bản đồ. Rèn trí nhớ địa lý một cách thú vị!
          </p>

          {/* Action buttons */}
          <div className="mt-auto grid grid-cols-2 gap-3 relative z-30">
            <Link
              href="/puzzle"
              className="flex items-center justify-center py-3 bg-[#22C55E] hover:bg-[#4ADE80] text-white font-black rounded-full shadow-[0_10px_20px_rgba(34,197,94,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 text-sm border border-[#22C55E]"
            >
              🎮 Chơi Đơn
            </Link>
            <button
              onClick={() => setShowPopup(true)}
              className="flex items-center justify-center py-3 bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black rounded-full shadow-[0_10px_20px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 text-sm border border-[#06B6D4]"
            >
              ⚙️ Chọn Khu Vực
            </button>
          </div>
        </div>
      </div>

      {/* ── Puzzle Set Picker Popup ───────────────────────────── */}
      {showPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />
          <div
            className="relative w-full max-w-sm rounded-[32px] p-6 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
            }}
          >
            <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20" />

            {/* Header */}
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-200 mx-auto mb-3 text-2xl">
                🧩
              </div>
              <h3 className="text-xl font-black text-[#082F49]">Chọn Khu Vực</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Chọn bộ câu đố để bắt đầu</p>
            </div>

            {/* Puzzle set list */}
            <div className="space-y-2 relative z-30 mb-5">
              {PUZZLE_SETS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSet(s.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border text-sm font-bold transition-all ${
                    selectedSet === s.id
                      ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
                      : 'bg-white/70 border-white hover:border-amber-200 text-[#334155]'
                  }`}
                >
                  <span>{s.icon} {s.label}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {s.countries.length} mảnh
                  </span>
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 relative z-30">
              <button
                onClick={() => setShowPopup(false)}
                className="py-3.5 rounded-full text-slate-500 font-bold bg-white/50 backdrop-blur-md border border-white/80 hover:bg-white hover:text-[#082F49] transition-colors"
              >
                Hủy
              </button>
              <Link
                href={`/puzzle?set=${selectedSet}`}
                className="py-3.5 rounded-full bg-[#06B6D4] text-white font-black text-center shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 transition-all border border-[#06B6D4] hover:bg-[#22D3EE]"
              >
                Bắt đầu!
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
