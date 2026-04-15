'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface AskResult {
  allowed: boolean;
  answer?: string;
  funFact?: string;
  relatedTopics?: string[];
  reason?: string;
}

interface QAItem {
  id: string | number;
  question: string;
  result: AskResult;
  askedAt?: string;
}

export function GeoQuestions() {
  const [qaInput, setQaInput]     = useState('');
  const [qaSession, setQaSession] = useState<QAItem[]>([]);
  const [qaLoading, setQaLoading] = useState(false);

  const [history, setHistory]               = useState<QAItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedId, setExpandedId]         = useState<string | number | null>(null);

  const qaInputRef  = useRef<HTMLTextAreaElement>(null);
  const qaBottomRef = useRef<HTMLDivElement>(null);

  // Tải lịch sử của user từ DB
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/geo-questions/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data.items as any[]).map((item) => ({
            id: item._id,
            question: item.question,
            askedAt: item.askedAt,
            result: {
              allowed: true,
              answer: item.answer,
              funFact: item.funFact,
              relatedTopics: item.relatedTopics,
            },
          }))
        );
      }
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleAsk = useCallback(async () => {
    const q = qaInput.trim();
    if (!q || qaLoading) return;

    setQaLoading(true);
    setQaInput('');
    // Reset textarea height
    if (qaInputRef.current) qaInputRef.current.style.height = 'auto';

    const tempId = Date.now();
    try {
      const res = await fetch('/api/geo-questions/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data: AskResult = await res.json();
      const newItem: QAItem = { id: tempId, question: q, result: data };
      setQaSession(prev => [...prev, newItem]);

      // Nếu AI trả lời thành công → thêm lên đầu lịch sử luôn (không cần reload)
      if (data.allowed) {
        setHistory(prev => [{
          id: tempId,
          question: q,
          result: data,
          askedAt: new Date().toISOString(),
        }, ...prev]);
      }
    } catch {
      setQaSession(prev => [...prev, {
        id: tempId,
        question: q,
        result: { allowed: false, reason: 'Có lỗi xảy ra, vui lòng thử lại.' },
      }]);
    } finally {
      setQaLoading(false);
      setTimeout(() => {
        qaBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        qaInputRef.current?.focus();
      }, 100);
    }
  }, [qaInput, qaLoading]);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <section className="w-[90%] max-w-[1400px] mx-auto py-20 relative z-10">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-[20%] w-[30rem] h-[30rem] bg-gradient-to-tr from-cyan-200/50 to-blue-200/50 rounded-full blur-[100px] opacity-60 z-[-1] pointer-events-none" />
      <div className="absolute bottom-10 left-[10%] w-[35rem] h-[35rem] bg-gradient-to-bl from-rose-200/40 to-orange-100/40 rounded-full blur-[120px] opacity-60 z-[-1] pointer-events-none" />

      {/* Header */}
      <div className="mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-xl px-6 py-2.5 rounded-full border-[2px] border-white/80 shadow-[0_8px_30px_rgba(14,165,233,0.15)] mb-5 transform hover:scale-105 transition-all cursor-default">
          <span className="text-xl animate-bounce" style={{ animationDuration: '3s'}}>🧭</span>
          <span className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-500 uppercase tracking-[0.2em] ml-1">AI Trợ Lý Thông Minh</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-[#082F49] tracking-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          10 Vạn Câu Hỏi Vì Sao
        </h2>
        <p className="text-[#334155] mt-5 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
          Đừng giấu nhẹm sự tò mò của mình! AI siêu cấp Địa lý luôn sẵn sàng làm bạn ngạc nhiên bằng những câu trả lời cực chất. Nhập câu hỏi ngay!
        </p>
      </div>

      {/* Flex Split Container */}
      <div className="flex flex-col xl:flex-row gap-10 items-stretch">

      {/* ── AI Chat Panel (Left) ── */}
      <div className="flex-1 w-full bg-gradient-to-br from-white/95 to-white/70 backdrop-blur-[40px] border-[3px] border-white/80 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(14,165,233,0.25)] overflow-hidden flex flex-col min-h-[600px] h-[75vh] max-h-[850px] relative z-10 group">
          {/* Panel header */}
          <div className="flex items-center gap-4 px-8 py-5 border-b-[2px] border-white/60 bg-white/40">
            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_10px_20px_-5px_rgba(6,182,212,0.5)]">
              <span className="text-white text-2xl drop-shadow-md">🌍</span>
            </div>
            <div>
              <p className="text-[#082F49] font-black text-base leading-none tracking-tight">GeoAssistant Siêu Cấp</p>
              <p className="text-[#94A3B8] font-bold uppercase tracking-widest text-[10px] mt-1.5">Bậc thầy địa lý học</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-full border-[2px] border-white shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse" />
              <span className="text-[11px] text-[#334155] font-black uppercase tracking-widest">Sẵn sàng</span>
            </div>
          </div>

          {/* Chat area (session hiện tại) */}
          <div className="flex-1 flex flex-col gap-6 px-8 py-8 overflow-y-auto">
            {qaSession.length === 0 && !qaLoading && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <span className="text-5xl">🌍</span>
                <p className="text-[#334155] font-semibold text-sm">Bạn muốn biết gì về địa lý?</p>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {['Tại sao biển mặn?', 'Núi Everest cao bao nhiêu?', 'Sông Amazon ở đâu?'].map(ex => (
                    <button
                      key={ex}
                      onClick={() => setQaInput(ex)}
                      className="text-xs px-3 py-1.5 rounded-full bg-cyan-50 text-[#0284C7] border border-cyan-100 font-medium hover:bg-cyan-100 transition-all duration-300"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {qaSession.map(item => (
              <div key={item.id} className="flex flex-col gap-3">
                {/* User bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-gradient-to-br from-cyan-500 to-blue-500 text-white px-4 py-3 rounded-[18px] rounded-tr-[6px] text-sm font-medium shadow-sm">
                    {item.question}
                  </div>
                </div>

                {/* AI bubble */}
                <div className="flex justify-start gap-2.5">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-sm mt-1">
                    <span className="text-white text-xs">🤖</span>
                  </div>
                  {item.result.allowed ? (
                    <div className="max-w-[85%] bg-white/80 border border-white rounded-[18px] rounded-tl-[6px] px-4 py-3 shadow-sm flex flex-col gap-2">
                      <p className="text-[#334155] text-sm leading-relaxed">{item.result.answer}</p>
                      {item.result.funFact && (
                        <div className="pt-2 border-t border-slate-100 flex gap-2">
                          <span className="text-[#06B6D4] text-xs font-black uppercase tracking-wider shrink-0">💡 Thú vị:</span>
                          <p className="text-[#082F49] text-xs font-semibold">{item.result.funFact}</p>
                        </div>
                      )}
                      {item.result.relatedTopics && item.result.relatedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {item.result.relatedTopics.map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-[#0284C7] border border-cyan-100 font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[85%] bg-[rgba(254,240,138,0.5)] border border-yellow-200 rounded-[18px] rounded-tl-[6px] px-4 py-3 shadow-sm">
                      <p className="text-[11px] font-black text-[#D97706] uppercase tracking-wider mb-1">⚠️ Ngoài phạm vi</p>
                      <p className="text-[#334155] text-sm">{item.result.reason}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {qaLoading && (
              <div className="flex justify-start gap-2.5">
                <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs">🤖</span>
                </div>
                <div className="bg-white/80 border border-white rounded-[18px] rounded-tl-[6px] px-5 py-4 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={qaBottomRef} />
          </div>

          {/* Input area */}
          <div className="px-6 py-6 border-t-[2px] border-white/80 bg-white/40">
            <div className="flex gap-4 items-end bg-white/70 backdrop-blur-xl border-[2px] border-white shadow-[0_10px_30px_rgba(14,165,233,0.1)] rounded-[32px] p-3 transition-all focus-within:bg-white focus-within:shadow-[0_15px_40px_rgba(14,165,233,0.2)]">
              <textarea
                ref={qaInputRef}
                value={qaInput}
                onChange={e => setQaInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
                placeholder="Nhập câu hỏi khám phá vào đây..."
                rows={1}
                className="flex-1 resize-none bg-transparent px-4 py-2 mt-1 text-[15px] font-medium text-[#334155] placeholder-[#94A3B8] focus:outline-none leading-relaxed"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleAsk}
                disabled={!qaInput.trim() || qaLoading}
                className="h-[46px] px-6 rounded-[22px] bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-black uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(6,182,212,0.5)] hover:scale-105 hover:shadow-[0_15px_30px_-5px_rgba(6,182,212,0.6)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shrink-0"
              >
                {qaLoading ? '...' : 'Gửi 🚀'}
              </button>
            </div>
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest mt-4 text-center">
              AI chỉ trả lời câu hỏi <strong>Địa lý</strong> · Dùng Shift+Enter để xuống dòng
            </p>
          </div>
      </div>

      {/* ── Lịch sử câu hỏi (Right Side) ── */}
      <div className="w-full xl:w-[450px] shrink-0 flex flex-col gap-5">
        <div className="flex items-center gap-4 mb-2 px-2">
           <div className="w-12 h-12 rounded-[18px] bg-white/70 backdrop-blur-xl border-[2px] border-white flex items-center justify-center text-2xl shadow-[0_5px_15px_rgba(0,0,0,0.08)]">
             📚
           </div>
           <div>
             <h3 className="text-xl font-black text-[#082F49] tracking-tight">Hành trang của bạn</h3>
             <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-[0.15em] mt-1">Lịch sử khám phá</p>
           </div>
           {!historyLoading && history.length > 0 && (
             <span className="ml-auto px-4 py-1.5 rounded-[12px] bg-white/60 border-[2px] border-white text-[#082F49] text-xs font-black shadow-sm">
               {history.length} mục
             </span>
           )}
        </div>

        {historyLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-[24px] bg-white/50 animate-pulse border-[2px] border-white/40" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-gradient-to-b from-white/60 to-white/30 backdrop-blur-xl border-[3px] border-white/80 rounded-[36px] px-8 py-10 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-100 to-blue-50 rounded-full flex items-center justify-center mb-4 border-[3px] border-white shadow-inner">
               <span className="text-4xl">🗺️</span>
            </div>
            <p className="text-[#082F49] font-black text-lg">Chưa có dấu chân nào</p>
            <p className="text-[#94A3B8] text-xs mt-2 font-medium leading-relaxed">Hãy hỏi AI Trợ Lý Siêu Cấp ở bên kia để bắt đầu hành trình khám phá thế giới ngay nhé!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.slice(0, 5).map((item, idx) => {
              const isOpen = expandedId === item.id;
              return (
                <div key={item.id} className={`bg-gradient-to-b from-white/95 to-white/70 backdrop-blur-[20px] rounded-[28px] border-[3px] transition-all duration-300 overflow-hidden ${isOpen ? 'border-[#0ea5e9]/50 shadow-[0_10px_30px_rgba(14,165,233,0.15)]' : 'border-white/80 shadow-[0_5px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:bg-white'}`}>
                  {/* Row — luôn hiển thị */}
                  <button
                    onClick={() => setExpandedId(isOpen ? null : item.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left focus:outline-none group"
                  >
                    <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white text-xs font-black shadow-inner transition-colors duration-300 ${isOpen ? 'bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6]' : 'bg-gradient-to-br from-slate-300 to-slate-400 group-hover:from-cyan-400 group-hover:to-blue-400'}`}>
                      {idx + 1}
                    </span>
                    <p className={`flex-1 text-sm font-bold truncate transition-colors ${isOpen ? 'text-[#082F49]' : 'text-[#334155]'}`}>{item.question}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.askedAt && (
                        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest hidden sm:block bg-white/70 px-2 py-1 rounded-[8px]">{formatDate(item.askedAt)}</span>
                      )}
                      <div className={`w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[#94A3B8] text-xs font-bold transition-transform duration-300 ${isOpen ? 'rotate-180 bg-cyan-100 text-cyan-600' : ''}`}>▼</div>
                    </div>
                  </button>

                  {/* Chi tiết — chỉ hiển thị khi mở */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="mx-4 mb-4 p-5 rounded-[20px] bg-gradient-to-br from-blue-50/80 to-cyan-50/50 border-[2px] border-white shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl drop-shadow-sm">🤖</span>
                        <span className="text-[10px] font-black text-[#0284C7] uppercase tracking-widest border border-cyan-200/50 bg-white/60 px-3 py-1 rounded-full">Trả lời của AI</span>
                      </div>
                      <p className="text-[#082F49] text-sm leading-relaxed font-medium">{item.result.answer}</p>
                      {item.result.funFact && (
                        <div className="mt-4 pt-4 border-t border-blue-200/50 flex gap-3">
                          <span className="text-xl">💡</span>
                          <div>
                            <span className="block text-[#06B6D4] text-[10px] font-black uppercase tracking-widest mb-1 mt-0.5">Sự thật thú vị</span>
                            <p className="text-[#082F49] text-xs font-bold leading-relaxed">{item.result.funFact}</p>
                          </div>
                        </div>
                      )}
                      {item.result.relatedTopics && item.result.relatedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {item.result.relatedTopics.map(t => (
                            <span key={t} className="text-[10px] px-3 py-1.5 rounded-[10px] bg-white text-[#0284C7] border-[2px] border-white shadow-sm font-black uppercase tracking-wider hover:scale-105 transition-transform cursor-default">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {history.length > 5 && (
              <div className="px-4 py-4 text-center mt-2 bg-white/40 backdrop-blur-md rounded-[20px] border-[2px] border-white/60">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-widest">
                  Đang xem 5 mục gần nhất · Tổng cộng <strong className="text-[#082F49] text-sm">{history.length}</strong>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      </div> {/* End Flex Split Container */}
    </section>
  );
}
