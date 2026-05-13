'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Country {
  cca2: string;
  nameCommon: string;
  flagPng?: string;
  flag?: string;
}

interface TFQuestion {
  type: 'tf';
  country: Country;
  shownName: string;
  isReal: boolean;
}

interface MCQuestion {
  type: 'mc';
  country: Country;
  options: Country[];
}

type Question = TFQuestion | MCQuestion;

// ── Constants ──────────────────────────────────────────────────────────────────
const TOTAL = 10;
const SECS  = 12;
const DEMO_FLAGS = ['🇻🇳','🇯🇵','🇺🇸','🇫🇷','🇩🇪','🇧🇷','🇰🇷','🇬🇧','🇨🇳','🇮🇳','🇦🇺','🇨🇦'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(pool: Country[], n: number): Question[] {
  const selected = shuffle(pool).slice(0, n);
  return selected.map(country => {
    if (Math.random() < 0.5) {
      const isReal = Math.random() < 0.5;
      const shownName = isReal
        ? country.nameCommon
        : shuffle(pool.filter(c => c.cca2 !== country.cca2))[0].nameCommon;
      return { type: 'tf' as const, country, shownName, isReal };
    } else {
      const others = shuffle(pool.filter(c => c.cca2 !== country.cca2)).slice(0, 3);
      const options = shuffle([country, ...others]);
      return { type: 'mc' as const, country, options };
    }
  });
}

function calcStars(score: number) {
  if (score >= 9) return 3;
  if (score >= 7) return 2;
  if (score >= 5) return 1;
  return 0;
}

// ── Gateway Card ───────────────────────────────────────────────────────────────
export default function FlagGuessGateway() {
  const [open, setOpen]             = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expEarned, setExpEarned]   = useState<number | null>(null);

  const handleGameDone = async (finalCorrect: number) => {
    setSubmitting(true);
    setExpEarned(null);
    try {
      const res = await fetch('/api/arena/flag-guess/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct: finalCorrect, total: TOTAL }),
      });
      const data = await res.json();
      if (data.success) {
        setExpEarned(data.expEarned ?? 50);
        window.dispatchEvent(new CustomEvent('arena-game-complete'));
      }
    } catch (_) {}
    setSubmitting(false);
  };

  const handleClose = () => {
    setOpen(false);
    setExpEarned(null);
    setSubmitting(false);
  };

  return (
    <>
      <div
        className="relative h-full p-2 rounded-[32px] transition-all duration-300 flex flex-col group hover:-translate-y-1"
        style={{
          background: 'rgba(255,255,255,0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 20px 40px rgba(14,165,233,0.1), inset 0 1px 0 rgba(255,255,255,1)',
        }}
      >
        <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20 transition-all group-hover:border-cyan-300/50" />

        <div className="relative h-48 rounded-[28px] overflow-hidden bg-gradient-to-br from-[#0EA5E9] via-[#06B6D4] to-[#8B5CF6]">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-1.5 p-3 opacity-70">
            {DEMO_FLAGS.map((f, i) => (
              <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-2xl select-none">{f}</div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#082F49]/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white font-bold text-xs">
              🚩 250 quốc gia · Đúng/Sai + ABCD
            </div>
            <div className="w-10 h-10 rounded-full bg-[#06B6D4] text-white flex items-center justify-center shadow-lg text-xl border-2 border-white/50">
              🚩
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <h3 className="text-xl font-extrabold text-[#082F49] mb-2 group-hover:text-cyan-500 transition-colors">
            Đoán Cờ Quốc Gia
          </h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">
            Nhận diện lá cờ của các quốc gia trên thế giới qua 2 dạng câu hỏi: Đúng/Sai và Trắc nghiệm ABCD. 10 câu mỗi lượt!
          </p>
          <div className="mt-auto relative z-30">
            <button
              onClick={() => setOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black rounded-full shadow-[0_10px_20px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 text-sm border border-[#06B6D4]"
            >
              🎮 Chơi Ngay
            </button>
          </div>
        </div>
      </div>

      {open && (
        <FlagGuessGame
          onClose={handleClose}
          onDone={handleGameDone}
          submitting={submitting}
          expEarned={expEarned}
        />
      )}
    </>
  );
}

// ── Game Modal ─────────────────────────────────────────────────────────────────
interface GameProps {
  onClose: () => void;
  onDone: (finalCorrect: number) => void;
  submitting: boolean;
  expEarned: number | null;
}

function FlagGuessGame({ onClose, onDone, submitting, expEarned }: GameProps) {
  const [phase, setPhase]         = useState<'loading' | 'playing' | 'done'>('loading');
  const [pool, setPool]           = useState<Country[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [round, setRound]         = useState(0);
  const [score, setScore]         = useState(0);
  const [streak, setStreak]       = useState(0);
  const [answered, setAnswered]   = useState(false);
  const [selected, setSelected]   = useState<string | null>(null);
  const [timeLeft, setTimeLeft]   = useState(SECS);

  const correctRef  = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  useEffect(() => {
    fetch('/api/map/countries')
      .then(r => r.json())
      .then(d => {
        if (d.seeded && Array.isArray(d.countries)) {
          const valid: Country[] = d.countries.filter((c: Country) => c.flagPng);
          setPool(valid);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (pool.length < 10) return;
    correctRef.current = 0;
    setQuestions(buildQuestions(pool, TOTAL));
    setPhase('playing');
  }, [pool]);

  useEffect(() => {
    if (phase !== 'playing') return;
    answeredRef.current = false;
    setTimeLeft(SECS);

    const id = setInterval(() => {
      if (answeredRef.current) { clearInterval(id); return; }
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          if (!answeredRef.current) {
            answeredRef.current = true;
            setAnswered(true);
            setSelected(null);
            setStreak(0);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    timerRef.current = id;
    return () => clearInterval(id);
  }, [round, phase]);

  const handleAnswer = useCallback((answer: string) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setAnswered(true);
    setSelected(answer);

    const q = questions[round];
    let isCorrect = false;
    if (q.type === 'tf') {
      isCorrect = answer === (q.isReal ? 'true' : 'false');
    } else {
      isCorrect = answer === q.country.cca2;
    }
    if (isCorrect) {
      correctRef.current += 1;
      setScore(s => s + 1);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  }, [questions, round]);

  const handleNext = useCallback(() => {
    if (round + 1 >= TOTAL) {
      setPhase('done');
      onDone(correctRef.current);
    } else {
      setRound(r => r + 1);
      setAnswered(false);
      setSelected(null);
    }
  }, [round, onDone]);

  const restart = useCallback(() => {
    if (pool.length < 10) return;
    correctRef.current = 0;
    setRound(0);
    setScore(0);
    setStreak(0);
    setAnswered(false);
    setSelected(null);
    setQuestions(buildQuestions(pool, TOTAL));
    setPhase('playing');
  }, [pool]);

  const q = questions[round];
  const starCount = calcStars(score);

  const getFeedback = () => {
    if (!q) return null;
    if (selected === null) return { correct: false, timeout: true };
    let isCorrect = false;
    if (q.type === 'tf') isCorrect = selected === (q.isReal ? 'true' : 'false');
    else isCorrect = selected === q.country.cca2;
    return { correct: isCorrect, timeout: false };
  };
  const feedback = answered ? getFeedback() : null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/70 backdrop-blur-md" />

      <div
        className="relative w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255,255,255,1)',
          boxShadow: '0 32px 64px rgba(8,47,73,0.25)',
          maxHeight: '92dvh',
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3.5 border-b border-slate-100">
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center font-black text-sm flex-shrink-0">✕</button>
          <h2 className="font-black text-[#082F49] text-sm">🚩 Đoán Cờ Quốc Gia</h2>
          {phase === 'playing' ? (
            <div className="px-3 py-1 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#0284C7] font-black text-sm min-w-[52px] text-center">
              {score}/{round}
            </div>
          ) : <div className="w-8" />}
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain">

          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-bold text-sm">Đang tải dữ liệu cờ quốc gia...</p>
            </div>
          )}

          {phase === 'playing' && q && (
            <div className="px-5 pb-6 pt-4 flex flex-col gap-4">

              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-black text-[#94A3B8] whitespace-nowrap">{round + 1}/{TOTAL}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${(round / TOTAL) * 100}%`, background: 'linear-gradient(to right, #06B6D4, #22C55E)' }} />
                </div>
                {streak >= 2 && <span className="text-[11px] font-black text-orange-500 whitespace-nowrap">🔥 ×{streak}</span>}
              </div>

              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div key={round} className="h-full rounded-full"
                  style={{
                    width: `${(timeLeft / SECS) * 100}%`,
                    background: timeLeft > 6 ? '#22C55E' : timeLeft > 3 ? '#F59E0B' : '#EF4444',
                    transition: 'width 1s linear, background 0.5s ease',
                  }} />
              </div>

              <div className="relative w-full rounded-[20px] overflow-hidden border-2 border-white"
                style={{ aspectRatio: '3/2', boxShadow: '0 8px 24px rgba(14,165,233,0.14)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={q.country.flagPng} alt="La co can doan"
                  className="w-full h-full object-cover select-none" draggable={false} />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[9px] font-black bg-white/85 backdrop-blur-sm text-slate-500 border border-white shadow-sm">
                  {q.type === 'tf' ? '✓/✗ Đúng · Sai' : '🔤 Trắc nghiệm'}
                </div>
              </div>

              <div className="text-center px-2">
                {q.type === 'tf' ? (
                  <>
                    <p className="text-xs font-semibold text-[#94A3B8] mb-1">Đây có phải cờ của...</p>
                    <p className="text-xl font-black text-[#082F49] leading-tight">{q.shownName}</p>
                    <p className="text-xs font-semibold text-[#94A3B8] mt-1">...không?</p>
                  </>
                ) : (
                  <p className="text-base font-black text-[#082F49]">Đây là cờ của nước nào?</p>
                )}
              </div>

              {feedback && (
                <div className="flex items-center gap-2 rounded-[16px] px-4 py-3 border font-bold text-sm"
                  style={feedback.timeout
                    ? { background: 'rgba(254,240,138,0.85)', borderColor: '#FDE047', color: '#92400E' }
                    : feedback.correct
                    ? { background: 'rgba(187,247,208,0.85)', borderColor: '#86EFAC', color: '#16A34A' }
                    : { background: 'rgba(254,226,226,0.85)', borderColor: '#FCA5A5', color: '#DC2626' }
                  }>
                  {feedback.timeout ? (
                    <>⏱️ Hết giờ! Đáp án đúng: <span className="font-black ml-1">{q.country.nameCommon}</span></>
                  ) : feedback.correct ? <>✓ Chính xác!</> : (
                    <>✗ Sai rồi! Đáp án đúng: <span className="font-black ml-1">{q.country.nameCommon}</span></>
                  )}
                </div>
              )}

              {q.type === 'tf' ? (
                <div className="grid grid-cols-2 gap-3">
                  {(['true', 'false'] as const).map(val => {
                    const label = val === 'true' ? '✓ Đúng' : '✗ Sai';
                    const isThisCorrect = val === 'true' ? q.isReal : !q.isReal;
                    let style: React.CSSProperties;
                    if (!answered) {
                      style = val === 'true'
                        ? { background: '#22C55E', color: 'white', border: '1px solid #22C55E', boxShadow: '0 8px 20px rgba(34,197,94,0.3)' }
                        : { background: '#F43F5E', color: 'white', border: '1px solid #F43F5E', boxShadow: '0 8px 20px rgba(244,63,94,0.3)' };
                    } else if (isThisCorrect) {
                      style = { background: 'rgba(187,247,208,0.9)', color: '#16A34A', border: '2px solid #22C55E' };
                    } else if (selected === val) {
                      style = { background: 'rgba(254,226,226,0.9)', color: '#DC2626', border: '2px solid #EF4444' };
                    } else {
                      style = { background: '#f1f5f9', color: '#94A3B8', border: '1px solid #e2e8f0' };
                    }
                    return (
                      <button key={val} disabled={answered} onClick={() => handleAnswer(val)}
                        className="py-4 rounded-[20px] font-black text-lg transition-all active:scale-95 disabled:cursor-not-allowed"
                        style={style}>{label}</button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {(q as MCQuestion).options.map((opt, i) => {
                    const isCorrectOpt = opt.cca2 === q.country.cca2;
                    const isSelectedOpt = opt.cca2 === selected;
                    let style: React.CSSProperties = { background: 'rgba(255,255,255,0.75)', border: '1.5px solid #e2e8f0', color: '#334155' };
                    if (answered) {
                      if (isCorrectOpt) style = { background: 'rgba(187,247,208,0.9)', border: '2px solid #22C55E', color: '#16A34A' };
                      else if (isSelectedOpt) style = { background: 'rgba(254,226,226,0.9)', border: '2px solid #EF4444', color: '#DC2626' };
                      else style = { background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#94A3B8' };
                    }
                    return (
                      <button key={opt.cca2} disabled={answered} onClick={() => handleAnswer(opt.cca2)}
                        className="py-3 px-3 rounded-[16px] font-bold text-sm text-left transition-all active:scale-95 disabled:cursor-not-allowed flex items-start gap-2 hover:brightness-95"
                        style={style}>
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black flex-shrink-0 mt-0.5"
                          style={answered && isCorrectOpt ? { background: '#22C55E', color: 'white' }
                            : answered && isSelectedOpt ? { background: '#EF4444', color: 'white' }
                            : { background: 'rgba(6,182,212,0.12)', color: '#0284C7' }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="leading-snug">{opt.nameCommon}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {answered && (
                <button onClick={handleNext}
                  className="w-full py-3.5 rounded-full font-black text-white text-sm transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #06B6D4, #22C55E)', boxShadow: '0 8px 20px rgba(6,182,212,0.3)' }}>
                  {round + 1 >= TOTAL ? '🏆 Xem kết quả' : 'Tiếp theo →'}
                </button>
              )}
            </div>
          )}

          {phase === 'done' && (
            <div className="flex flex-col items-center text-center px-6 py-8 gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-xl"
                style={{ background: 'linear-gradient(135deg, #06B6D4, #22C55E)' }}>🏆</div>

              <div>
                <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">Kết quả</p>
                <p className="text-5xl font-black text-[#082F49]">
                  {score}<span className="text-2xl text-[#94A3B8]">/{TOTAL}</span>
                </p>
                <div className="flex items-center justify-center gap-1 mt-3">
                  {[0, 1, 2].map(i => (
                    <span key={i} className={`text-3xl transition-all duration-300 ${i < starCount ? 'opacity-100 scale-110' : 'opacity-20'}`}>⭐</span>
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-500 mt-3 leading-relaxed">
                  {starCount === 3 ? 'Xuất sắc! Bạn là chuyên gia địa lý thế giới! 🎉'
                    : starCount === 2 ? 'Tốt lắm! Còn cải thiện được nữa! 💪'
                    : starCount === 1 ? 'Cố lên! Luyện tập thêm nhé! 📚'
                    : 'Bắt đầu lại và thử sức nhé! 🔄'}
                </p>

                {submitting ? (
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/50 border border-white/80 text-slate-500 font-bold text-xs shadow-sm">
                    <span className="w-4 h-4 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin inline-block" />
                    Đang lưu kết quả...
                  </div>
                ) : expEarned ? (
                  <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-sm animate-bounce">
                    🎉 Nhận {expEarned} EXP!
                  </div>
                ) : null}
              </div>

              <div className="w-full grid grid-cols-3 gap-2.5">
                <div className="rounded-[16px] p-3 text-center bg-white/70 border border-white">
                  <p className="text-2xl font-black text-[#22C55E]">{score}</p>
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider mt-0.5">Đúng</p>
                </div>
                <div className="rounded-[16px] p-3 text-center bg-white/70 border border-white">
                  <p className="text-2xl font-black text-[#F43F5E]">{TOTAL - score}</p>
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider mt-0.5">Sai</p>
                </div>
                <div className="rounded-[16px] p-3 text-center bg-white/70 border border-white">
                  <p className="text-2xl font-black text-[#06B6D4]">{Math.round((score / TOTAL) * 100)}%</p>
                  <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wider mt-0.5">Chính xác</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={restart}
                  className="py-3.5 rounded-full font-black text-white text-sm transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ background: '#06B6D4', border: '1px solid #06B6D4', boxShadow: '0 8px 20px rgba(6,182,212,0.3)' }}>
                  🔄 Chơi lại
                </button>
                <button onClick={onClose}
                  className="py-3.5 rounded-full font-black text-[#082F49] bg-white/80 hover:bg-white border border-slate-200 active:scale-95 transition-all text-sm shadow-sm">
                  ← Thoát
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
