'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ALL_MISSIONS } from '@/utils/missions';
import { claimMission, claimMissionWithExp } from '@/utils/missionTracker';
import { useStudyTimer } from '@/utils/useStudyTimer';
import type { MissionId, IMissionSlot } from '@/models/DailyMission';
import { FlashcardPanel } from '@/components/ui/FlashcardPanel';

type ActiveTab = 'overview' | 'flashcard';

const MODULES: { id: ActiveTab | string; label: string; sub: string; icon: string; href?: string; isTab?: boolean }[] = [
  { id: 'overview',   label: 'Tổng quan',    sub: 'Tiến độ & Hoạt động', icon: '🏠', isTab: true },
  { id: 'flashcard',  label: 'Thẻ Ghi Nhớ', sub: 'Luyện tập thẻ 3D',     icon: '📝', isTab: true },
];

const DAYS = ['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'];

interface DashboardOverviewProps {
  username: string;
  avatar?: string;
  initialExp?: number;
  initialStreak?: number;
  initialStudySeconds?: number;
}

type StreakDay = { date: string; active: boolean };

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return (
    <div className="text-right shrink-0">
      <p className="text-[#082F49] font-black text-3xl md:text-4xl tracking-tight tabular-nums opacity-0">00:00:00 ⏳</p>
      <p className="text-cyan-500 font-bold text-xs md:text-sm mt-1 uppercase tracking-widest opacity-0">ĐANG TẢI</p>
    </div>
  );

  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="text-right shrink-0">
      <p className="text-[#082F49] font-black text-3xl md:text-4xl tracking-tight tabular-nums">{timeStr} ⏳</p>
      <p className="text-cyan-500 font-bold text-xs md:text-sm mt-1 uppercase tracking-widest">{dateStr}</p>
    </div>
  );
}

/** Countdown to Vietnam midnight (UTC+7 = next 00:00 VN) */
function useResetCountdown() {
  const calc = () => {
    const now = new Date();
    const vnNow = new Date(now.getTime() + 7 * 3600_000);
    const vnMidnight = new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + 1));
    const diff = vnMidnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600_000);
    const m = Math.floor((diff % 3600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };
  const [countdown, setCountdown] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setCountdown(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return countdown;
}

export function DashboardOverview({ username, avatar, initialExp = 0, initialStreak = 0, initialStudySeconds = 0 }: DashboardOverviewProps) {
  const moduleRef = useRef<HTMLDivElement>(null);
  const today = new Date().getDay();
  const resetCountdown = useResetCountdown();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // ── Study timer (real-time, persists to DB) ──
  const studySecs = useStudyTimer(initialStudySeconds);

  // ── Daily missions state ──
  const [missionSlots, setMissionSlots] = useState<IMissionSlot[]>([]);
  const [claimingId, setClaimingId] = useState<MissionId | null>(null);
  const [claimedExp, setClaimedExp] = useState<Record<string, number>>({});
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [totalExp, setTotalExp] = useState(initialExp);
  const [streak, setStreak] = useState(initialStreak);
  const [last7Days, setLast7Days] = useState<StreakDay[]>([]);

  const fetchMissions = useCallback(async () => {
    try {
      const res = await fetch('/api/missions/daily');
      if (res.ok) {
        const data = await res.json();
        setMissionSlots(data.missions ?? []);
        if (typeof data.streak === 'number') setStreak(data.streak);
        if (Array.isArray(data.last7Days)) setLast7Days(data.last7Days);
      }
    } finally {
      setMissionsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMissions(); }, [fetchMissions]);

  const handleClaim = async (missionId: MissionId) => {
    setClaimingId(missionId);
    const result = await claimMissionWithExp(missionId);
    if (result.exp > 0) {
      setClaimedExp(prev => ({ ...prev, [missionId]: result.exp }));
      setTotalExp(result.totalExp);
      if (result.streak > 0) setStreak(result.streak);
      await fetchMissions();
    }
    setClaimingId(null);
  };

  const scrollModules = (dir: number) => {
    moduleRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <section className="pt-8 pb-16 relative overflow-hidden bg-transparent">
      <div className="w-[90%] max-w-[1400px] mx-auto px-4 xl:px-8 relative z-10 space-y-6">

        {/* ── Section Header ── */}
        <div className="text-center mb-2">
          <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-600 font-bold text-xs uppercase tracking-widest border border-cyan-100">
            Bảng điều khiển
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-[#082F49] tracking-tight mt-3">
            Không gian <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Thao tác</span>
          </h2>
          <p className="text-slate-500 font-medium mt-3 max-w-xl mx-auto">Vuốt mượt mà để khám phá các module học tập.</p>
        </div>

        {/* ── Module Navigation Slider ── */}
        <div className="relative">
          <button
            onClick={() => scrollModules(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-[#082F49] hover:border-cyan-300 transition-all hidden md:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            onClick={() => scrollModules(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-[#082F49] hover:border-cyan-300 transition-all hidden md:flex"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <div
            ref={moduleRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {MODULES.map((mod) => {
              const isActive = mod.isTab ? activeTab === mod.id : false;
              const cls = `shrink-0 snap-start w-[140px] md:w-[160px] rounded-[24px] p-5 flex flex-col items-center gap-2 transition-all duration-300 border ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white border-transparent shadow-[0_8px_24px_rgba(6,182,212,0.35)] hover:shadow-[0_12px_32px_rgba(6,182,212,0.45)] hover:-translate-y-1'
                  : 'bg-white/75 backdrop-blur-xl border-white text-[#082F49] shadow-[0_4px_16px_rgba(14,165,233,0.06)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.12)] hover:-translate-y-1 hover:border-cyan-100'
              }`;
              const inner = (
                <>
                  <span className="text-3xl leading-none">{mod.icon}</span>
                  <span className={`font-black text-sm text-center leading-tight ${isActive ? 'text-white' : 'text-[#082F49]'}`}>{mod.label}</span>
                  <span className={`text-[11px] text-center leading-tight ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{mod.sub}</span>
                </>
              );
              if (mod.isTab) {
                return (
                  <button key={mod.id} onClick={() => setActiveTab(mod.id as ActiveTab)} className={cls}>
                    {inner}
                  </button>
                );
              }
              return (
                <Link key={mod.id} href={mod.href ?? '/'} className={cls}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'flashcard' && <FlashcardPanel />}

        {activeTab === 'overview' && <>

        {/* ── Greeting Bar ── */}
        <div
          className="rounded-[24px] p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={username} className="w-14 h-14 rounded-full object-cover ring-4 ring-cyan-100" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-black text-xl ring-4 ring-cyan-100">
                  {displayName.charAt(0)}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white"></span>
            </div>
            <div>
              <p className="text-[#082F49] text-xl md:text-2xl font-black">
                Xin chào <span className="text-cyan-500">{displayName}</span> 👋
              </p>
              <p className="text-slate-400 text-sm font-medium mt-0.5">Bảng điều khiển đa nhiệm · Cập nhật thời gian thực</p>
            </div>
          </div>
          <LiveClock />
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: '⏱️',
              tag: 'THỜI GIAN HỌC',
              tagColor: 'text-pink-400',
              value: (() => {
                const h = Math.floor(studySecs / 3600);
                const m = Math.floor((studySecs % 3600) / 60);
                const s = studySecs % 60;
                if (h > 0) return (
                  <><span className="text-4xl font-black text-[#082F49] tabular-nums">{h}</span><span className="text-xl font-bold text-[#082F49] ml-1">h</span>
                  <span className="text-2xl font-black text-[#082F49] ml-2 tabular-nums">{m}</span><span className="text-xl font-bold text-[#082F49] ml-1">p</span></>
                );
                if (m > 0) return (
                  <><span className="text-4xl font-black text-[#082F49] tabular-nums">{m}</span><span className="text-xl font-bold text-[#082F49] ml-1">phút</span></>
                );
                return (
                  <><span className="text-4xl font-black text-[#082F49] tabular-nums">{s}</span><span className="text-xl font-bold text-[#082F49] ml-1">giây</span></>
                );
              })(),
              sub: <span className="text-slate-400 text-xs font-medium">Hôm nay — đang chạy theo thời gian thực</span>,
            },
            {
              icon: '🔥',
              tag: 'CHUỖI NGÀY',
              tagColor: 'text-orange-400',
              value: <><span className="text-4xl font-black text-[#082F49]">{streak}</span><span className="text-base font-bold text-[#082F49] ml-2">ngày</span></>,
              sub: last7Days[0]?.active
                ? <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">✅ Hôm nay đã tính!</span>
                : <span className="text-amber-500 text-xs font-bold flex items-center gap-1">⚠️ Làm nhiệm vụ để giữ chuỗi!</span>,
            },
            {
              icon: '✨',
              tag: 'ĐẤU TRƯỜNG',
              tagColor: 'text-yellow-500',
              value: <><span className="text-4xl font-black text-[#082F49]">{totalExp.toLocaleString('vi-VN')}</span><span className="text-base font-bold text-cyan-400 ml-2">EXP</span></>,
              sub: <span className="text-slate-400 text-xs font-medium">Làm nhiệm vụ để lấy thêm EXP!</span>,
              highlight: true,
            },
            {
              icon: '🚀',
              tag: 'BÀI HỌC',
              tagColor: 'text-emerald-500',
              value: <><span className="text-4xl font-black text-[#082F49]">0</span><span className="text-base font-bold text-[#082F49] ml-1">/6</span></>,
              sub: <span className="text-slate-400 text-xs font-medium">Bài học đã hoàn thành</span>,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`rounded-[24px] p-5 md:p-6 flex flex-col gap-2 transition-all duration-300 hover:-translate-y-1 ${stat.highlight ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100' : ''}`}
              style={!stat.highlight ? {
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
              } : {}}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl leading-none">{stat.icon}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.tagColor}`}>{stat.tag}</span>
              </div>
              <div className="mt-1">{stat.value}</div>
              <div>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Daily Missions ── */}
        <div
          className="rounded-[24px] p-6 md:p-7"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-[#082F49] font-black text-xl flex items-center gap-2">🎯 Nhiệm vụ EXP hôm nay</p>
              <p className="text-slate-400 text-sm font-medium mt-1">Hoàn thành nhiệm vụ để nhận EXP đua top bảng đấu trường nhé!</p>
            </div>
            <div
              className="shrink-0 rounded-[16px] px-4 py-2 flex items-center gap-2 text-orange-500 font-bold text-sm"
              style={{ background: 'rgba(254,240,138,0.5)', border: '1px solid rgba(251,191,36,0.3)' }}
            >
              <span>⏰</span> Làm mới sau: <span className="font-black tabular-nums">{resetCountdown}</span>
            </div>
          </div>

          {missionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0,1,2].map(i => (
                <div key={i} className="rounded-[20px] p-5 h-40 animate-pulse bg-slate-100/80" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {missionSlots.map((slot) => {
                const def = ALL_MISSIONS.find(m => m.id === slot.missionId);
                if (!def) return null;
                const pct = slot.target > 0 ? Math.min(100, Math.round((slot.progress / slot.target) * 100)) : 0;
                const isComplete = slot.completed;
                const isClaimed  = slot.claimed;
                const isClaiming = claimingId === slot.missionId;
                const justClaimed = claimedExp[slot.missionId];

                return (
                  <div
                    key={slot.missionId}
                    className={`rounded-[20px] p-5 flex flex-col gap-3 transition-all duration-300 ${
                      isClaimed
                        ? 'opacity-60'
                        : isComplete
                        ? 'ring-2 ring-emerald-400 ring-offset-2 hover:-translate-y-0.5'
                        : 'hover:-translate-y-0.5'
                    }`}
                    style={{
                      background: isClaimed
                        ? 'rgba(187,247,208,0.25)'
                        : isComplete
                        ? 'rgba(187,247,208,0.4)'
                        : 'rgba(248,250,252,0.8)',
                      border: isComplete && !isClaimed
                        ? '1px solid rgba(74,222,128,0.6)'
                        : '1px solid rgba(226,232,240,0.8)',
                    }}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm border border-slate-100">
                          {def.icon}
                        </span>
                        <div>
                          <p className="text-[#082F49] font-black text-sm leading-tight">{def.label}</p>
                          <p className="text-slate-400 text-xs font-medium mt-0.5">{def.sub}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 font-black text-sm px-2.5 py-1 rounded-full border ${
                        isClaimed ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-cyan-500 bg-cyan-50 border-cyan-100'
                      }`}>
                        +{slot.exp} EXP
                      </span>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                        <span>Tiến độ</span>
                        <span className="tabular-nums">{slot.progress}/{slot.target} {def.unit}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isClaimed
                              ? 'bg-gradient-to-r from-emerald-300 to-green-400'
                              : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Status / Claim button */}
                    {isClaimed ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <span>✅</span>
                        <span>Đã nhận {justClaimed ? `+${justClaimed} EXP` : 'thưởng'}!</span>
                      </div>
                    ) : isComplete ? (
                      <button
                        onClick={() => handleClaim(slot.missionId as MissionId)}
                        disabled={isClaiming}
                        className="w-full py-2.5 rounded-[14px] bg-gradient-to-r from-emerald-400 to-green-500 text-white font-black text-sm shadow-[0_4px_12px_rgba(34,197,94,0.35)] hover:shadow-[0_6px_18px_rgba(34,197,94,0.45)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-60"
                      >
                        {isClaiming ? '⏳ Đang nhận...' : '🎁 Nhận thưởng'}
                      </button>
                    ) : (
                      <p className="text-xs font-bold text-slate-400">
                        {pct === 0 ? 'Chưa bắt đầu' : `${pct}% hoàn thành`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Bottom Row: Streak + Quick Nav ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Streak Calendar */}
          <div
            className="rounded-[24px] p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[#082F49] font-black text-base flex items-center gap-2">🔥 Chuỗi ngày học</p>
              {last7Days[0]?.active ? (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">✅ Hôm nay đã tính</span>
              ) : (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-orange-500 border border-amber-200">⚠️ Chưa tính hôm nay</span>
              )}
            </div>

            {/* Big flame + count */}
            <div className="flex items-center gap-5 mb-5">
              <div className="relative shrink-0">
                <span className="text-[72px] leading-none drop-shadow-lg">🔥</span>
                {streak >= 7 && (
                  <span className="absolute -top-1 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-xs font-black flex items-center justify-center text-white shadow-md">★</span>
                )}
              </div>
              <div>
                <p className="text-5xl md:text-6xl font-black text-[#082F49] leading-none tabular-nums">{streak}</p>
                <p className="text-slate-400 font-bold text-sm mt-1">ngày liên tiếp</p>
                {streak === 0 && <p className="text-orange-400 font-bold text-xs mt-0.5">Hãy bắt đầu chuỗi của bạn!</p>}
                {streak >= 30 && <p className="text-yellow-500 font-bold text-xs mt-0.5">🏆 Huyền thoại!</p>}
                {streak >= 7 && streak < 30 && <p className="text-orange-500 font-bold text-xs mt-0.5">⚡ Quá xuất sắc!</p>}
              </div>

              {/* Milestone progress */}
              {(() => {
                const MILESTONES = [3, 7, 14, 30, 60, 100];
                const next = MILESTONES.find(m => m > streak) ?? 100;
                const prev = [...MILESTONES].reverse().find(m => m <= streak) ?? 0;
                const pct = next === prev ? 100 : Math.round(((streak - prev) / (next - prev)) * 100);
                return (
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                      <span>Mục tiêu tiếp theo</span>
                      <span className="text-orange-500 font-black">{next} ngày 🏆</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 tabular-nums">
                      {streak}/{next} — còn {next - streak} ngày nữa
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* 7-day calendar */}
            <div className="grid grid-cols-7 gap-1.5">
              {[...last7Days].reverse().map((day, i) => {
                const isToday = i === 6;
                // Format date label: get weekday
                const d = new Date(day.date + 'T00:00:00+07:00');
                const dayLabel = isToday ? 'HN' : ['CN','T2','T3','T4','T5','T6','T7'][d.getDay()];
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-full aspect-square rounded-2xl flex items-center justify-center text-lg md:text-xl transition-all duration-300
                        ${isToday ? 'ring-2 ring-cyan-400 ring-offset-2' : ''}
                        ${day.active
                          ? 'bg-gradient-to-b from-orange-400 to-rose-500 shadow-md shadow-orange-200'
                          : 'bg-slate-100'}`}
                    >
                      {day.active ? '🔥' : '🥚'}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-bold truncate
                      ${isToday ? 'text-cyan-500' : 'text-slate-400'}`}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div
            className="rounded-[24px] p-6"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
            }}
          >
            <p className="text-[#082F49] font-black text-base mb-5 flex items-center gap-2">⚡ Truy cập nhanh</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: '/map', icon: '🗺️', label: 'Bản đồ thế giới', color: 'from-cyan-50 to-blue-50 border-cyan-100 hover:border-cyan-300' },
                { href: '/arena/map-guessing', icon: '🎯', label: 'Đoán vị trí', color: 'from-rose-50 to-orange-50 border-rose-100 hover:border-rose-300' },
                { href: '/lessons', icon: '📚', label: 'Bài học hôm nay', color: 'from-emerald-50 to-green-50 border-emerald-100 hover:border-emerald-300' },
                { href: '/books', icon: '📖', label: 'Thư viện sách', color: 'from-purple-50 to-indigo-50 border-purple-100 hover:border-purple-300' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-[16px] p-4 flex items-center gap-3 bg-gradient-to-br ${item.color} border transition-all duration-300 hover:-translate-y-0.5 group`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{item.icon}</span>
                  <span className="text-[#082F49] font-bold text-sm leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>

        </> /* end overview tab */
        }

      </div>
    </section>
  );
}
