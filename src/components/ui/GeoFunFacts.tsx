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

export function GeoFunFacts() {
  const [facts, setFacts] = useState<FunFact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFacts = useCallback(async () => {
    setLoading(true);
    // Chỉ lấy 1 Fun Fact mới nhất
    const res = await fetch(`/api/geo-funfacts?page=1&limit=1`);
    if (res.ok) {
      const data = await res.json();
      
      // Khởi tạo nếu trống
      if (data.total === 0) {
        await fetch('/api/geo-funfacts/generate', { method: 'POST', body: JSON.stringify({}) });
        const res2 = await fetch(`/api/geo-funfacts?page=1&limit=1`);
        if (res2.ok) {
           const data2 = await res2.json();
           setFacts(data2.items);
        }
      } else {
        setFacts(data.items);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFacts(); }, [fetchFacts]);

  const latestFact = facts[0];

  return (
    <section className="w-full py-20 px-4 md:px-8 relative overflow-hidden">
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .float-cute { animation: float 4s ease-in-out infinite; }
        .float-cute:nth-child(even) { animation-duration: 5s; animation-direction: reverse; }
        
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

      <div className="max-w-5xl mx-auto">
        
        {/* Tiêu đề góc */}
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-white shadow-sm mb-4 transform hover:scale-105 transition-transform cursor-default">
            <span className="text-2xl animate-bounce">🤯</span>
            <span className="text-base font-black text-rose-500 uppercase tracking-wider">Góc Bất Ngờ</span>
            <span className="text-2xl animate-bounce" style={{animationDelay: '0.2s'}}>✨</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#082F49]">
            Bạn Có Biết Không?
          </h2>
        </div>

        {/* Big Card Area */}
        <div className="relative w-full max-w-4xl mx-auto z-10">
          
          {loading ? (
            <div className="w-full h-80 rounded-[32px] bg-white/50 backdrop-blur-xl border border-white shadow-[0_20px_60px_rgba(255,192,203,0.2)] flex flex-col items-center justify-center animate-pulse">
              <span className="text-6xl mb-4 animate-bounce">🌍</span>
              <p className="text-xl font-bold text-slate-400">AI đang lục tìm cẩm nang Địa Lý...</p>
            </div>
          ) : !latestFact ? (
            <div className="w-full h-80 rounded-[32px] bg-white/60 backdrop-blur-xl border border-white shadow-xl flex flex-col items-center justify-center">
               <span className="text-6xl mb-4">🔍</span>
               <p className="text-xl font-bold text-slate-500">Chưa có thông tin thú vị nào được tạo.</p>
            </div>
          ) : (
            <div className="big-card relative w-full bg-white/85 backdrop-blur-[24px] border border-white rounded-[32px] p-8 md:p-12 shadow-[0_20px_50px_rgba(251,113,133,0.15)] overflow-hidden group">
              
              {/* Cute corner decorations inside card */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-rose-200 to-pink-100 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-amber-200 to-yellow-100 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />

              {/* Top Meta info */}
              <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[14px] bg-rose-50 border border-rose-100 text-rose-600 font-bold text-sm">
                  <span>{latestFact.emoji}</span>
                  {latestFact.topic}
                </span>
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[14px] bg-amber-50 border border-amber-100 text-amber-600 font-bold text-sm">
                  <span>📍</span>
                  {latestFact.region}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-400 border border-slate-200 rounded-full px-3 py-1 bg-white">
                    Tạo bởi AI · {latestFact.session === '00:00' ? '✨ Nửa đêm' : '☀️ Ban ngày'}
                  </span>
                </div>
              </div>

              {/* Content Core */}
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                
                {/* Left massive Emoji icon */}
                <div className="shrink-0 float-cute hidden md:flex items-center justify-center w-32 h-32 rounded-[24px] bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-white shadow-xl text-[80px]">
                  {latestFact.emoji}
                </div>

                <div className="flex-1">
                  {/* Headline */}
                  <h3 className="text-3xl md:text-4xl font-black text-[#082F49] leading-tight mb-6"
                      style={{ textShadow: '0 2px 4px rgba(251,113,133,0.1)' }}>
                    {latestFact.headline}
                  </h3>

                  {/* Detaled info - Luôn hiển thị */}
                  <div className="bg-slate-50/80 border border-slate-100 rounded-[20px] p-6 mb-5">
                    <p className="text-lg text-[#334155] leading-relaxed font-medium">
                      {latestFact.detail}
                    </p>
                  </div>

                  {/* Why it matters */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-[20px] p-6 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400" />
                    <p className="text-xs font-black text-cyan-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span>💡</span> Ý nghĩa thực tế
                    </p>
                    <p className="text-[#082F49] text-base leading-relaxed font-bold">
                      {latestFact.whyItMatters}
                    </p>
                  </div>

                  {/* Tags */}
                  {latestFact.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {latestFact.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 shadow-sm hover:border-slate-300 transition-colors cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Floating cute emojis around the big card */}
          {!loading && latestFact && FLOAT_EMOJIS.map((emoji, i) => (
             <div 
               key={i} 
               className="float-cute absolute hidden md:flex items-center justify-center select-none pointer-events-none"
               style={{
                 fontSize: `${Math.random() * 20 + 20}px`,
                 top: `${Math.random() * 100}%`,
                 left: i % 2 === 0 ? `-${Math.random() * 10 + 5}%` : `${100 + Math.random() * 10}%`,
                 animationDelay: `${Math.random() * 5}s`,
                 opacity: 0.7
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
