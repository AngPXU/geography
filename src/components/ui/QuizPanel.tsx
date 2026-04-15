'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaPause, FaPlay, FaStop, FaCheck, FaTimes } from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IActiveQuiz {
  questions: {
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correct: 'A' | 'B' | 'C' | 'D';
    image?: string;
  }[];
  currentIndex: number;
  currentQuestionStartedAt: string;
  isPaused: boolean;
  pausedTimeRemaining: number;
  currentAnswers: { studentId: string; studentName: string; answer: string }[];
  isFinished: boolean;
  questionDuration: number;
}

interface Props {
  activeQuiz: IActiveQuiz;
  roomId: string;
  isTeacher: boolean;
  currentUserId: string;
  currentUserName: string;
  participantCount?: number;
  onForceClose?: () => void;
}

// ─── Option color config ──────────────────────────────────────────────────────

const OPT_STYLE: Record<string, { base: string; selected: string; correct: string; wrong: string; emoji: string }> = {
  A: { base: 'from-rose-400 to-red-500', selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', wrong: 'opacity-40', emoji: '🔴' },
  B: { base: 'from-blue-400 to-blue-600', selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', wrong: 'opacity-40', emoji: '🔵' },
  C: { base: 'from-amber-400 to-yellow-500', selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', wrong: 'opacity-40', emoji: '🟡' },
  D: { base: 'from-emerald-400 to-green-600', selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', wrong: 'opacity-40', emoji: '🟢' },
};

// ─── QuizPanel ────────────────────────────────────────────────────────────────

export function QuizPanel({ activeQuiz, roomId, isTeacher, currentUserId, participantCount, onForceClose }: Props) {
  const [timeLeft, setTimeLeft] = useState(activeQuiz.questionDuration);
  const [myAnswer, setMyAnswer] = useState<string | null>(null);
  const [myAnswerForIndex, setMyAnswerForIndex] = useState(-1);
  const [earnedPoints, setEarnedPoints] = useState<number | null>(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean | null>(null);
  const [inResultPhase, setInResultPhase] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const autoAdvancedRef = useRef(-1);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute timeLeft every 100ms
  useEffect(() => {
    const tick = () => {
      if (activeQuiz.isPaused) {
        setTimeLeft(activeQuiz.pausedTimeRemaining);
        return;
      }
      const elapsed = (Date.now() - new Date(activeQuiz.currentQuestionStartedAt).getTime()) / 1000;
      setTimeLeft(Math.max(0, activeQuiz.questionDuration - elapsed));
    };
    tick();
    const id = setInterval(tick, 150);
    return () => clearInterval(id);
  }, [activeQuiz]);

  // Reset my answer when question changes
  useEffect(() => {
    if (myAnswerForIndex !== activeQuiz.currentIndex) {
      setMyAnswer(null);
      setMyAnswerForIndex(activeQuiz.currentIndex);
      setEarnedPoints(null);
      setIsCorrectAnswer(null);
      setInResultPhase(false);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    }
  }, [activeQuiz.currentIndex]);

  // Teacher auto-advance when timer hits 0
  useEffect(() => {
    if (!isTeacher || advancing || inResultPhase || activeQuiz.isPaused || activeQuiz.isFinished) return;
    if (timeLeft <= 0 && autoAdvancedRef.current !== activeQuiz.currentIndex) {
      autoAdvancedRef.current = activeQuiz.currentIndex;
      setInResultPhase(true);
      resultTimerRef.current = setTimeout(() => {
        handleNext();
        setInResultPhase(false);
      }, 3000);
    }
  }, [timeLeft]);

  // Student: show result when timer hits 0
  useEffect(() => {
    if (isTeacher || activeQuiz.isPaused || activeQuiz.isFinished) return;
    if (timeLeft <= 0 && !inResultPhase) {
      setInResultPhase(true);
    }
  }, [timeLeft]);

  // ── API calls ──────────────────────────────────────────────────────────────
  async function handleAnswer(opt: string) {
    if (myAnswer || inResultPhase || timeLeft <= 0 || activeQuiz.isPaused) return;
    setMyAnswer(opt);
    setMyAnswerForIndex(activeQuiz.currentIndex);
    const res = await fetch(`/api/classroom/${roomId}/quiz/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: opt, questionIndex: activeQuiz.currentIndex }),
    });
    if (res.ok) {
      const data = await res.json() as { isCorrect: boolean; earnedPoints: number };
      setIsCorrectAnswer(data.isCorrect);
      setEarnedPoints(data.earnedPoints);
    }
  }

  async function handleControl(action: 'pause' | 'resume' | 'next' | 'finish') {
    setAdvancing(true);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    await fetch(`/api/classroom/${roomId}/quiz`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (action === 'next') setInResultPhase(false);
    setAdvancing(false);
  }

  async function handleNext() {
    const isLast = activeQuiz.currentIndex + 1 >= activeQuiz.questions.length;
    await handleControl(isLast ? 'finish' : 'next');
  }

  async function handleDelete() {
    await fetch(`/api/classroom/${roomId}/quiz`, { method: 'DELETE' });
    onForceClose?.();
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const q = activeQuiz.questions[activeQuiz.currentIndex];
  const isLast = activeQuiz.currentIndex + 1 >= activeQuiz.questions.length;
  const showCorrect = inResultPhase || timeLeft <= 0;
  const answeredCount = activeQuiz.currentAnswers.length;
  const timerPct = Math.max(0, (timeLeft / activeQuiz.questionDuration) * 100);
  const timerColor = timeLeft > activeQuiz.questionDuration * 0.5
    ? '#22C55E'
    : timeLeft > activeQuiz.questionDuration * 0.25
    ? '#F59E0B'
    : '#EF4444';

  // ── Finished screen ────────────────────────────────────────────────────────
  if (activeQuiz.isFinished) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
           style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="w-full max-w-md rounded-3xl p-8 flex flex-col items-center gap-5 text-center"
             style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 30px 80px rgba(0,0,0,0.3)' }}>
          <span className="text-6xl">🎉</span>
          <p className="font-extrabold text-[#082F49] text-2xl">Quiz hoàn thành!</p>
          <p className="text-sm text-[#94A3B8]">
            Đã hoàn thành {activeQuiz.questions.length} câu hỏi.<br />
            Xem bảng điểm bên trái để biết kết quả!
          </p>
          {isTeacher && (
            <button onClick={handleDelete}
              className="px-8 py-3 rounded-2xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#22D3EE] transition-all duration-300 shadow-lg">
              Đóng Quiz
            </button>
          )}
          {!isTeacher && (
            <p className="text-xs text-[#CBD5E1]">Chờ giáo viên đóng quiz...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-xl flex flex-col rounded-3xl overflow-hidden shadow-2xl"
           style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)', maxHeight: '92vh' }}>

        {/* ── Top bar: progress + timer ──────────────────────────────────── */}
        <div className="px-6 pt-5 pb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide">
              Câu {activeQuiz.currentIndex + 1} / {activeQuiz.questions.length}
            </span>
            <span className={`text-xl font-extrabold tabular-nums transition-colors duration-300`}
                  style={{ color: timerColor }}>
              {Math.ceil(timeLeft)}s
            </span>
          </div>

          {/* Timer bar */}
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-150"
                 style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>

          {/* Question number dots */}
          <div className="flex gap-1.5 justify-center flex-wrap">
            {activeQuiz.questions.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i < activeQuiz.currentIndex ? 'bg-[#22C55E] w-4'
                : i === activeQuiz.currentIndex ? 'bg-[#06B6D4] w-6'
                : 'bg-gray-200 w-4'
              }`} />
            ))}
          </div>
        </div>

        {/* ── Question ──────────────────────────────────────────────────── */}
        <div className="px-6 pb-4 flex-1 overflow-y-auto">
          {q.image && (
            <img src={q.image} alt="question" className="w-full rounded-2xl mb-4 max-h-40 object-cover" />
          )}
          <p className="text-[#082F49] text-base md:text-lg font-bold leading-snug mb-5 text-center">
            {q.question}
          </p>

          {isTeacher ? (
            /* ── Teacher view: correct answer + student responses ─────── */
            <div className="flex flex-col gap-3">
              {/* Correct answer highlight */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                   style={{ background: 'rgba(187,247,208,0.7)', border: '1px solid rgba(134,239,172,0.6)' }}>
                <span className="w-8 h-8 rounded-xl bg-[#22C55E] flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0">
                  {q.correct}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#16A34A] uppercase tracking-wide">Đáp án đúng</p>
                  <p className="font-bold text-[#082F49] text-sm truncate">{q.options[q.correct]}</p>
                </div>
                <FaCheck size={13} className="text-[#16A34A] flex-shrink-0" />
              </div>

              {/* Answer count */}
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="font-semibold">{answeredCount} / {participantCount ?? '?'} học sinh đã trả lời</span>
                {showCorrect && <span className="ml-auto font-bold text-[#06B6D4]">→ Chuyển câu sau 3s...</span>}
              </div>

              {/* Student response list */}
              <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: '200px' }}>
                {activeQuiz.currentAnswers.length === 0 ? (
                  <p className="text-center text-[#94A3B8] text-xs py-6">Chưa có học sinh nào trả lời</p>
                ) : (
                  activeQuiz.currentAnswers.map((ans, i) => {
                    const isCorrectAns = ans.answer === q.correct;
                    const optText = q.options[ans.answer as 'A' | 'B' | 'C' | 'D'];
                    return (
                      <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs ${
                        isCorrectAns ? 'bg-[#DCFCE7]' : 'bg-[#FEE2E2]'
                      }`}>
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-extrabold flex-shrink-0 ${
                          isCorrectAns ? 'bg-[#22C55E]' : 'bg-[#EF4444]'
                        }`}>{ans.answer}</span>
                        <span className="font-semibold text-[#082F49] flex-1 truncate">{ans.studentName}</span>
                        <span className="text-[#475569] truncate max-w-[120px]">{optText}</span>
                        {isCorrectAns
                          ? <FaCheck size={10} className="text-[#16A34A] flex-shrink-0" />
                          : <FaTimes size={10} className="text-[#EF4444] flex-shrink-0" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* ── Student view: ABCD buttons ──────────────────────────── */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const style = OPT_STYLE[opt];
                  const isMyAnswer = myAnswer === opt;
                  const isCorrectOpt = q.correct === opt;
                  const showResult = showCorrect;

                  let gradient = `bg-gradient-to-br ${style.base}`;
                  let extra = '';

                  if (showResult) {
                    if (isCorrectOpt) gradient = `bg-gradient-to-br ${style.correct}`;
                    else if (isMyAnswer && !isCorrectOpt) gradient = `bg-gradient-to-br from-red-500 to-red-700`;
                    else extra = style.wrong;
                  } else if (isMyAnswer) {
                    extra = style.selected;
                  }

                  const disabled = !!myAnswer || showCorrect || activeQuiz.isPaused;

                  return (
                    <button
                      key={opt}
                      onClick={() => !disabled && handleAnswer(opt)}
                      disabled={disabled}
                      className={`${gradient} ${extra} relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm text-left transition-all duration-300 shadow-md active:scale-95 disabled:cursor-default`}
                    >
                      <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-sm flex-shrink-0">
                        {opt}
                      </span>
                      <span className="flex-1">{q.options[opt]}</span>
                      {showResult && isCorrectOpt && <FaCheck size={14} className="flex-shrink-0" />}
                      {showResult && isMyAnswer && !isCorrectOpt && <FaTimes size={14} className="flex-shrink-0" />}
                      {isMyAnswer && !showResult && <span className="absolute top-1.5 right-2 text-[10px] font-bold bg-white/30 px-1.5 py-0.5 rounded-full">Đã chọn</span>}
                    </button>
                  );
                })}
              </div>

              {/* Result feedback for student */}
              {showCorrect && (
                <div className={`mt-4 p-3 rounded-2xl text-center text-sm font-bold ${
                  myAnswer === q.correct
                    ? 'bg-[#DCFCE7] text-[#16A34A]'
                    : myAnswer
                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                    : 'bg-[#FEF9C3] text-[#CA8A04]'
                }`}>
                  {myAnswer === q.correct
                    ? `🎉 Chính xác! ${earnedPoints !== null ? `+${earnedPoints} điểm` : ''}`
                    : myAnswer
                    ? `❌ Đáp án đúng là ${q.correct}: ${q.options[q.correct]}`
                    : `⏱ Hết giờ! Đáp án đúng là ${q.correct}: ${q.options[q.correct]}`}
                </div>
              )}

              {/* Points badge shown immediately after answering (before result phase) */}
              {!showCorrect && myAnswer && isCorrectAnswer !== null && (
                <div className={`mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold ${
                  isCorrectAnswer ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'
                }`}>
                  {isCorrectAnswer
                    ? <><span>✅ Đúng rồi!</span><span className="ml-1 px-2 py-0.5 rounded-xl bg-[#22C55E] text-white text-xs">+{earnedPoints} điểm</span></>
                    : <span>❌ Sai rồi, cố lên lần sau!</span>}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Teacher controls ───────────────────────────────────────────── */}
        {isTeacher && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3"
               style={{ background: 'rgba(248,250,252,0.9)' }}>
            {/* Pause / Resume */}
            <button
              onClick={() => handleControl(activeQuiz.isPaused ? 'resume' : 'pause')}
              disabled={advancing}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                activeQuiz.isPaused
                  ? 'bg-[#22C55E] text-white hover:bg-[#4ADE80]'
                  : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
              }`}>
              {activeQuiz.isPaused ? <><FaPlay size={10} /> Tiếp tục</> : <><FaPause size={10} /> Tạm dừng</>}
            </button>

            {/* End quiz */}
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-red-400 border border-red-200 bg-red-50 hover:bg-red-100 transition-all duration-200">
              <FaStop size={9} /> Dừng quiz
            </button>
          </div>
        )}

        {/* ── Pause overlay for students ─────────────────────────────────── */}
        {activeQuiz.isPaused && !isTeacher && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-3xl"
               style={{ background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(4px)' }}>
            <span className="text-5xl">⏸</span>
            <p className="font-extrabold text-[#082F49] text-xl">Giáo viên đã tạm dừng</p>
            <p className="text-sm text-[#94A3B8]">Vui lòng chờ giáo viên tiếp tục...</p>
          </div>
        )}
      </div>
    </div>
  );
}
