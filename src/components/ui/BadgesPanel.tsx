'use client';

/**
 * BadgesPanel   — grid popup hiển thị tất cả huy hiệu (mở / khoá)
 * BadgeSummaryCard — card nhỏ dùng trong phần tổng quan
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BADGES, checkUnlocked } from '@/data/badges';

// ─── Props ─────────────────────────────────────────────────────────────────────
interface BadgesProps {
  exp: number;
  streak: number;
  booksRead?: number;
  mapsGuessed?: number;
  arenaWins?: number;
  tasksCompleted?: number;
}

// ─── Full Badge Grid Modal ─────────────────────────────────────────────────────
function BadgesModal({ onClose, ...props }: BadgesProps & { onClose: () => void }) {
  const { exp, streak, booksRead = 0, mapsGuessed = 0, arenaWins = 0, tasksCompleted = 0 } = props;

  const check = useCallback((b: Parameters<typeof checkUnlocked>[0]) =>
    checkUnlocked(b, exp, streak, booksRead, mapsGuessed, arenaWins, tasksCompleted),
    [exp, streak, booksRead, mapsGuessed, arenaWins, tasksCompleted]
  );

  const totalUnlocked = BADGES.filter(check).length;

  const modal = (
    <div
      style={{ position:'fixed', inset:0, zIndex:9998, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position:'absolute', inset:0, background:'rgba(8,47,73,0.5)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)' }} />

      {/* Panel */}
      <div
        style={{
          position:'relative', zIndex:1, width:'100%', maxWidth:'760px', maxHeight:'85vh',
          background:'rgba(255,255,255,0.95)', backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
          border:'2px solid rgba(255,255,255,1)', borderRadius:'36px',
          boxShadow:'0 40px 80px rgba(8,47,73,0.18)', display:'flex', flexDirection:'column', overflow:'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'24px 28px 20px', borderBottom:'1px solid rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#FBBF24,#F59E0B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', boxShadow:'0 4px 12px rgba(251,146,60,.4)', border:'2.5px solid white', flexShrink:0 }}>🏆</div>
            <div>
              <h2 style={{ fontSize:'20px', fontWeight:900, color:'#082F49', margin:0 }}>Bộ Sưu Tập Huy Hiệu</h2>
              <p style={{ fontSize:'13px', color:'#94A3B8', fontWeight:600, margin:'2px 0 0' }}>
                Đã mở khoá <strong style={{ color:'#06B6D4' }}>{totalUnlocked}</strong> / 25 huy hiệu
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ flex:1, maxWidth:'200px', display:'none' }} className="sm-flex">
            <div style={{ height:'8px', background:'#F1F5F9', borderRadius:'99px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(totalUnlocked/25)*100}%`, background:'linear-gradient(90deg,#06B6D4,#3B82F6)', borderRadius:'99px', transition:'width .8s ease' }} />
            </div>
          </div>

          <button onClick={onClose} style={{ width:'38px', height:'38px', borderRadius:'50%', border:'1.5px solid #E2E8F0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:'#64748B', flexShrink:0, transition:'all .2s' }}>×</button>
        </div>

        {/* Grid */}
        <div style={{ overflowY:'auto', padding:'20px 24px 28px' }}>
          {/* Progress bar (mobile) */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:700, color:'#94A3B8', marginBottom:'6px' }}>
              <span>Tiến độ</span>
              <span style={{ color:'#082F49' }}>{totalUnlocked}<span style={{ color:'#94A3B8' }}>/25</span></span>
            </div>
            <div style={{ height:'10px', background:'#F1F5F9', borderRadius:'99px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${(totalUnlocked/25)*100}%`, background:'linear-gradient(90deg,#06B6D4,#3B82F6)', borderRadius:'99px', transition:'width 1s ease' }} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:'12px' }}>
            {BADGES.map((badge) => {
              const isUnlocked = check(badge);
              return (
                <div
                  key={badge.id}
                  title={badge.description}
                  style={{
                    display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
                    padding:'16px 10px', borderRadius:'20px', position:'relative', overflow:'hidden',
                    background: isUnlocked ? 'white' : 'rgba(248,250,252,0.8)',
                    border: isUnlocked ? '1px solid rgba(255,255,255,0.8)' : '1px solid #F1F5F9',
                    boxShadow: isUnlocked ? '0 4px 16px rgba(14,165,233,0.1)' : 'none',
                    transition:'all .25s ease',
                    cursor:'default',
                    filter: isUnlocked ? 'none' : 'grayscale(0.6)',
                    opacity: isUnlocked ? 1 : 0.55,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width:'56px', height:'56px', borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px',
                    marginBottom:'10px', border:'3px solid white',
                    background: isUnlocked
                      ? `linear-gradient(135deg, var(--c1, #06B6D4), var(--c2, #3B82F6))`
                      : '#E2E8F0',
                    boxShadow: isUnlocked ? '0 4px 12px rgba(6,182,212,0.25)' : 'none',
                  }}>
                    {isUnlocked ? badge.icon : '🔒'}
                  </div>
                  <h4 style={{ fontSize:'12px', fontWeight:800, color: isUnlocked ? '#082F49' : '#94A3B8', margin:'0 0 4px', lineHeight:1.3 }}>{badge.name}</h4>
                  <p style={{ fontSize:'10px', fontWeight:600, color:'#CBD5E1', margin:0, lineHeight:1.3 }}>{badge.description}</p>

                  {/* Unlocked shine */}
                  {isUnlocked && (
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', borderRadius:'20px 20px 0 0', background:'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}

// ─── Small Summary Card (for Overview Tab) ─────────────────────────────────────
export function BadgeSummaryCard(props: BadgesProps) {
  const [open, setOpen] = useState(false);
  const { exp, streak, booksRead = 0, mapsGuessed = 0, arenaWins = 0, tasksCompleted = 0 } = props;

  const totalUnlocked = BADGES.filter((b) =>
    checkUnlocked(b, exp, streak, booksRead, mapsGuessed, arenaWins, tasksCompleted)
  ).length;

  // Lấy 3 huy hiệu gần nhất đã mở khoá để preview
  const previewBadges = BADGES
    .filter((b) => checkUnlocked(b, exp, streak, booksRead, mapsGuessed, arenaWins, tasksCompleted))
    .slice(-3);

  return (
    <>
      {open && <BadgesModal {...props} onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-[24px] p-5 flex items-center justify-between gap-4 transition-all duration-300 hover:-translate-y-1 group"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 8px 24px rgba(14, 165, 233, 0.08), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        {/* Left: Icon + text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(251,146,60,0.4)] border-2 border-white shrink-0">
            🏅
          </div>
          <div className="min-w-0">
            <p className="text-[#082F49] font-black text-sm leading-tight">Huy Hiệu</p>
            <p className="text-[#06B6D4] font-black text-xl leading-tight tabular-nums">
              {totalUnlocked}<span className="text-xs text-slate-400 font-bold">/25</span>
            </p>
          </div>
        </div>

        {/* Center: preview icons */}
        {previewBadges.length > 0 && (
          <div className="flex items-center -space-x-2 shrink-0">
            {previewBadges.map((b) => (
              <div
                key={b.id}
                className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-lg shadow-sm"
                style={{ background: `linear-gradient(135deg, #06B6D4, #3B82F6)` }}
                title={b.name}
              >
                {b.icon}
              </div>
            ))}
          </div>
        )}

        {/* Right: Arrow */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </button>
    </>
  );
}

// ─── Full Panel (for Profile page) ────────────────────────────────────────────
export function BadgesPanel(props: BadgesProps) {
  const [open, setOpen] = useState(false);
  const { exp, streak, booksRead = 0, mapsGuessed = 0, arenaWins = 0, tasksCompleted = 0 } = props;

  const totalUnlocked = BADGES.filter((b) =>
    checkUnlocked(b, exp, streak, booksRead, mapsGuessed, arenaWins, tasksCompleted)
  ).length;

  return (
    <>
      {open && <BadgesModal {...props} onClose={() => setOpen(false)} />}
      <div className="w-full flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div
          className="w-full p-6 rounded-[32px] flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center text-3xl shadow-[0_4px_16px_rgba(251,146,60,0.4)] border-2 border-white">🏆</div>
            <div>
              <h3 className="text-xl font-black text-[#082F49]">Bộ Sưu Tập Huy Hiệu</h3>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">Đã mở khoá <strong className="text-cyan-500">{totalUnlocked}</strong>/25 danh hiệu</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="h-12 px-7 rounded-full bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black text-sm shadow-[0_8px_20px_rgba(6,182,212,0.35)] hover:-translate-y-0.5 transition-all"
          >
            Xem tất cả →
          </button>
        </div>

        {/* Mini grid preview (6 badges) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {BADGES.slice(0, 6).map((badge) => {
            const isUnlocked = checkUnlocked(badge, exp, streak, booksRead, mapsGuessed, arenaWins, tasksCompleted);
            return (
              <div
                key={badge.id}
                onClick={() => setOpen(true)}
                className={`flex flex-col items-center text-center p-3 rounded-[20px] cursor-pointer transition-all duration-300 hover:-translate-y-1 ${isUnlocked ? 'bg-white shadow-[0_4px_16px_rgba(14,165,233,0.1)]' : 'bg-white/40 opacity-50'}`}
                style={{ border: '1px solid rgba(255,255,255,0.8)' }}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 border-2 border-white ${isUnlocked ? `bg-gradient-to-br ${badge.color} shadow-md` : 'bg-slate-200'}`}>
                  {isUnlocked ? badge.icon : '🔒'}
                </div>
                <p className={`text-[11px] font-black leading-tight ${isUnlocked ? 'text-[#082F49]' : 'text-slate-400'}`}>{badge.name}</p>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
