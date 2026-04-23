'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_META: Record<number, { label: string; grad: string; shadow: string; icon: string }> = {
  6: { label: 'Lớp 6', grad: 'from-cyan-400 to-blue-500',     shadow: 'shadow-cyan-200',   icon: '🌍' },
  7: { label: 'Lớp 7', grad: 'from-emerald-400 to-teal-500',  shadow: 'shadow-emerald-200', icon: '🗺️' },
  8: { label: 'Lớp 8', grad: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-200',  icon: '🌐' },
  9: { label: 'Lớp 9', grad: 'from-orange-400 to-rose-500',   shadow: 'shadow-orange-200',  icon: '🏔️' },
};

const QUIZ_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  'kt15p':   { label: 'Kiểm tra 15p',    color: 'bg-[rgba(186,230,253,0.8)] text-[#0284C7] border-blue-200' },
  'kt1tiet': { label: 'Kiểm tra 1 tiết', color: 'bg-[rgba(233,213,255,0.8)] text-violet-700 border-violet-200' },
  'giuaky':  { label: 'Đề thi giữa kỳ', color: 'bg-[rgba(254,240,138,0.8)] text-[#D97706] border-amber-300' },
  'cuoiky':  { label: 'Đề thi cuối kỳ', color: 'bg-[rgba(254,215,170,0.8)] text-orange-600 border-orange-300' },
};

function getTypeLabel(t: string) { return QUIZ_TYPE_CONFIG[t]?.label ?? t; }
function getTypeColor(t: string) { return QUIZ_TYPE_CONFIG[t]?.color ?? 'bg-slate-100 text-slate-500 border-slate-200'; }

function uniqueTypes(sets: QuizSet[]) {
  const seen = new Set<string>();
  const result: string[] = ['all'];
  sets.forEach(s => {
    if (s.quizType && !seen.has(s.quizType)) { seen.add(s.quizType); result.push(s.quizType); }
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QuizSet {
  _id: string; grade: number; quizId: string; title: string;
  icon: string; quizType: string; timeLimit: number; order: number;
}

interface QuizQuestion {
  _id: string; questionType: 'mc' | 'tf' | 'essay';
  content: string; mediaUrl?: string; mediaType?: 'image' | 'video' | 'audio';
  options: string[]; correctOption?: number;
  tfAnswers?: boolean[]; essayAnswer?: string; explanation?: string; order: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN 1 — List
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function ListScreen({
  selectedGrade, setSelectedGrade, sets, setsLoading, typeFilter, setTypeFilter, onStart,
}: {
  selectedGrade: number; setSelectedGrade: (g: number) => void;
  sets: QuizSet[]; setsLoading: boolean;
  typeFilter: string; setTypeFilter: (t: string) => void;
  onStart: (set: QuizSet) => void;
}) {
  const meta = GRADE_META[selectedGrade] ?? GRADE_META[6];
  const types = uniqueTypes(sets);
  const filtered = typeFilter === 'all' ? sets : sets.filter(s => s.quizType === typeFilter);
  const typeDropRef = useRef<HTMLDivElement>(null);
  const [typeDropOpen, setTypeDropOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Reset to page 1 when filter/grade changes
  useEffect(() => { setPage(1); }, [typeFilter, selectedGrade, sets]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (typeDropRef.current && !typeDropRef.current.contains(e.target as Node)) setTypeDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div
      className="rounded-[24px] overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}
    >
      {/* ── Filter bar ── */}
      <div className="p-5 md:p-6" style={{ position: 'relative', zIndex: 10 }}>
        <div className="mb-4">
          <p className="text-[#082F49] font-black text-lg flex items-center gap-2">📋 Đề Kiểm Tra Địa Lý</p>
          <p className="text-slate-400 text-sm font-medium mt-0.5 hidden sm:block">Chọn lớp và loại đề để lọc danh sách bên dưới</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {([6, 7, 8, 9] as const).map(g => {
            const m = GRADE_META[g];
            return (
              <button key={g} onClick={() => { setSelectedGrade(g); setTypeFilter('all'); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] font-black text-sm transition-all duration-300 border ${
                  selectedGrade === g
                    ? `bg-gradient-to-r ${m.grad} text-white border-transparent shadow-md ${m.shadow}`
                    : 'bg-white/80 text-[#082F49] border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}>
                <span>{m.icon}</span> {m.label}
              </button>
            );
          })}
          {types.length > 1 && (
            <div ref={typeDropRef} className="ml-auto relative shrink-0">
              <button onClick={() => setTypeDropOpen(o => !o)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[14px] border text-xs font-bold transition-all duration-200 min-w-[150px]
                  ${typeDropOpen ? `bg-gradient-to-r ${meta.grad} text-white border-transparent shadow-lg` : 'bg-white/80 text-[#082F49] border-slate-200 hover:border-cyan-300 hover:shadow-md'}`}>
                <span className="flex-1 text-left">{typeFilter === 'all' ? '📂 Tất cả loại đề' : getTypeLabel(typeFilter)}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`shrink-0 transition-transform ${typeDropOpen ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {typeDropOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-[20px] overflow-hidden border border-white/80"
                  style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 60px rgba(8,47,73,0.15)' }}>
                  <div className={`px-4 py-3 bg-gradient-to-r ${meta.grad}`}>
                    <p className="text-white font-black text-xs uppercase tracking-wider">Lọc theo loại đề</p>
                  </div>
                  <div className="py-2">
                    {types.map(t => (
                      <button key={t} onClick={() => { setTypeFilter(t); setTypeDropOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-bold transition-all hover:bg-cyan-50 ${typeFilter === t ? 'bg-cyan-50/60 text-cyan-700' : 'text-[#082F49]'}`}>
                        {t === 'all' ? '📂 Tất cả loại đề' : (
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${getTypeColor(t)}`}>{getTypeLabel(t)}</span>
                        )}
                        {typeFilter === t && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-slate-100" />

      {/* ── Set list ── */}
      {setsLoading ? (
        <div className="p-12 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-300 border-t-cyan-500 animate-spin" />
          <p className="text-slate-400 font-semibold text-sm">Đang tải danh sách đề...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 flex flex-col items-center gap-4 text-center">
          <span className="text-5xl">📭</span>
          <p className="text-[#082F49] font-black text-base">Chưa có đề thi nào</p>
          <p className="text-slate-400 text-sm">Hãy thử chọn lớp hoặc loại đề khác.</p>
        </div>
      ) : (
        <>
          {/* Count row */}
          <div className="px-5 md:px-6 py-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-[#94A3B8]">
              {filtered.length} đề · Trang {page}/{totalPages}
            </p>
          </div>

          {/* Row list */}
          <div className="divide-y divide-slate-100">
            {paginated.map((s, idx) => {
              const m = GRADE_META[s.grade] ?? GRADE_META[6];
              const rowNum = (page - 1) * PAGE_SIZE + idx + 1;
              return (
                <div key={s._id}
                  className="flex items-center gap-4 px-5 md:px-6 py-4 hover:bg-white/60 transition-colors duration-150 group">
                  {/* Number */}
                  <span className="shrink-0 w-7 h-7 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-black text-xs">
                    {rowNum}
                  </span>
                  {/* Icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-[12px] bg-gradient-to-br ${m.grad} flex items-center justify-center text-lg shadow-sm`}>
                    {s.icon}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[#082F49] text-sm leading-snug truncate">{s.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${getTypeColor(s.quizType)}`}>
                        {getTypeLabel(s.quizType)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#94A3B8]">Lớp {s.grade}</span>
                      <span className="text-[11px] font-semibold text-[#94A3B8]">⏱ {s.timeLimit} phút</span>
                    </div>
                  </div>
                  {/* Start button */}
                  <button onClick={() => onStart(s)}
                    className={`shrink-0 px-5 py-2 rounded-[12px] font-black text-xs text-white bg-gradient-to-r ${m.grad}
                      shadow-sm hover:shadow-md hover:scale-[1.04] active:scale-[0.97] transition-all duration-200
                      opacity-80 group-hover:opacity-100`}>
                    🚀 Bắt đầu
                  </button>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="px-5 md:px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-2">
              {/* Prev */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 bg-white/80 text-[#334155] font-black text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:border-cyan-300 hover:bg-cyan-50 transition-all">
                ‹
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                const isActive = n === page;
                const show = n === 1 || n === totalPages || Math.abs(n - page) <= 1;
                const showDot = (n === 2 && page > 3) || (n === totalPages - 1 && page < totalPages - 2);
                if (!show && !showDot) return null;
                if (showDot) return (
                  <span key={n} className="w-8 h-8 flex items-center justify-center text-slate-300 font-black text-xs">…</span>
                );
                return (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all
                      ${isActive
                        ? `bg-gradient-to-r ${meta.grad} text-white shadow-md border-transparent`
                        : 'border border-slate-200 bg-white/80 text-[#334155] hover:border-cyan-300 hover:bg-cyan-50'}`}>
                    {n}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 bg-white/80 text-[#334155] font-black text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:border-cyan-300 hover:bg-cyan-50 transition-all">
                ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — QuizStudyPanel
// ─────────────────────────────────────────────────────────────────────────────

export function QuizStudyPanel() {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState(6);
  const [sets, setSets] = useState<QuizSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchSets = useCallback(async (grade: number) => {
    setSetsLoading(true);
    try {
      const res = await fetch(`/api/quizzes?grade=${grade}`);
      const data = await res.json();
      setSets(data.sets ?? []);
    } finally {
      setSetsLoading(false);
    }
  }, []);

  useEffect(() => { fetchSets(selectedGrade); }, [selectedGrade, fetchSets]);

  const handleStart = useCallback((set: QuizSet) => {
    router.push(`/quiz/${set._id}`);
  }, [router]);

  return (
    <ListScreen
      selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade}
      sets={sets} setsLoading={setsLoading}
      typeFilter={typeFilter} setTypeFilter={setTypeFilter}
      onStart={handleStart}
    />
  );
}
