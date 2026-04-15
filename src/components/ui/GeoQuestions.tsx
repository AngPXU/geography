'use client';

import { useEffect, useState, useCallback } from 'react';

interface GeoQuestion {
  _id: string;
  question: string;
  answer: string;
  topic: string;
  region: string;
  funFact: string;
  tags: string[];
  generatedAt: string;
  session: '00:00' | '12:00';
}

// Topic color mapping
const TOPIC_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Núi lửa & Vỏ Trái Đất':   { bg: 'bg-orange-50',  text: 'text-orange-600', border: 'border-orange-200', icon: '🌋' },
  'Đại dương & Dòng chảy':    { bg: 'bg-blue-50',    text: 'text-blue-600',   border: 'border-blue-200',   icon: '🌊' },
  'Khí hậu & Thời tiết':      { bg: 'bg-sky-50',     text: 'text-sky-600',    border: 'border-sky-200',    icon: '🌤️' },
  'Địa hình & Cảnh quan':     { bg: 'bg-green-50',   text: 'text-green-600',  border: 'border-green-200',  icon: '⛰️' },
  'Sông ngòi & Hồ nước':      { bg: 'bg-cyan-50',    text: 'text-cyan-600',   border: 'border-cyan-200',   icon: '🏞️' },
  'Sa mạc & Thảo nguyên':     { bg: 'bg-amber-50',   text: 'text-amber-600',  border: 'border-amber-200',  icon: '🏜️' },
  'Rừng nhiệt đới':            { bg: 'bg-emerald-50', text: 'text-emerald-600',border: 'border-emerald-200',icon: '🌿' },
  'Băng hà & Cực địa':         { bg: 'bg-slate-50',   text: 'text-slate-600',  border: 'border-slate-200',  icon: '🧊' },
  'Đảo & Quần đảo':            { bg: 'bg-teal-50',    text: 'text-teal-600',   border: 'border-teal-200',   icon: '🏝️' },
  'Biên giới & Địa chính':     { bg: 'bg-purple-50',  text: 'text-purple-600', border: 'border-purple-200', icon: '🗺️' },
  'Dân cư & Đô thị hoá':       { bg: 'bg-pink-50',    text: 'text-pink-600',   border: 'border-pink-200',   icon: '🏙️' },
  'Tài nguyên khoáng sản':     { bg: 'bg-yellow-50',  text: 'text-yellow-600', border: 'border-yellow-200', icon: '💎' },
};
const DEFAULT_COLOR = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: '🌍' };

function getTopicStyle(topic: string) {
  return TOPIC_COLORS[topic] ?? DEFAULT_COLOR;
}

export function GeoQuestions() {
  const [questions, setQuestions] = useState<GeoQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterTopic, setFilterTopic] = useState('');

  const LIMIT = 6;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filterTopic) params.set('topic', filterTopic);
    const res = await fetch(`/api/geo-questions?${params}`);
    if (res.ok) {
      const data = await res.json();
      
      // Khởi tạo ngay lập tức nếu chưa có câu hỏi nào
      if (data.total === 0 && page === 1 && !filterTopic) {
        await fetch('/api/geo-questions/generate', { method: 'POST', body: JSON.stringify({}) });
        const res2 = await fetch(`/api/geo-questions?${params}`);
        if (res2.ok) {
           const data2 = await res2.json();
           setQuestions(data2.items);
           setTotal(data2.total);
        }
      } else {
        setQuestions(data.items);
        setTotal(data.total);
      }
    }
    setLoading(false);
  }, [page, filterTopic]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);


  const totalPages = Math.ceil(total / LIMIT);

  return (
    <section className="w-full py-20 px-4 md:px-8 relative">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .q-card { animation: fadeSlideUp 0.4s ease forwards; }
        .answer-panel {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .answer-panel.open { grid-template-rows: 1fr; }
        .answer-inner { overflow: hidden; }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm mb-4">
          <span className="text-sm font-bold text-[#082F49] uppercase tracking-wider">🤖 AI Powered</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[#082F49]">10 Vạn Câu Hỏi Vì Sao</h2>
        <p className="text-[#334155] mt-3 text-lg max-w-2xl mx-auto">
          Gemini AI tự động sinh câu hỏi địa lý mới mỗi ngày lúc <strong>0h00</strong> và <strong>12h00</strong>.<br />
          Khám phá kiến thức địa lý thú vị từ khắp nơi trên thế giới!
        </p>

        {/* Live counter */}
        <div className="mt-5 inline-flex items-center gap-3 bg-white/70 backdrop-blur-md border border-white rounded-[20px] px-5 py-3 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[#082F49] font-bold text-sm">{total.toLocaleString()} câu hỏi đã được sinh</span>
          <span className="text-[#94A3B8] text-sm">· cập nhật 2 lần/ngày</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
          {/* Filter by topic */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setFilterTopic(''); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${!filterTopic ? 'bg-[#06B6D4] text-white shadow-md' : 'bg-white/70 text-[#334155] border border-white hover:bg-white'}`}
            >Tất cả</button>
            {Object.entries(TOPIC_COLORS).slice(0, 6).map(([t, s]) => (
              <button key={t}
                onClick={() => { setFilterTopic(t); setPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filterTopic === t ? `${s.bg} ${s.text} border ${s.border} shadow-sm` : 'bg-white/70 text-[#334155] border border-white hover:bg-white'}`}
              >{s.icon} {t.split(' & ')[0]}</button>
            ))}
          </div>
        </div>


        {/* Question cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-[24px] bg-white/50 animate-pulse" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4 animate-spin-slow">🌍</p>
            <p className="text-[#334155] text-lg font-medium">AI đang vắt óc tạo câu hỏi địa lý đầu tiên...</p>
            <p className="text-[#94A3B8] text-sm mt-1">Xin chờ một chút nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questions.map((q, idx) => {
              const style = getTopicStyle(q.topic);
              const isOpen = expanded === q._id;
              return (
                <div
                  key={q._id}
                  className="q-card bg-white/75 backdrop-blur-[20px] border border-white rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(14,165,233,0.07)] hover:shadow-[0_16px_40px_rgba(14,165,233,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Card header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                        <span>{style.icon}</span>{q.topic.split(' & ')[0]}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-medium">
                        {q.session === '00:00' ? '🌙 Nửa đêm' : '☀️ Buổi trưa'}
                      </span>
                    </div>
                    <h3 className="text-[#082F49] font-bold text-base leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  {/* Region */}
                  <div className="px-5 pb-3">
                    <span className="text-[11px] text-[#94A3B8] font-medium">🌍 {q.region}</span>
                  </div>

                  {/* Expandable answer */}
                  <div className={`answer-panel ${isOpen ? 'open' : ''}`}>
                    <div className="answer-inner">
                      <div className="mx-5 mb-4 p-4 rounded-[16px] bg-gradient-to-br from-blue-50/80 to-cyan-50/60 border border-blue-100/60">
                        <p className="text-[#334155] text-sm leading-relaxed mb-3">{q.answer}</p>
                        <div className="pt-3 border-t border-blue-100">
                          <p className="text-[11px] font-black text-[#06B6D4] uppercase tracking-wider mb-1">💡 Sự thật thú vị</p>
                          <p className="text-[#082F49] text-sm font-semibold">{q.funFact}</p>
                        </div>
                        {q.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {q.tags.map(tag => (
                              <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-[#334155] border border-slate-100"># {tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : q._id)}
                    className={`mt-auto mx-5 mb-5 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2
                      ${isOpen
                        ? 'bg-slate-100 text-[#334155] hover:bg-slate-200'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-[0_6px_16px_rgba(6,182,212,0.3)] hover:-translate-y-0.5'
                      }`
                    }
                  >
                    {isOpen ? (
                      <><span className="rotate-180 inline-block">▼</span> Thu lại</>
                    ) : (
                      <>Xem giải thích <span>▼</span></>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="h-10 px-5 rounded-full bg-white/70 border border-white text-[#082F49] font-bold text-sm hover:bg-white transition-all disabled:opacity-30">
              ← Trước
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${p === page ? 'bg-[#06B6D4] text-white shadow-md' : 'bg-white/70 border border-white text-[#334155] hover:bg-white'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="h-10 px-5 rounded-full bg-white/70 border border-white text-[#082F49] font-bold text-sm hover:bg-white transition-all disabled:opacity-30">
              Sau →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
