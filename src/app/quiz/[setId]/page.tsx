'use client';

import React, { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const GRADE_META: Record<number, { label: string; grad: string; icon: string }> = {
  6: { label: 'Lớp 6', grad: 'from-cyan-400 to-blue-500',     icon: '🌍' },
  7: { label: 'Lớp 7', grad: 'from-emerald-400 to-teal-500',  icon: '🗺️' },
  8: { label: 'Lớp 8', grad: 'from-violet-400 to-purple-500', icon: '🌐' },
  9: { label: 'Lớp 9', grad: 'from-orange-400 to-rose-500',   icon: '🏔️' },
};

const QUIZ_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  'kt15p':   { label: 'Kiểm tra 15p',    color: 'bg-[rgba(186,230,253,0.8)] text-[#0284C7] border-blue-200' },
  'kt1tiet': { label: 'Kiểm tra 1 tiết', color: 'bg-[rgba(233,213,255,0.8)] text-violet-700 border-violet-200' },
  'giuaky':  { label: 'Đề thi giữa kỳ', color: 'bg-[rgba(254,240,138,0.8)] text-[#D97706] border-amber-300' },
  'cuoiky':  { label: 'Đề thi cuối kỳ', color: 'bg-[rgba(254,215,170,0.8)] text-orange-600 border-orange-300' },
};

function getTypeLabel(t: string) { return QUIZ_TYPE_CONFIG[t]?.label ?? t; }
function getTypeColor(t: string) { return QUIZ_TYPE_CONFIG[t]?.color ?? 'bg-slate-100 text-slate-500 border-slate-200'; }

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QuizSet {
  _id: string; grade: number; title: string; icon: string;
  quizType: string; timeLimit: number;
}

interface QuizQuestion {
  _id: string; questionType: 'mc' | 'tf' | 'essay';
  content: string; mediaUrl?: string; mediaType?: 'image' | 'video' | 'audio';
  options: string[]; correctOption?: number;
  tfAnswers?: boolean[]; essayAnswer?: string; explanation?: string;
}

interface ExamAnswers {
  mc: Record<string, number | null>;
  tf: Record<string, (boolean | null)[]>;
  essay: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ImageThumbnail
// ─────────────────────────────────────────────────────────────────────────────

function ImageThumbnail({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="mt-2 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" onClick={() => setOpen(true)}
          className="h-16 w-24 rounded-[10px] object-cover border border-slate-200 shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity" />
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-cyan-100 hover:text-cyan-700 text-slate-500 text-[11px] font-black border border-slate-200 transition-all">
          🔍 Xem thêm
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: 'rgba(8,47,73,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(false)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-[#082F49] font-black text-sm hover:bg-red-50 hover:text-red-500 transition-all">×</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full max-h-[80vh] rounded-[20px] object-contain shadow-2xl border border-white/60" />
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exam question components
// ─────────────────────────────────────────────────────────────────────────────

function ExamMCQuestion({ q, index, selected, onSelect }: {
  q: QuizQuestion; index: number; selected: number | null; onSelect: (idx: number) => void;
}) {
  return (
    <div className="p-4 rounded-[20px] bg-white border border-slate-100 shadow-sm">
      <div className="flex gap-3 items-start">
        <span className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#082F49] text-sm leading-relaxed whitespace-pre-wrap">{q.content}</p>
          {q.mediaType === 'image' && q.mediaUrl && <ImageThumbnail src={q.mediaUrl} />}
          {q.mediaType === 'audio' && q.mediaUrl && <audio src={q.mediaUrl} controls className="mt-2 w-full" />}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 ml-10">
        {q.options.map((opt, idx) => (
          <button key={idx} onClick={() => onSelect(idx)}
            className={`p-2.5 rounded-[14px] border text-left flex items-start gap-2 transition-all duration-150
              ${selected === idx ? 'bg-cyan-50 border-cyan-400 ring-2 ring-cyan-200' : 'bg-slate-50 border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/40'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${selected === idx ? 'bg-cyan-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {['A','B','C','D'][idx]}
            </span>
            <span className="pt-0.5 text-xs text-[#334155] font-semibold">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExamTFQuestion({ q, index, answers, onToggle }: {
  q: QuizQuestion; index: number; answers: (boolean | null)[]; onToggle: (i: number, v: boolean) => void;
}) {
  return (
    <div className="p-4 rounded-[20px] bg-white border border-slate-100 shadow-sm">
      <div className="flex gap-3 items-start">
        <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#082F49] text-sm leading-relaxed whitespace-pre-wrap">{q.content}</p>
          {q.mediaType === 'image' && q.mediaUrl && <ImageThumbnail src={q.mediaUrl} />}
          {q.mediaType === 'audio' && q.mediaUrl && <audio src={q.mediaUrl} controls className="mt-2 w-full" />}
        </div>
      </div>
      <div className="mt-3 ml-10 space-y-2">
        {q.options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2.5 rounded-[14px] border border-slate-100 bg-white">
            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black shrink-0">{['a','b','c','d'][idx]}</span>
            <span className="flex-1 text-sm font-semibold text-[#082F49]">{opt}</span>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => onToggle(idx, true)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all
                  ${answers[idx] === true ? 'bg-emerald-400 text-white' : 'bg-slate-100 text-emerald-600 hover:bg-emerald-100'}`}>
                Đúng
              </button>
              <button onClick={() => onToggle(idx, false)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all
                  ${answers[idx] === false ? 'bg-red-400 text-white' : 'bg-slate-100 text-red-500 hover:bg-red-100'}`}>
                Sai
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExamEssayQuestion({ q, index, value, onChange }: {
  q: QuizQuestion; index: number; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="p-4 rounded-[20px] bg-white border border-slate-100 shadow-sm">
      <div className="flex gap-3 items-start">
        <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{index + 1}</span>
        <p className="flex-1 font-semibold text-[#082F49] text-sm leading-relaxed whitespace-pre-wrap">Câu {index + 1}: {q.content}</p>
      </div>
      <div className="ml-10 mt-3">
        <textarea rows={4} value={value} onChange={e => onChange(e.target.value)}
          placeholder="Nhập câu trả lời của bạn..."
          className="w-full px-4 py-3 rounded-[16px] border border-slate-200 bg-slate-50 text-sm font-semibold text-[#082F49] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none placeholder:text-slate-300 transition-all" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExamScreen
// ─────────────────────────────────────────────────────────────────────────────

function ExamScreen({ quizSet, questions, onFinish, onExit }: {
  quizSet: QuizSet; questions: QuizQuestion[];
  onFinish: (answers: ExamAnswers) => void;
  onExit: () => void;
}) {
  const totalSec = quizSet.timeLimit * 60;
  const [timeLeft, setTimeLeft] = useState(totalSec);
  const [warn5, setWarn5] = useState(false);
  const [warn5Dismissed, setWarn5Dismissed] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // ── Anti-cheat ────────────────────────────────────────────────────────
  type ExitReason = 'tab' | 'app';
  const [exitCount, setExitCount] = useState(0);
  const [showExitAlert, setShowExitAlert] = useState(false);
  const [exitLog, setExitLog] = useState<{ id: number; time: string; reason: ExitReason }[]>([]);
  const [latestExit, setLatestExit] = useState<{ id: number; time: string; reason: ExitReason } | null>(null);
  const lastExitTs = useRef(0);

  const [mcAnswers, setMcAnswers] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(questions.filter(q => !q.questionType || q.questionType === 'mc').map(q => [q._id, null]))
  );
  const [tfAnswers, setTfAnswers] = useState<Record<string, (boolean | null)[]>>(() =>
    Object.fromEntries(questions.filter(q => q.questionType === 'tf').map(q => [q._id, q.options.map(() => null)]))
  );
  const [essayAnswers, setEssayAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.filter(q => q.questionType === 'essay').map(q => [q._id, '']))
  );

  const collectAnswers = useCallback((): ExamAnswers => ({
    mc: mcAnswers, tf: tfAnswers, essay: essayAnswers,
  }), [mcAnswers, tfAnswers, essayAnswers]);

  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const collectRef = useRef(collectAnswers);
  collectRef.current = collectAnswers;

  useEffect(() => {
    if (timeLeft <= 0) { finishRef.current(collectRef.current()); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 300 && !warn5Dismissed) setWarn5(true);
  }, [timeLeft, warn5Dismissed]);

  useEffect(() => {
    const record = (reason: ExitReason) => {
      const now = Date.now();
      if (now - lastExitTs.current < 800) return; // debounce
      lastExitTs.current = now;
      const t = new Date(now).toLocaleTimeString('vi-VN');
      setExitCount(c => {
        const id = c + 1;
        const entry = { id, time: t, reason };
        setExitLog(prev => [...prev, entry]);
        setLatestExit(entry);
        setShowExitAlert(true);
        return id;
      });
    };
    const onVisibility = () => { if (document.hidden) record('tab'); };
    const onBlur = () => {
      // Use a small delay so visibilitychange fires first if it's a tab switch
      setTimeout(() => { if (!document.hidden) record('app'); }, 150);
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hh = Math.floor(timeLeft / 3600);
  const mm = Math.floor((timeLeft % 3600) / 60);
  const ss = timeLeft % 60;
  const timeStr = hh > 0
    ? `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  const urgent = timeLeft <= 300;

  const mcList    = questions.filter(q => !q.questionType || q.questionType === 'mc');
  const tfList    = questions.filter(q => q.questionType === 'tf');
  const essayList = questions.filter(q => q.questionType === 'essay');
  const meta      = GRADE_META[quizSet.grade] ?? GRADE_META[6];

  // ── Progress tracking ────────────────────────────────────────────────────
  function isAnswered(q: QuizQuestion): boolean {
    if (!q.questionType || q.questionType === 'mc')
      return mcAnswers[q._id] !== null && mcAnswers[q._id] !== undefined;
    if (q.questionType === 'tf')
      return (tfAnswers[q._id] ?? []).every(v => v !== null);
    if (q.questionType === 'essay')
      return (essayAnswers[q._id] ?? '').trim().length > 0;
    return false;
  }
  const answeredCount   = questions.filter(isAnswered).length;
  const unansweredCount = questions.length - answeredCount;
  const scrollToQ = (qId: string) =>
    document.getElementById(`q-${qId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%)' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-slate-200/60"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}>

        {/* Row 1: controls */}
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => setConfirmSubmit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-500 text-xs font-black border border-slate-200 transition-all shrink-0">
            ← Thoát
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[#082F49] text-sm leading-tight truncate">{quizSet.icon} {quizSet.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${getTypeColor(quizSet.quizType)}`}>
                {getTypeLabel(quizSet.quizType)}
              </span>
              <span className="text-[11px] text-[#94A3B8] font-semibold">{questions.length} câu</span>
            </div>
          </div>
          {exitCount > 0 && (
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-[10px] bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-all"
              onClick={() => setShowExitAlert(true)} title="Lần thoát bị ghi lại">
              <span className="text-base leading-none">🚨</span>
              <span className="font-black text-red-600 text-xs">{exitCount}</span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-4 py-2 rounded-[14px] font-black text-lg tabular-nums shrink-0 transition-all
            ${urgent ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'}`}>
            ⏱ {timeStr}
          </div>
          <button onClick={() => setConfirmSubmit(true)}
            className={`shrink-0 px-4 py-2 rounded-[14px] font-black text-sm text-white bg-gradient-to-r ${meta.grad} shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all`}>
            Hoàn thành
          </button>
        </div>

        {/* Row 2: question progress palette */}
        <div className="px-4 pb-2.5 flex items-center gap-3 border-t border-slate-100">
          <div className="shrink-0 text-xs leading-snug">
            <span className="font-black text-emerald-600">{answeredCount}</span>
            <span className="font-black text-[#082F49]">/{questions.length}</span>
            <span className="text-[#94A3B8] font-semibold"> đã làm</span>
            {unansweredCount > 0 && (
              <span className="ml-1.5 font-black text-rose-500">· {unansweredCount} chưa làm</span>
            )}
          </div>
          <div
            className="flex-1 overflow-x-auto flex items-center gap-1.5 py-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {questions.map((q, i) => {
              const done = isAnswered(q);
              return (
                <button
                  key={q._id}
                  onClick={() => scrollToQ(q._id)}
                  title={`Câu ${i + 1}: ${done ? 'đã làm' : 'chưa làm'}`}
                  className={`shrink-0 w-7 h-7 rounded-full text-[11px] font-black transition-all duration-150
                    ${ done
                      ? 'bg-emerald-400 text-white shadow-sm hover:bg-emerald-500'
                      : 'border-2 border-rose-300 text-rose-500 bg-white hover:bg-rose-50'
                    }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-8 w-[90%] mx-auto">
        {(mcList.length > 0 || tfList.length > 0) && (
          <section>
            <div className="mb-4 pb-2 border-b-2 border-cyan-100">
              <p className="font-black text-[#082F49] text-base">Phần I. Trắc nghiệm khách quan</p>
              <p className="text-xs text-[#94A3B8] font-semibold">{mcList.length + tfList.length} câu</p>
            </div>
            {mcList.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-black text-[#334155] mb-3">
                  I.1. Nhiều phương án lựa chọn <span className="text-xs font-semibold text-[#94A3B8]">({mcList.length} câu)</span>
                </p>
                <div className="space-y-3">
                  {mcList.map((q, i) => (
                    <div key={q._id} id={`q-${q._id}`}>
                      <ExamMCQuestion q={q} index={i}
                        selected={mcAnswers[q._id] ?? null}
                        onSelect={idx => setMcAnswers(prev => ({ ...prev, [q._id]: idx }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tfList.length > 0 && (
              <div>
                <p className="text-sm font-black text-[#334155] mb-3">
                  I.2. Đúng / Sai <span className="text-xs font-semibold text-[#94A3B8]">({tfList.length} câu)</span>
                </p>
                <div className="space-y-3">
                  {tfList.map((q, i) => (
                    <div key={q._id} id={`q-${q._id}`}>
                      <ExamTFQuestion q={q} index={i}
                        answers={tfAnswers[q._id] ?? q.options.map(() => null)}
                        onToggle={(optIdx, val) => setTfAnswers(prev => ({
                          ...prev,
                          [q._id]: (prev[q._id] ?? q.options.map(() => null)).map((v, ii) => ii === optIdx ? val : v),
                        }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {essayList.length > 0 && (
          <section>
            <div className="mb-4 pb-2 border-b-2 border-amber-100">
              <p className="font-black text-[#082F49] text-base">Phần II. Tự luận</p>
              <p className="text-xs text-[#94A3B8] font-semibold">{essayList.length} câu</p>
            </div>
            <div className="space-y-3">
              {essayList.map((q, i) => (
                <div key={q._id} id={`q-${q._id}`}>
                  <ExamEssayQuestion q={q} index={i}
                    value={essayAnswers[q._id] ?? ''}
                    onChange={v => setEssayAnswers(prev => ({ ...prev, [q._id]: v }))} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-center pt-4 pb-12">
          <button onClick={() => setConfirmSubmit(true)}
            className={`px-10 py-3.5 rounded-[16px] font-black text-base text-white bg-gradient-to-r ${meta.grad} shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all`}>
            ✅ Hoàn thành bài kiểm tra
          </button>
        </div>
      </div>

      {/* 5-min warning */}
      {warn5 && !warn5Dismissed && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] w-[90vw] max-w-sm rounded-[20px] p-4 flex items-start gap-3 shadow-2xl"
          style={{ background: 'rgba(254,240,138,0.97)', border: '1px solid #FCD34D', backdropFilter: 'blur(12px)' }}>
          <span className="text-2xl shrink-0">⚠️</span>
          <div className="flex-1">
            <p className="font-black text-amber-800 text-sm">Còn 5 phút!</p>
            <p className="text-amber-700 text-xs font-semibold mt-0.5">Hãy kiểm tra lại bài làm và nộp bài trước khi hết giờ.</p>
          </div>
          <button onClick={() => setWarn5Dismissed(true)}
            className="shrink-0 w-6 h-6 rounded-full bg-amber-200 hover:bg-amber-300 flex items-center justify-center text-amber-800 font-black text-xs transition-all">×</button>
        </div>
      )}

      {/* Anti-cheat exit alert */}
      {showExitAlert && latestExit && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4"
          style={{ background: 'rgba(220,38,38,0.18)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-[24px] p-6 border border-red-200"
            style={{ background: 'rgba(255,255,255,0.99)', boxShadow: '0 30px 80px rgba(220,38,38,0.22)' }}>
            <div className="flex items-start gap-3 mb-4">
              <span className="text-4xl shrink-0">🚨</span>
              <div>
                <p className="font-black text-red-600 text-xl">⚠️ Vi phạm giám sát!</p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Hành vi tất cả các lần thoát đều được ghi lại.</p>
              </div>
            </div>

            {/* Latest exit */}
            <div className="p-4 rounded-[16px] bg-red-50 border border-red-200 mb-3">
              <p className="text-sm font-semibold text-[#334155]">
                Bạn đã rời khỏi màn hình lúc{' '}
                <span className="font-black text-red-600">{latestExit.time}</span>
              </p>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {latestExit.reason === 'tab'
                  ? '📱 Chuyển tab / thu nhỏ trình duyệt / khóa màn hình'
                  : '📱 Chuyển sang ứng dụng khác (app switch)'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Tổng số lần vi phạm:</span>
                <span className="text-2xl font-black text-red-600">{exitCount}</span>
              </div>
            </div>

            {/* Log */}
            {exitLog.length > 1 && (
              <div className="mb-3 max-h-28 overflow-y-auto rounded-[12px] border border-slate-100 bg-slate-50 p-2 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wide mb-1">Lịch sử các lần thoát</p>
                {exitLog.map(e => (
                  <div key={e.id} className="flex items-center gap-2 text-[11px] font-semibold text-[#334155]">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-[10px] shrink-0">{e.id}</span>
                    <span className="text-slate-400">{e.time}</span>
                    <span className="flex-1 text-slate-500">— {e.reason === 'tab' ? 'Chuyển tab / thu nhỏ' : 'App switch'}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 font-semibold mb-4">
              ℹ️ Thông tin này sẽ được gửi cho giáo viên sau khi nộp bài.
            </p>
            <button onClick={() => setShowExitAlert(false)}
              className="w-full py-3 rounded-[14px] font-black text-sm text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all shadow-md">
              Tôi hiểu — Quay lại làm bài
            </button>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          style={{ background: 'rgba(8,47,73,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-sm rounded-[24px] p-6 space-y-4"
            style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 30px 80px rgba(8,47,73,0.2)' }}>
            <p className="text-[#082F49] font-black text-lg">Nộp bài kiểm tra?</p>
            <p className="text-[#94A3B8] text-sm font-semibold">
              Thời gian còn lại: <span className={urgent ? 'text-red-500 font-black' : 'text-cyan-600 font-black'}>{timeStr}</span>.
              {unansweredCount > 0 && (
                <span className="block mt-1.5 text-rose-500 font-black">⚠️ Còn {unansweredCount} câu chưa làm!</span>
              )}
              <span className="block mt-1">Sau khi nộp sẽ không thể sửa.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmSubmit(false)}
                className="flex-1 py-2.5 rounded-[14px] border border-slate-200 text-[#334155] font-black text-sm hover:bg-slate-50 transition-all">
                Làm tiếp
              </button>
              <button onClick={() => { setConfirmSubmit(false); onFinish(collectAnswers()); }}
                className={`flex-1 py-2.5 rounded-[14px] font-black text-sm text-white bg-gradient-to-r ${meta.grad} shadow-md hover:shadow-lg transition-all`}>
                Nộp bài
              </button>
            </div>
            <button onClick={onExit}
              className="w-full py-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-all">
              Thoát không lưu kết quả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ResultScreen
// ─────────────────────────────────────────────────────────────────────────────

function ResultScreen({ quizSet, questions, answers, onRetry, onBack }: {
  quizSet: QuizSet; questions: QuizQuestion[]; answers: ExamAnswers;
  onRetry: () => void; onBack: () => void;
}) {
  const mcList    = questions.filter(q => !q.questionType || q.questionType === 'mc');
  const tfList    = questions.filter(q => q.questionType === 'tf');
  const essayList = questions.filter(q => q.questionType === 'essay');

  const mcTotal   = mcList.length;
  const mcCorrect = mcList.filter(q => answers.mc[q._id] === q.correctOption).length;

  let tfTotal = 0; let tfCorrect = 0;
  tfList.forEach(q => {
    q.options.forEach((_, i) => {
      tfTotal++;
      if ((answers.tf[q._id] ?? [])[i] === (q.tfAnswers ?? [])[i]) tfCorrect++;
    });
  });

  const essayAnswered = essayList.filter(q => (answers.essay[q._id] ?? '').trim().length > 0).length;
  const meta = GRADE_META[quizSet.grade] ?? GRADE_META[6];

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%)' }}>

      {/* Top bar */}
      <div className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3 border-b border-slate-200/60"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}>
        <button onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black border border-slate-200 transition-all shrink-0">
          ← Về trang chủ
        </button>
        <p className="flex-1 font-black text-[#082F49] text-sm truncate">{quizSet.icon} Kết quả bài kiểm tra</p>
        <button onClick={onRetry}
          className={`shrink-0 px-4 py-2 rounded-[14px] font-black text-sm text-white bg-gradient-to-r ${meta.grad} shadow-md hover:shadow-lg transition-all`}>
          🔄 Làm lại
        </button>
      </div>

      <div className="flex-1 px-4 py-6 w-[90%] mx-auto space-y-6">

        {/* Score card */}
        <div className={`rounded-[24px] p-6 bg-gradient-to-br ${meta.grad} text-white shadow-xl`}>
          <p className="font-black text-lg mb-0.5">{quizSet.title}</p>
          <p className="text-sm font-semibold opacity-70 mb-5">{getTypeLabel(quizSet.quizType)} · {quizSet.timeLimit} phút</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-[16px] p-3 text-center">
              <p className="font-black text-2xl">{mcCorrect}<span className="text-base font-semibold opacity-70">/{mcTotal}</span></p>
              <p className="text-xs font-bold opacity-80 mt-1">MC đúng</p>
            </div>
            <div className="bg-white/20 rounded-[16px] p-3 text-center">
              <p className="font-black text-2xl">{tfCorrect}<span className="text-base font-semibold opacity-70">/{tfTotal}</span></p>
              <p className="text-xs font-bold opacity-80 mt-1">Đ/S đúng</p>
            </div>
            <div className="bg-white/20 rounded-[16px] p-3 text-center">
              <p className="font-black text-2xl">{essayAnswered}<span className="text-base font-semibold opacity-70">/{essayList.length}</span></p>
              <p className="text-xs font-bold opacity-80 mt-1">Tự luận</p>
            </div>
          </div>
        </div>

        {/* MC review */}
        {mcList.length > 0 && (
          <div className="rounded-[24px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 8px 24px rgba(14,165,233,0.07)' }}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
              <p className="font-black text-[#082F49]">I.1. Trắc nghiệm — {mcCorrect}/{mcTotal} câu đúng</p>
            </div>
            <div className="p-4 space-y-3">
              {mcList.map((q, i) => {
                const chosen = answers.mc[q._id];
                const correct = chosen === q.correctOption;
                return (
                  <div key={q._id} className={`p-4 rounded-[18px] border ${correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex gap-2 items-start">
                      <span className="font-black text-xs shrink-0 mt-0.5">{correct ? '✅' : '❌'}</span>
                      <p className="text-sm font-semibold text-[#082F49] whitespace-pre-wrap flex-1">{i + 1}. {q.content}</p>
                    </div>
                    {q.mediaType === 'image' && q.mediaUrl && <div className="ml-5 mt-1"><ImageThumbnail src={q.mediaUrl} /></div>}
                    <div className="ml-5 mt-2 flex flex-wrap gap-2">
                      {q.options.map((opt, idx) => (
                        <span key={idx} className={`px-2.5 py-1 rounded-full text-xs font-black border
                          ${idx === q.correctOption ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                          : chosen === idx ? 'bg-red-100 border-red-300 text-red-600'
                          : 'bg-white border-slate-200 text-slate-400'}`}>
                          {['A','B','C','D'][idx]}: {opt}
                        </span>
                      ))}
                    </div>
                    {!correct && chosen !== null && (
                      <p className="ml-5 mt-2 text-xs font-black text-emerald-600">Đáp án đúng: {['A','B','C','D'][q.correctOption ?? 0]}</p>
                    )}
                    {q.explanation && <p className="ml-5 mt-1 text-xs text-[#94A3B8] font-semibold">💡 {q.explanation}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TF review */}
        {tfList.length > 0 && (
          <div className="rounded-[24px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 8px 24px rgba(14,165,233,0.07)' }}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
              <p className="font-black text-[#082F49]">I.2. Đúng / Sai — {tfCorrect}/{tfTotal} ý đúng</p>
            </div>
            <div className="p-4 space-y-3">
              {tfList.map((q, i) => {
                const myArr = answers.tf[q._id] ?? [];
                return (
                  <div key={q._id} className="p-4 rounded-[18px] border border-slate-100 bg-white">
                    <div className="flex gap-2 items-start mb-2">
                      <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs shrink-0">{i+1}</span>
                      <p className="text-sm font-semibold text-[#082F49] whitespace-pre-wrap flex-1">{q.content}</p>
                    </div>
                    {q.mediaType === 'image' && q.mediaUrl && <div className="ml-8 mb-2"><ImageThumbnail src={q.mediaUrl} /></div>}
                    <div className="ml-8 space-y-1.5">
                      {q.options.map((opt, idx) => {
                        const correctAns = (q.tfAnswers ?? [])[idx];
                        const mine = myArr[idx];
                        const right = mine === correctAns;
                        return (
                          <div key={idx} className={`flex items-center gap-2 p-2 rounded-[12px] border ${right ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                            <span className="text-xs font-black shrink-0">{right ? '✅' : '❌'}</span>
                            <span className="text-xs font-semibold text-[#082F49] flex-1">{['a','b','c','d'][idx]}) {opt}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${correctAns ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {correctAns ? 'Đúng' : 'Sai'}
                            </span>
                            {!right && mine !== null && (
                              <span className="text-[10px] font-bold text-slate-400">Bạn: {mine ? 'Đúng' : 'Sai'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Essay review */}
        {essayList.length > 0 && (
          <div className="rounded-[24px] overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 8px 24px rgba(14,165,233,0.07)' }}>
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <p className="font-black text-[#082F49]">Phần II. Tự luận — {essayAnswered}/{essayList.length} câu đã trả lời</p>
            </div>
            <div className="p-4 space-y-4">
              {essayList.map((q, i) => (
                <div key={q._id} className="p-4 rounded-[18px] border border-slate-100 bg-white">
                  <p className="text-sm font-black text-[#082F49] mb-2">Câu {i+1}: {q.content}</p>
                  <div className="p-3 rounded-[12px] bg-slate-50 border border-slate-200 mb-3">
                    <p className="text-xs font-bold text-slate-400 mb-1">Bài làm của bạn:</p>
                    {(answers.essay[q._id] ?? '').trim()
                      ? <p className="text-sm text-[#334155] font-semibold whitespace-pre-wrap">{answers.essay[q._id]}</p>
                      : <p className="text-sm text-slate-300 italic">Chưa trả lời</p>}
                  </div>
                  {q.essayAnswer && (
                    <div className="p-3 rounded-[12px] bg-amber-50 border border-amber-200">
                      <p className="text-xs font-bold text-amber-600 mb-1">💡 Gợi ý đáp án:</p>
                      <p className="text-sm text-[#334155] font-semibold whitespace-pre-wrap">{q.essayAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center pb-12">
          <button onClick={onRetry}
            className={`px-10 py-3.5 rounded-[16px] font-black text-base text-white bg-gradient-to-r ${meta.grad} shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all`}>
            🔄 Làm lại bài này
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page — fetches data then shows Exam → Result
// ─────────────────────────────────────────────────────────────────────────────

export default function QuizPage({ params }: { params: Promise<{ setId: string }> }) {
  const router = useRouter();
  const { setId } = use(params);

  const [quizSet, setQuizSet] = useState<QuizSet | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [examDone, setExamDone] = useState(false);
  const [examAnswers, setExamAnswers] = useState<ExamAnswers | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/quizzes?setId=${setId}`);
        if (!res.ok) throw new Error('Không tìm thấy đề kiểm tra');
        const data = await res.json();
        if (!data.set) throw new Error('Đề kiểm tra không tồn tại');
        setQuizSet(data.set);
        setQuestions(data.questions ?? []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [setId]);

  const handleFinish = useCallback((ans: ExamAnswers) => {
    setExamAnswers(ans);
    setExamDone(true);
  }, []);

  const handleRetry = useCallback(() => {
    setExamAnswers(null);
    setExamDone(false);
  }, []);

  const handleBack = useCallback(() => {
    router.push('/');
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%)' }}>
        <div className="w-14 h-14 rounded-full border-4 border-cyan-300 border-t-cyan-500 animate-spin" />
        <p className="text-[#94A3B8] font-semibold">Đang tải đề kiểm tra...</p>
      </div>
    );
  }

  if (error || !quizSet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%)' }}>
        <span className="text-6xl">😕</span>
        <p className="text-[#082F49] font-black text-xl">{error || 'Không tìm thấy đề'}</p>
        <button onClick={handleBack}
          className="px-6 py-2.5 rounded-[14px] bg-cyan-500 text-white font-black hover:bg-cyan-400 transition-all">
          ← Về trang chủ
        </button>
      </div>
    );
  }

  if (examDone && examAnswers) {
    return (
      <ResultScreen
        quizSet={quizSet} questions={questions} answers={examAnswers}
        onRetry={handleRetry} onBack={handleBack}
      />
    );
  }

  return (
    <ExamScreen
      quizSet={quizSet} questions={questions}
      onFinish={handleFinish} onExit={handleBack}
    />
  );
}
