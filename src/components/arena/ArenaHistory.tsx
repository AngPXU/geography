'use client';
import React, { useState, useEffect } from 'react';

const TOPIC_LABEL: Record<string, string> = {
  all: '🎲 Ngẫu Nhiên',
  country: '🌍 Quốc Gia',
  mountain: '⛰️ Đỉnh Núi',
  river: '🌊 Sông Ngòi',
  country_pop: '👥 Dân Số',
  country_gdp: '🏦 GDP',
  country_life: '❤️ Tuổi Thọ',
};

const MODE_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  'map-guessing':     { label: 'Đơn',   icon: '🎮', color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  'map-guessing-duo': { label: 'Online', icon: '⚔️', color: 'text-rose-600 bg-rose-50 border-rose-200' },
};

function ResultBadge({ score, expEarned, gameMode }: { score: number; expEarned: number; gameMode: string }) {
  const isDuo = gameMode === 'map-guessing-duo';
  if (isDuo) {
    if (expEarned > 0) return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-yellow-50 text-yellow-600 border border-yellow-200">
        👑 Thắng
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-500 border border-slate-200">
        💀 Thua
      </span>
    );
  }
  // Solo mode: score based
  const pct = (score / 10000) * 100;
  if (pct >= 80) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200">🌟 Xuất sắc</span>;
  if (pct >= 50) return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-cyan-50 text-cyan-600 border border-cyan-200">✅ Đạt</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-600 border border-amber-200">📈 Cố gắng</span>;
}

export default function ArenaHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/arena/map-guessing/history')
      .then(r => r.json())
      .then(d => { if (d.history) setHistory(d.history); })
      .finally(() => setLoading(false));
  }, []);

  const displayed = showAll ? history : history.slice(0, 6);

  if (loading) return (
    <div className="mt-16 flex justify-center">
      <div className="w-8 h-8 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="mt-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-[#082F49]">
            📊 Lịch Sử Thi Đấu
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-0.5">20 trận gần nhất của bạn</p>
        </div>
        {history.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 rounded-[14px] bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-cyan-300 transition-all shadow-sm"
          >
            {showAll ? 'Thu gọn ▲' : `Xem thêm (${history.length - 6}) ▼`}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-[24px] border border-white shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🗺️</div>
          <p className="font-bold text-slate-400">Chưa có lịch sử thi đấu nào</p>
          <p className="text-sm text-slate-300 mt-1">Hãy tham gia một trận đấu để bắt đầu!</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-white shadow-[0_8px_30px_rgba(8,47,73,0.06)] overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-0 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chủ đề</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Chế độ</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Điểm</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Kết quả</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">EXP</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Thời gian</p>
            </div>

            {/* Rows */}
            {displayed.map((m: any, i: number) => {
              const mode = MODE_LABEL[m.gameMode] ?? MODE_LABEL['map-guessing'];
              const topicLabel = TOPIC_LABEL[m.topic] ?? m.topic;
              const playedAt = m.playedAt ? new Date(m.playedAt) : new Date();
              const timeStr = playedAt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' +
                              playedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={m._id ?? i}
                  className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-0 px-6 py-4 items-center transition-colors hover:bg-cyan-50/30 ${i < displayed.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  {/* Topic */}
                  <div className="font-bold text-sm text-[#082F49] truncate">{topicLabel}</div>

                  {/* Mode */}
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black border ${mode.color}`}>
                      {mode.icon} {mode.label}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="font-black text-[#082F49] tabular-nums text-sm">
                    {m.score?.toLocaleString('vi-VN')}
                  </div>

                  {/* Result */}
                  <div>
                    <ResultBadge score={m.score} expEarned={m.expEarned} gameMode={m.gameMode} />
                  </div>

                  {/* EXP */}
                  <div>
                    {m.expEarned > 0 ? (
                      <span className="font-black text-emerald-600 text-sm">+{m.expEarned} EXP</span>
                    ) : (
                      <span className="text-slate-300 font-bold text-sm">—</span>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-xs font-bold text-slate-400 tabular-nums">{timeStr}</div>
                </div>
              );
            })}
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[
              { label: 'Tổng trận', value: history.length, icon: '🎯', color: 'from-cyan-50 to-blue-50 border-cyan-100' },
              { label: 'Tổng EXP', value: `+${history.reduce((s, m) => s + (m.expEarned || 0), 0)}`, icon: '⚡', color: 'from-amber-50 to-yellow-50 border-amber-100' },
              { label: 'Điểm cao nhất', value: Math.max(...history.map((m: any) => m.score || 0)).toLocaleString('vi-VN'), icon: '🏆', color: 'from-emerald-50 to-teal-50 border-emerald-100' },
            ].map(stat => (
              <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-[20px] border p-4 text-center`}>
                <p className="text-2xl mb-1">{stat.icon}</p>
                <p className="font-black text-[#082F49] text-xl tabular-nums">{stat.value}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
