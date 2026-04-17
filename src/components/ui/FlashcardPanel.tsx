'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Grade UI metadata (colours stay on client) ─────────────────────────────
const GRADE_META: Record<number, { label: string; grad: string; shadow: string; icon: string }> = {
  6: { label: 'Lớp 6', grad: 'from-cyan-400 to-blue-500',     shadow: 'shadow-cyan-200',   icon: '🌍' },
  7: { label: 'Lớp 7', grad: 'from-emerald-400 to-teal-500',  shadow: 'shadow-emerald-200', icon: '🗺️' },
  8: { label: 'Lớp 8', grad: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-200',  icon: '🌐' },
  9: { label: 'Lớp 9', grad: 'from-orange-400 to-rose-500',   shadow: 'shadow-orange-200',  icon: '🏔️' },
};

// ── Data types from /api/flashcards ─────────────────────────────────────────
interface ApiCard {
  _id?: string;
  front: string;
  back: string;
  hint?: string;
  order: number;
}

interface ApiLesson {
  lessonId: string;
  lessonTitle: string;
  lessonIcon: string;
  cards: ApiCard[];
}

interface ApiGrade {
  grade: number;
  lessons: ApiLesson[];
}

// ── Flip card CSS injected once ─────────────────────────────────────────────
const FLIP_STYLE = `
  .fc-scene { perspective: 1200px; }
  .fc-inner { position:relative; width:100%; height:100%; transition:transform 0.55s cubic-bezier(.4,0,.2,1); transform-style:preserve-3d; }
  .fc-inner.flipped { transform:rotateY(180deg); }
  .fc-face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:24px; }
  .fc-back { transform:rotateY(180deg); }
`;

export function FlashcardPanel() {
  // ── Remote data ─────────────────────────────────────────────────────────
  const [grades, setGrades]     = useState<ApiGrade[]>([]);
  const [loading, setLoading]   = useState(true);
  const [fetchErr, setFetchErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/flashcards');
        if (!res.ok) throw new Error('Không thể tải dữ liệu thẻ ghi nhớ');
        const data = await res.json();
        if (!cancelled) setGrades((data.grades as ApiGrade[]) ?? []);
      } catch (err: unknown) {
        if (!cancelled) setFetchErr(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Grade / Lesson / Card selection ─────────────────────────────────────
  const [selectedGrade, setSelectedGrade] = useState(6);
  const [lessonIdx, setLessonIdx]         = useState(0);
  const [cardIdx, setCardIdx]             = useState(0);
  const [flipped, setFlipped]             = useState(false);
  const [direction, setDirection]         = useState<'next' | 'prev' | null>(null);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const dropdownRef                       = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derive grade object — grades always has 4 entries (6-9)
  const grade  = grades.find(g => g.grade === selectedGrade) ?? grades[0];
  const lesson = grade?.lessons[lessonIdx];
  const card   = lesson?.cards[cardIdx];
  const total  = lesson?.cards.length ?? 0;
  const meta   = GRADE_META[grade?.grade ?? 6] ?? GRADE_META[6];

  // Reset lesson & card when grade changes or data loads
  useEffect(() => {
    setLessonIdx(0);
    setCardIdx(0);
    setFlipped(false);
  }, [selectedGrade, grades]);

  useEffect(() => {
    setCardIdx(0);
    setFlipped(false);
  }, [lessonIdx]);

  const flip = () => setFlipped(f => !f);

  const goNext = useCallback(() => {
    if (cardIdx >= total - 1) return;
    setDirection('next');
    setFlipped(false);
    setTimeout(() => { setCardIdx(i => i + 1); setDirection(null); }, 120);
  }, [cardIdx, total]);

  const goPrev = useCallback(() => {
    if (cardIdx <= 0) return;
    setDirection('prev');
    setFlipped(false);
    setTimeout(() => { setCardIdx(i => i - 1); setDirection(null); }, 120);
  }, [cardIdx]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'd') goNext();
      if (e.key === 'ArrowLeft'  || e.key === 'a') goPrev();
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); flip(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev]);

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-300 border-t-cyan-500 animate-spin" />
        <p className="text-[#94A3B8] font-semibold text-sm">Đang tải thẻ ghi nhớ...</p>
      </div>
    );
  }

  // ── Empty / error state (API error only — grades always has 4 entries on success)
  if (fetchErr) {
    return (
      <div
        className="rounded-[24px] p-8 flex flex-col items-center gap-4 text-center"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}
      >
        <span className="text-5xl">💭</span>
        <p className="text-[#082F49] font-black text-lg">Không tải được dữ liệu</p>
        <p className="text-[#94A3B8] text-sm font-semibold max-w-xs">{fetchErr}</p>
      </div>
    );
  }

  const noCards = !card;

  return (
    <div className="space-y-6">
      <style>{FLIP_STYLE}</style>

      {/* ── Grade + Lesson Selector card ── */}
      <div
        className="rounded-[24px] p-5 md:p-6"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)', position: 'relative', zIndex: 10 }}
      >
        {/* Header row: title left, lesson dropdown right */}
        {/* Header: title only */}
        <div className="mb-4">
          <p className="text-[#082F49] font-black text-lg flex items-center gap-2">📚 Thẻ Ghi Nhớ Địa Lý</p>
          <p className="text-slate-400 text-sm font-medium mt-0.5 hidden sm:block">Chọn lớp và bài học để bắt đầu luyện tập</p>
        </div>

        {/* Grade pills + lesson dropdown — same row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {([6, 7, 8, 9] as const).map(g => {
            const m = GRADE_META[g];
            const hasData = (grades.find(gr => gr.grade === g)?.lessons.length ?? 0) > 0;
            return (
              <button
                key={g}
                onClick={() => { setSelectedGrade(g); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] font-black text-sm
                  transition-all duration-300 border ${
                  selectedGrade === g
                    ? `bg-gradient-to-r ${m.grad} text-white border-transparent shadow-md ${m.shadow}`
                    : hasData
                      ? 'bg-white text-[#082F49] border-slate-100 hover:border-slate-200 hover:shadow-sm'
                      : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                }`}
              >
                <span>{m.icon}</span> {m.label}
                {!hasData && <span className="text-[9px] opacity-60">(chưa có)</span>}
              </button>
            );
          })}

          {/* Lesson dropdown — inline with grade pills, pushed right */}
          <div ref={dropdownRef} className="ml-auto shrink-0 relative">
            {(grade?.lessons.length ?? 0) > 0 ? (
              <>
                {/* Trigger button */}
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className={`flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-[14px] border
                    text-sm font-bold transition-all duration-200 min-w-[200px] max-w-[260px]
                    ${ dropdownOpen
                      ? `bg-gradient-to-r ${meta.grad} text-white border-transparent shadow-lg`
                      : 'bg-white text-[#082F49] border-slate-200 hover:border-cyan-300 hover:shadow-md'
                    }`}
                >
                  <span className="text-base shrink-0">{lesson?.lessonIcon ?? '📚'}</span>
                  <span className="flex-1 text-left truncate text-xs leading-tight">
                    {lesson?.lessonTitle ?? 'Chọn bài học'}
                  </span>
                  {/* Chevron */}
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-72
                      rounded-[20px] overflow-hidden
                      border border-white/80"
                    style={{
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(24px)',
                      boxShadow: '0 20px 60px rgba(8,47,73,0.15), 0 4px 16px rgba(6,182,212,0.12)',
                    }}
                  >
                    {/* Panel header */}
                    <div className={`px-4 py-3 bg-gradient-to-r ${meta.grad} flex items-center gap-2`}>
                      <span className="text-base">{meta.icon}</span>
                      <p className="text-white font-black text-xs uppercase tracking-wider">
                        {meta.label} — {grade!.lessons.length} bài học
                      </p>
                    </div>
                    {/* Lesson list */}
                    <div className="py-2 max-h-64 overflow-y-auto
                      [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full
                      [&::-webkit-scrollbar-thumb]:bg-slate-200">
                      {grade!.lessons.map((ls, i) => (
                        <button
                          key={ls.lessonId}
                          onClick={() => { setLessonIdx(i); setDropdownOpen(false); }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left
                            transition-all duration-150 hover:bg-cyan-50/80 group
                            ${ lessonIdx === i ? 'bg-cyan-50/60' : '' }`}
                        >
                          <span className={`w-9 h-9 rounded-[12px] flex items-center justify-center
                            text-base shrink-0 transition-transform duration-200
                            group-hover:scale-110
                            ${ lessonIdx === i
                              ? `bg-gradient-to-br ${meta.grad} shadow-md`
                              : 'bg-slate-100'
                            }`}>
                            {ls.lessonIcon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black leading-snug line-clamp-2
                              ${ lessonIdx === i ? 'text-cyan-700' : 'text-[#082F49]' }`}>
                              {ls.lessonTitle}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                              {ls.cards.length} thẻ ghi nhớ
                            </p>
                          </div>
                          {lessonIdx === i && (
                            <span className="shrink-0 w-5 h-5 rounded-full bg-cyan-400
                              flex items-center justify-center">
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
                                stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[14px]
                border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-400">
                <span>📭</span> Chưa có bài học
              </span>
            )}
          </div>
        </div>
        <p className="text-[10px] font-bold tracking-widest text-slate-300 mt-3 text-right hidden sm:block">
          ← → PHÍM MŨI TÊN · SPACE ĐỂ LẬT
        </p>
      </div>

      {/* ── Main Flashcard Area ── */}
      <div
        className="rounded-[24px] p-5 md:p-8"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)', position: 'relative', zIndex: 1 }}
      >
        {noCards ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-4xl">📝</span>
            <p className="text-[#082F49] font-black text-base">Bài học này chưa có thẻ</p>
            <p className="text-[#94A3B8] text-sm font-semibold">Admin chưa thêm thẻ ghi nhớ cho bài này.</p>
          </div>
        ) : (
          <>
        {/* Header: count + lesson title */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${meta.grad} flex items-center justify-center text-white font-black text-sm shadow-md`}>
              {cardIdx + 1}
            </div>
            <div>
              <p className="text-[#082F49] font-black text-sm leading-tight">{lesson?.lessonTitle}</p>
              <p className="text-slate-400 text-xs font-medium">{total} thẻ · {meta.label}</p>
            </div>
          </div>

          {/* Flip cue */}
          <button
            onClick={flip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-black text-slate-400 hover:text-[#082F49] hover:bg-slate-50 transition-all border border-slate-100"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Lật thẻ
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-6">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${meta.grad} transition-all duration-500`}
            style={{ width: `${((cardIdx + 1) / total) * 100}%` }}
          />
        </div>

        {/* FLIP CARD */}
        <div
          className={`fc-scene w-full transition-opacity duration-100 ${direction ? 'opacity-0' : 'opacity-100'}`}
          style={{ height: 'clamp(260px, 32vw, 400px)' }}
        >
          <div className={`fc-inner ${flipped ? 'flipped' : ''}`} onClick={flip} style={{ cursor: 'pointer' }}>
            {/* FRONT */}
            <div
              className="fc-face fc-front flex flex-col items-center justify-center p-8 md:p-12 select-none relative"
              style={{
                background: 'rgba(255,255,255,0.95)',
                border: '2px solid rgba(255,255,255,1)',
                boxShadow: '0 20px 60px rgba(14,165,233,0.12)',
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-5">NHẤN ĐỂ LẬT THẺ</p>
              <p className="text-3xl md:text-5xl font-black text-[#082F49] text-center leading-tight">{card.front}</p>
              {card.hint && (
                <p className="text-slate-400 font-medium text-sm mt-5 text-center">💡 {card.hint}</p>
              )}
              <div className="absolute bottom-5 right-6 opacity-30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </div>
            </div>

            {/* BACK */}
            <div
              className="fc-face fc-back flex flex-col items-center justify-center p-8 md:p-12 select-none"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.98), rgba(240,249,255,0.98))`,
                border: '2px solid rgba(6,182,212,0.25)',
                boxShadow: '0 20px 60px rgba(14,165,233,0.18)',
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-4">ĐÁP ÁN</p>
              <p className="text-base md:text-xl font-bold text-[#334155] text-center leading-relaxed max-w-prose">{card.back}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <button
            onClick={goPrev}
            disabled={cardIdx === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-[16px] border font-black text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-md hover:-translate-y-0.5 active:scale-95 bg-white border-slate-100 text-[#082F49]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Trước
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[200px] md:max-w-none">
            {lesson?.cards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFlipped(false); setCardIdx(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === cardIdx
                    ? `w-6 h-2.5 bg-gradient-to-r ${meta.grad}`
                    : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            disabled={cardIdx === total - 1}
            className={`flex items-center gap-2 px-5 py-3 rounded-[16px] font-black text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 bg-gradient-to-r ${meta.grad} text-white shadow-md hover:shadow-lg`}
          >
            Tiếp
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Card count text */}
        <p className="text-center text-slate-400 font-bold text-xs mt-3 tabular-nums">
          {cardIdx + 1} / {total} thẻ
          {flipped ? ' · Đang xem đáp án' : ' · Nhấn thẻ hoặc nút “Lật thẻ” để xem đáp án'}
        </p>
          </>
        )}
      </div>
    </div>
  );
}
