'use client';

import { useEffect, useState, useCallback } from 'react';

interface FunFact {
  _id: string;
  headline: string;
  detail: string;
  whyItMatters: string;
  topic: string;
  region: string;
  emoji: string;
  tags: string[];
  generatedAt: string;
  session: '00:00' | '12:00';
}

const FLOAT_EMOJIS = ['✨', '🌍', '🤔', '💡', '🚀', '🌟', '🤯', '📚', '🗺️', '🔍'];

function useCountdown(nextUpdateAt: string | null) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!nextUpdateAt) return;
    const tick = () => {
      const diff = Math.max(0, new Date(nextUpdateAt).getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [nextUpdateAt]);

  return timeLeft;
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function GeoFunFacts() {
  const [fact, setFact]               = useState<FunFact | null>(null);
  const [loading, setLoading]         = useState(true);
  const [nextUpdateAt, setNextUpdate] = useState<string | null>(null);
  const [justGenerated, setJustGenerated] = useState(false);

  const timeLeft = useCountdown(nextUpdateAt);

  const fetchFact = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/geo-funfacts/auto');
      if (res.ok) {
        const data = await res.json();
        setFact(data.fact ?? null);
        setNextUpdate(data.nextUpdateAt ?? null);
        setJustGenerated(data.generated ?? false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFact(); }, [fetchFact]);

  return (
    <section className="w-full py-20 px-4 md:px-8 relative overflow-hidden">
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .float-cute { animation: float 10s ease-in-out infinite; }
        .float-cute:nth-child(even) { animation-duration: 12s; animation-direction: reverse; }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .big-card { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>

      {/* Decorative background blobs */}
      <div className="absolute top-0 left-[20%] w-96 h-96 rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #fcd34d, transparent)' }} />
      <div className="absolute bottom-0 right-[20%] w-96 h-96 rounded-full opacity-20 blur-[100px] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />

      <div className="w-[90%] max-w-[1400px] mx-auto">

        {/* Tiêu đề */}
        <div className="text-center mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-xl px-6 py-2.5 rounded-full border-[2px] border-white/80 shadow-[0_8px_30px_rgba(251,113,133,0.15)] mb-5 transform hover:scale-105 hover:-translate-y-1 transition-all duration-300 cursor-default">
            <span className="text-2xl animate-bounce" style={{ animationDuration: '2s' }}>✨</span>
            <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 uppercase tracking-[0.2em] ml-1">Góc Bất Ngờ</span>
            <span className="text-2xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2s' }}>🤩</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-[#082F49] tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.05)'}}>
            Bạn Có Biết Không?
          </h2>

          {/* Countdown */}
          {nextUpdateAt && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-[12px] font-extrabold text-[#94A3B8] uppercase tracking-[0.15em]">
                Bí mật tiếp theo sẽ được bật mí sau
              </p>
              <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-xl border-[2px] border-white/90 rounded-full px-6 py-3 shadow-[0_10px_40px_-10px_rgba(14,165,233,0.2)]">
                <span className="text-2xl font-black text-[#06B6D4] tabular-nums">{pad(timeLeft.h)}</span>
                <span className="text-[#94A3B8] font-bold text-sm tracking-widest uppercase">Giờ</span>
                <span className="text-[#06B6D4] opacity-30 mx-1">:</span>
                <span className="text-2xl font-black text-[#06B6D4] tabular-nums">{pad(timeLeft.m)}</span>
                <span className="text-[#94A3B8] font-bold text-sm tracking-widest uppercase">Phút</span>
                <span className="text-[#06B6D4] opacity-30 mx-1">:</span>
                <span className="text-2xl font-black text-[#06B6D4] tabular-nums">{pad(timeLeft.s)}</span>
                <span className="text-[#94A3B8] font-bold text-sm tracking-widest uppercase">Giây</span>
              </div>
              {justGenerated && (
                <div className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border-[2px] border-emerald-100 rounded-full px-4 py-1.5 shadow-sm transform animate-bounce" style={{ animationIterationCount: 3, animationDuration: '0.8s'}}>
                  <span className="text-lg">🤖</span>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">AI vừa khám phá xong!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Big Card Area */}
        <div className="relative w-full mx-auto z-10">

          {loading ? (
            <div 
              className="w-full h-96 flex flex-col items-center justify-center animate-pulse rounded-[32px]"
              style={{
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
              }}
            >
              <div className="w-24 h-24 bg-gradient-to-tr from-[#06B6D4] to-blue-400 rounded-full flex items-center justify-center shadow-inner mb-6 animate-bounce" style={{ animationDuration: '2s'}}>
                <span className="text-5xl">🌍</span>
              </div>
              <p className="text-lg font-bold text-[#94A3B8] tracking-widest uppercase">Trí tuệ nhân tạo đang làm việc...</p>
            </div>
          ) : !fact ? (
            <div 
              className="w-full h-96 flex flex-col items-center justify-center rounded-[32px]"
              style={{
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
              }}
            >
               <span className="text-6xl mb-6 opacity-80">🔍</span>
               <p className="text-lg font-bold text-[#94A3B8] tracking-widest uppercase">Chưa có thông tin thú vị nào.</p>
            </div>
          ) : (
            <div 
              className="big-card relative w-full flex flex-col p-8 md:p-14 overflow-hidden group hover:-translate-y-1 transition-all duration-700 rounded-[32px]"
              style={{
                background: 'rgba(255, 255, 255, 0.65)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
              }}
            >
              {/* Inner Highlight for Glass Edge */}
              <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>

              {/* iOS 26 style vibrant background glowing orbs */}
              <div className="absolute -top-20 -right-10 w-64 h-64 bg-gradient-to-br from-rose-300/60 to-orange-200/60 rounded-full blur-[60px] group-hover:scale-125 group-hover:bg-rose-400/50 transition-all duration-1000 ease-out" />
              <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-gradient-to-tr from-cyan-300/60 to-blue-300/60 rounded-full blur-[60px] group-hover:scale-125 group-hover:bg-cyan-400/50 transition-all duration-1000 ease-out" />

              {/* Top Meta info */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-10 relative z-10">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border-[2px] border-white/90 text-[#082F49] font-black text-sm shadow-sm hover:scale-105 transition-transform cursor-default">
                    <span className="text-lg">{fact.emoji}</span>
                    <span className="uppercase tracking-widest">{fact.topic}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-md border-[2px] border-white/90 text-[#082F49] font-black text-sm shadow-sm hover:scale-105 transition-transform cursor-default">
                    <span className="text-rose-500 text-lg">📍</span>
                    <span className="uppercase tracking-widest">{fact.region}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-gradient-to-r from-slate-100/80 to-white/80 backdrop-blur-md border-[2px] border-white/90 rounded-full px-4 py-2 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    AI generated · {fact.session === '00:00' ? 'Nửa đêm' : 'Ban ngày'}
                  </span>
                </div>
              </div>

              {/* Content Core */}
              <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-start">

                {/* Left massive Emoji squircle icon */}
                <div className="shrink-0 float-cute hidden lg:flex items-center justify-center w-40 h-40 rounded-[36px] bg-gradient-to-br from-white/90 to-white/50 backdrop-blur-xl border-[3px] border-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] text-[90px] group-hover:rotate-12 transition-transform duration-700 ease-out">
                  <span className="drop-shadow-lg">{fact.emoji}</span>
                </div>

                <div className="flex-1">
                  {/* Headline */}
                  <h3 className="text-3xl md:text-5xl font-black text-[#082F49] leading-tight mb-8 tracking-tight"
                      style={{ textShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    {fact.headline}
                  </h3>

                  {/* Detail */}
                  <div className="bg-white/60 backdrop-blur-md border-[2px] border-white/90 rounded-[28px] p-7 mb-6 shadow-sm hover:bg-white/80 transition-colors duration-300">
                    <p className="text-lg md:text-xl text-[#334155] leading-relaxed font-semibold">
                      {fact.detail}
                    </p>
                  </div>

                  {/* Why it matters */}
                  <div className="bg-gradient-to-br from-cyan-50/90 to-blue-50/90 backdrop-blur-md border-[2px] border-white/90 rounded-[28px] p-7 mb-8 shadow-sm relative overflow-hidden group/matter">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-80" />
                    <p className="text-sm font-black text-cyan-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <span className="text-xl group-hover/matter:animate-bounce">💡</span> Khai Sáng
                    </p>
                    <p className="text-[#082F49] text-lg leading-relaxed font-bold">
                      {fact.whyItMatters}
                    </p>
                  </div>

                  {/* Tags */}
                  {fact.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2.5">
                      {fact.tags.map(tag => (
                        <span key={tag} className="px-4 py-2 bg-white/70 backdrop-blur-md border-[2px] border-white/90 rounded-full text-xs font-black text-slate-500 uppercase tracking-widest shadow-sm hover:scale-105 hover:bg-white hover:text-cyan-600 transition-all cursor-default">
                          #{tag.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Floating cute emojis mostly behind the big card */}
          {!loading && fact && FLOAT_EMOJIS.map((emoji, i) => (
             <div
               key={i}
               className="float-cute absolute hidden md:flex items-center justify-center select-none pointer-events-none"
               style={{
                 fontSize: `${Math.random() * 20 + 20}px`,
                 top: `${Math.random() * 90 + 5}%`,
                 left: `${Math.random() * 90 + 5}%`,
                 animationDelay: `${Math.random() * 5}s`,
                 opacity: 0.6,
                 zIndex: -1
               }}
             >
               {emoji}
             </div>
          ))}

        </div>
      </div>
    </section>
  );
}
