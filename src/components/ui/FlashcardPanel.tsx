'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FLASHCARD_DATA } from '@/data/flashcardsData';
import type { FlashcardLesson, FlashcardGrade } from '@/data/flashcardsData';

// ── Flip card CSS injected once ─────────────────────────────────────────────
const FLIP_STYLE = `
  .fc-scene { perspective: 1200px; }
  .fc-inner { position:relative; width:100%; height:100%; transition:transform 0.55s cubic-bezier(.4,0,.2,1); transform-style:preserve-3d; }
  .fc-inner.flipped { transform:rotateY(180deg); }
  .fc-face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:24px; }
  .fc-back { transform:rotateY(180deg); }
`;

export function FlashcardPanel() {
  // ── Grade / Lesson selection ─────────────────────────────────────────────
  const [gradeIdx, setGradeIdx]   = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [cardIdx, setCardIdx]     = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);

  const grade: FlashcardGrade  = FLASHCARD_DATA[gradeIdx];
  const lesson: FlashcardLesson = grade.lessons[lessonIdx];
  const card = lesson.cards[cardIdx];
  const total = lesson.cards.length;

  // Reset card when lesson changes
  useEffect(() => {
    setCardIdx(0);
    setFlipped(false);
  }, [gradeIdx, lessonIdx]);

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

  return (
    <div className="space-y-6">
      <style>{FLIP_STYLE}</style>

      {/* ── Grade Selector ── */}
      <div
        className="rounded-[24px] p-5 md:p-6"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#082F49] font-black text-lg flex items-center gap-2">📚 Thẻ Ghi Nhớ Địa Lý</p>
            <p className="text-slate-400 text-sm font-medium mt-0.5">Chọn lớp và bài học để bắt đầu luyện tập</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">← → phím mũi tên | Space để lật</span>
        </div>

        {/* Grade pills */}
        <div className="flex gap-2.5 flex-wrap">
          {FLASHCARD_DATA.map((g, i) => (
            <button
              key={g.grade}
              onClick={() => { setGradeIdx(i); setLessonIdx(0); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] font-black text-sm transition-all duration-300 border ${
                gradeIdx === i
                  ? `bg-gradient-to-r ${g.grad} text-white border-transparent shadow-md ${g.shadow}`
                  : 'bg-white text-[#082F49] border-slate-100 hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <span>{g.icon}</span> {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lesson Picker Row ── */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {grade.lessons.map((ls, i) => (
          <button
            key={ls.id}
            onClick={() => setLessonIdx(i)}
            className={`shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-[18px] border transition-all duration-300 ${
              lessonIdx === i
                ? `bg-gradient-to-r ${grade.grad} text-white border-transparent shadow-lg`
                : 'bg-white/80 text-[#082F49] border-white hover:shadow-md hover:-translate-y-0.5'
            }`}
            style={lessonIdx !== i ? { backdropFilter: 'blur(12px)' } : {}}
          >
            <span className="text-xl">{ls.icon}</span>
            <div className="text-left">
              <p className={`font-black text-sm leading-tight ${lessonIdx === i ? 'text-white' : 'text-[#082F49]'}`}>{ls.title}</p>
              <p className={`text-xs font-medium ${lessonIdx === i ? 'text-white/70' : 'text-slate-400'}`}>{ls.subtitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Main Flashcard Area ── */}
      <div
        className="rounded-[24px] p-5 md:p-8"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}
      >
        {/* Header: count + lesson title */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[12px] bg-gradient-to-br ${grade.grad} flex items-center justify-center text-white font-black text-sm shadow-md`}>
              {cardIdx + 1}
            </div>
            <div>
              <p className="text-[#082F49] font-black text-sm leading-tight">{lesson.title}</p>
              <p className="text-slate-400 text-xs font-medium">{lesson.subtitle} · {grade.label}</p>
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
            className={`h-full rounded-full bg-gradient-to-r ${grade.grad} transition-all duration-500`}
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
              className="fc-face fc-front flex flex-col items-center justify-center p-8 md:p-12 select-none"
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
            {lesson.cards.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFlipped(false); setCardIdx(i); }}
                className={`rounded-full transition-all duration-300 ${
                  i === cardIdx
                    ? `w-6 h-2.5 bg-gradient-to-r ${grade.grad}`
                    : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            disabled={cardIdx === total - 1}
            className={`flex items-center gap-2 px-5 py-3 rounded-[16px] font-black text-sm transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95 bg-gradient-to-r ${grade.grad} text-white shadow-md hover:shadow-lg`}
          >
            Tiếp
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* Card count text */}
        <p className="text-center text-slate-400 font-bold text-xs mt-3 tabular-nums">
          {cardIdx + 1} / {total} thẻ
          {flipped ? ' · Đang xem đáp án' : ' · Nhấn thẻ hoặc nút "Lật thẻ" để xem đáp án'}
        </p>
      </div>

      {/* ── All Lessons Quick Grid ── */}
      <div
        className="rounded-[24px] p-5 md:p-6"
        style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}
      >
        <p className="text-[#082F49] font-black text-base mb-4 flex items-center gap-2">📖 Tất cả bài học — {grade.label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {grade.lessons.map((ls, i) => (
            <button
              key={ls.id}
              onClick={() => setLessonIdx(i)}
              className={`flex items-center gap-3 p-4 rounded-[18px] border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group ${
                lessonIdx === i ? `ring-2 ring-offset-2` : ''
              }`}
              style={lessonIdx === i ? {
                background: 'rgba(240,249,255,0.8)',
                border: '1px solid rgba(6,182,212,0.3)',
              } : {
                background: 'rgba(248,250,252,0.8)',
                border: '1px solid rgba(226,232,240,0.8)',
              }}
            >
              <div className={`w-10 h-10 rounded-[12px] shrink-0 flex items-center justify-center text-xl bg-gradient-to-br ${grade.grad} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                {ls.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[#082F49] font-black text-sm leading-tight truncate">{ls.title}</p>
                <p className="text-slate-400 text-xs font-medium mt-0.5">{ls.subtitle}</p>
              </div>
              {lessonIdx === i && (
                <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
