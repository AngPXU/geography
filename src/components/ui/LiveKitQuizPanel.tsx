'use client';

/**
 * LiveKitQuizPanel — Quiz minigame qua LiveKit Data Channels
 *
 * Luồng:
 *  Teacher:
 *    1. Bấm "Bắt đầu" → publishData(quiz-start) → học sinh thấy câu đầu tiên
 *    2. Mỗi lần đổi câu → publishData(quiz-question, reliable)
 *    3. Học sinh gửi quiz-answer trực tiếp (destinationIdentities:[teacherId])
 *    4. Teacher tổng hợp câu trả lời trong RAM (useRef, không setState)
 *    5. publishData(quiz-results) → học sinh thấy đúng sai + điểm
 *    6. Cuối buổi → publishData(quiz-end, finalScores) → ghi MongoDB 1 lần
 *
 *  Student:
 *    1. Nhận quiz-question → hiển thị overlay trắc nghiệm
 *    2. Bấm đáp án → publishData(quiz-answer) gửi riêng cho teacher
 *    3. Nhận quiz-results → thấy đúng/sai + điểm tích luỹ
 *    4. Nhận quiz-end → hiển thị bảng kết quả
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';
import { FaCheck, FaTimes, FaPause, FaPlay, FaStop, FaTrophy } from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  image?: string;
}

export interface ScoreEntry {
  studentId: string;
  studentName: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
}

/** Messages gửi qua LiveKit Data Channel cho quiz */
export type QuizDataMsg =
  | {
      type: 'quiz-question';
      questionIndex: number;
      question: QuizQuestion;
      questionDuration: number;
      startedAt: number; // Date.now()
      totalQuestions: number;
    }
  | {
      type: 'quiz-answer';
      questionIndex: number;
      answer: 'A' | 'B' | 'C' | 'D';
      studentId: string;
      studentName: string;
      answeredAt: number;
    }
  | {
      type: 'quiz-results';
      questionIndex: number;
      correct: 'A' | 'B' | 'C' | 'D';
      stats: Record<'A' | 'B' | 'C' | 'D', number>;
      scores: ScoreEntry[]; // top 10
    }
  | {
      type: 'quiz-pause';
      questionIndex: number;
      timeRemaining: number;
    }
  | {
      type: 'quiz-resume';
      questionIndex: number;
      startedAt: number;
    }
  | {
      type: 'quiz-end';
      finalScores: ScoreEntry[];
      totalQuestionsAsked: number;
    }
  | { type: 'quiz-close' };

interface AnswerRecord {
  answer: 'A' | 'B' | 'C' | 'D';
  studentId: string;
  studentName: string;
  answeredAt: number;
}

interface Props {
  /** LiveKit room đã kết nối từ LiveKitPanel (voice/screen). Nếu null, panel tự tạo kết nối quiz riêng. */
  room?: Room | null;
  classroomId: string;
  isTeacher: boolean;
  currentUserId: string;
  currentUserName: string;
  teacherLiveKitIdentity: string;
  participantCount: number;
  questions?: QuizQuestion[];
  questionDuration?: number;
  onQuizSaved?: (scores: ScoreEntry[], totalQuestionsAsked: number) => void;
  /** Nếu true: tự bắt đầu quiz ngay khi room sẵn sàng (dùng khi teacher nhấn nút Bắt đầu mà chưa vào voice) */
  autoStart?: boolean;
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const OPT_STYLE: Record<string, { base: string; selected: string; correct: string; emoji: string }> = {
  A: { base: 'from-rose-400 to-red-500',     selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', emoji: '🔴' },
  B: { base: 'from-blue-400 to-blue-600',    selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', emoji: '🔵' },
  C: { base: 'from-amber-400 to-yellow-500', selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', emoji: '🟡' },
  D: { base: 'from-emerald-400 to-green-600',selected: 'ring-4 ring-white/60 scale-105', correct: 'from-green-400 to-green-600', emoji: '🟢' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildScores(
  prev: ScoreEntry[],
  answers: AnswerRecord[],
  correct: 'A' | 'B' | 'C' | 'D',
): ScoreEntry[] {
  const map = new Map<string, ScoreEntry>();
  for (const e of prev) map.set(e.studentId, { ...e });

  // Sort by answeredAt to determine rank
  const sorted = [...answers].sort((a, b) => a.answeredAt - b.answeredAt);
  let correctRank = 0;
  for (const ans of sorted) {
    const entry = map.get(ans.studentId) ?? {
      studentId: ans.studentId,
      studentName: ans.studentName,
      totalScore: 0,
      correctCount: 0,
      wrongCount: 0,
    };
    if (ans.answer === correct) {
      const pts = Math.max(1, 10 - correctRank);
      entry.totalScore += pts;
      entry.correctCount += 1;
      correctRank++;
    } else {
      entry.wrongCount += 1;
    }
    map.set(ans.studentId, entry);
  }

  return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
}

// ─── LiveKitQuizPanel ─────────────────────────────────────────────────────────

export function LiveKitQuizPanel({
  room: externalRoom,
  classroomId,
  isTeacher,
  currentUserId,
  currentUserName,
  teacherLiveKitIdentity,
  participantCount,
  questions = [],
  questionDuration = 15,
  onQuizSaved,
  autoStart = false,
}: Props) {
  // ── Self-connect khi teacher bắt đầu quiz mà chưa vào voice room ──────────────
  const ownRoomRef  = useRef<Room | null>(null);
  const [ownRoom, setOwnRoom]     = useState<Room | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError] = useState('');
  const startedOnceRef = useRef(false); // đảm bảo chỉ start 1 lần

  // Room hiệu dụng: external (voice đã join) ưu tiên; fallback own
  const room = (externalRoom?.state === ConnectionState.Connected ? externalRoom : null)
             ?? (ownRoom?.state === ConnectionState.Connected ? ownRoom : null);

  // Tự kết nối nếu cần (autoStart + chưa có room)
  useEffect(() => {
    if (!autoStart || !isTeacher) return;  // chỉ teacher, chỉ khi autoStart
    if (room || connecting || ownRoomRef.current) return; // đã có rồi

    let cancelled = false;
    setConnecting(true);
    setConnError('');

    (async () => {
      try {
        const res = await fetch(`/api/classroom/${classroomId}/livekit-token`, { method: 'POST' });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Token thất bại'); }
        const { token } = await res.json() as { token: string };
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL;
        if (!wsUrl) throw new Error('NEXT_PUBLIC_LIVEKIT_WS_URL chưa cấu hình');
        if (cancelled) return;

        const r = new Room({ adaptiveStream: false, dynacast: false });
        ownRoomRef.current = r;
        r.on(RoomEvent.Disconnected, () => { setOwnRoom(null); ownRoomRef.current = null; });
        await r.connect(wsUrl, token);
        if (!cancelled) { setOwnRoom(r); setConnecting(false); }
        else r.disconnect().catch(() => {});
      } catch (e: unknown) {
        if (!cancelled) { setConnError(e instanceof Error ? e.message : 'Kết nối thất bại'); setConnecting(false); }
      }
    })();

    return () => {
      cancelled = true;
      if (ownRoomRef.current?.state !== ConnectionState.Connected) {
        ownRoomRef.current?.disconnect().catch(() => {});
        ownRoomRef.current = null;
      }
      setConnecting(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, isTeacher, classroomId]);

  // Cleanup own room on unmount
  useEffect(() => () => {
    ownRoomRef.current?.disconnect().catch(() => {});
    ownRoomRef.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Shared state (both roles) ─────────────────────────────────────────────
  const [phase, setPhase] = useState<'idle' | 'question' | 'results' | 'ended'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [inResultPhase, setInResultPhase] = useState(false);

  // ── Student-only state ────────────────────────────────────────────────────
  const [myAnswer, setMyAnswer] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [myAnswerSent, setMyAnswerSent] = useState(false); // gửi chưa
  const [shownCorrect, setShownCorrect] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [myEarnedPoints, setMyEarnedPoints] = useState<number | null>(null);
  const [resultsStats, setResultsStats] = useState<Record<'A' | 'B' | 'C' | 'D', number> | null>(null);
  const [liveScores, setLiveScores] = useState<ScoreEntry[]>([]);

  // ── Teacher-only RAM state ────────────────────────────────────────────────
  // useRef để tránh re-render khi nhận answer từng học sinh
  const answersRef = useRef<Map<number, AnswerRecord[]>>(new Map()); // questionIndex → answers
  const scoresRef  = useRef<ScoreEntry[]>([]); // tích luỹ toàn buổi
  const [teacherAnswerCount, setTeacherAnswerCount] = useState(0); // chỉ để hiển thị
  const [advancing, setAdvancing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finalScores, setFinalScores] = useState<ScoreEntry[]>([]);

  // ── Timer refs ────────────────────────────────────────────────────────────
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultTimerRef= useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStartRef = useRef<number>(0); // Date.now() when question started
  const pausedAtRef   = useRef<number>(0);    // timeLeft when paused
  const autoAdvancedRef = useRef(-1);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isConnected = room?.state === ConnectionState.Connected;

  /** Gửi data message đến toàn phòng */
  const broadcast = useCallback(async (msg: QuizDataMsg) => {
    if (!room || room.state !== ConnectionState.Connected) return;
    const payload = new TextEncoder().encode(JSON.stringify(msg));
    await room.localParticipant.publishData(payload, { reliable: true });
  }, [room]);

  /** Gửi data message chỉ đến giáo viên */
  const sendToTeacher = useCallback(async (msg: QuizDataMsg) => {
    if (!room || room.state !== ConnectionState.Connected) return;
    const payload = new TextEncoder().encode(JSON.stringify(msg));
    await room.localParticipant.publishData(payload, {
      reliable: true,
      destinationIdentities: [teacherLiveKitIdentity],
    });
  }, [room, teacherLiveKitIdentity]);

  // ── Start timer (client-side) ─────────────────────────────────────────────
  const startClientTimer = useCallback((startedAt: number, duration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    questionStartRef.current = startedAt;
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setTimeLeft(Math.max(0, duration - elapsed));
    };
    tick();
    timerRef.current = setInterval(tick, 150);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Listen for data messages ──────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;

    const handleData = (payload: Uint8Array) => {
      let msg: QuizDataMsg;
      try { msg = JSON.parse(new TextDecoder().decode(payload)) as QuizDataMsg; }
      catch { return; }

      switch (msg.type) {
        case 'quiz-question': {
          // Reset per-question state
          setCurrentQuestion(msg.question);
          setCurrentIndex(msg.questionIndex);
          setTotalQuestions(msg.totalQuestions);
          setPhase('question');
          setInResultPhase(false);
          setIsPaused(false);
          setMyAnswer(null);
          setMyAnswerSent(false);
          setShownCorrect(null);
          setMyEarnedPoints(null);
          setResultsStats(null);
          autoAdvancedRef.current = -1;
          startClientTimer(msg.startedAt, msg.questionDuration);
          if (isTeacher) {
            // Init answer bucket for this question
            if (!answersRef.current.has(msg.questionIndex)) {
              answersRef.current.set(msg.questionIndex, []);
            }
            setTeacherAnswerCount(0);
          }
          break;
        }

        case 'quiz-answer': {
          // Chỉ teacher nhận
          if (!isTeacher) break;
          const bucket = answersRef.current.get(msg.questionIndex) ?? [];
          // Deduplicate: 1 student 1 answer
          const already = bucket.findIndex((a) => a.studentId === msg.studentId);
          if (already === -1) {
            bucket.push({
              answer: msg.answer,
              studentId: msg.studentId,
              studentName: msg.studentName,
              answeredAt: msg.answeredAt,
            });
            answersRef.current.set(msg.questionIndex, bucket);
            setTeacherAnswerCount(bucket.length);
          }
          break;
        }

        case 'quiz-results': {
          // Cả học sinh và giáo viên đều hiển thị kết quả
          setShownCorrect(msg.correct);
          setResultsStats(msg.stats);
          setLiveScores(msg.scores);
          setInResultPhase(true);
          setPhase('results');
          stopTimer();
          // Student: tính điểm của mình từ scores
          if (!isTeacher) {
            const me = msg.scores.find((s) => s.studentId === currentUserId);
            // Cập nhật điểm mình vừa kiếm
            if (me && myAnswer === msg.correct) {
              // earned = difference so we'd need the previous score; simpler: show checkmark
            }
          }
          break;
        }

        case 'quiz-pause':
          setIsPaused(true);
          pausedAtRef.current = msg.timeRemaining;
          setTimeLeft(msg.timeRemaining);
          stopTimer();
          break;

        case 'quiz-resume':
          setIsPaused(false);
          startClientTimer(msg.startedAt, timeLeft);
          break;

        case 'quiz-end': {
          setFinalScores(msg.finalScores);
          setPhase('ended');
          stopTimer();
          break;
        }

        case 'quiz-close':
          setPhase('idle');
          setCurrentQuestion(null);
          stopTimer();
          break;
      }
    };

    room.on('dataReceived', handleData);
    return () => { room.off('dataReceived', handleData); };
  }, [room, isTeacher, currentUserId, myAnswer, startClientTimer, stopTimer]);

  // ── Teacher auto-advance when timer hits 0 ────────────────────────────────
  useEffect(() => {
    if (!isTeacher || advancing || inResultPhase || isPaused || phase !== 'question') return;
    if (timeLeft <= 0 && autoAdvancedRef.current !== currentIndex) {
      autoAdvancedRef.current = currentIndex;
      // Show results then advance
      handleShowResults().catch(() => {});
    }
  }, [timeLeft, isTeacher, advancing, inResultPhase, isPaused, phase, currentIndex]);

  // ── Student auto result phase when timer hits 0 ───────────────────────────
  useEffect(() => {
    if (isTeacher || isPaused || phase !== 'question') return;
    if (timeLeft <= 0 && !inResultPhase) {
      setInResultPhase(true);
    }
  }, [timeLeft, isTeacher, isPaused, phase, inResultPhase]);

  // ─── Teacher actions ────────────────────────────────────────────────────────

  /** Teacher: bắt đầu quiz — broadcast câu đầu tiên + tự cập nhật state */
  const handleStartQuiz = useCallback(async () => {
    if (!questions.length) return;
    answersRef.current = new Map();
    scoresRef.current = [];
    const q = questions[0];
    const now = Date.now();
    await broadcast({
      type: 'quiz-question',
      questionIndex: 0,
      question: q,
      questionDuration,
      startedAt: now,
      totalQuestions: questions.length,
    });
    // Teacher không nhận lại message của chính mình → tự cập nhật state
    setCurrentQuestion(q);
    setCurrentIndex(0);
    setTotalQuestions(questions.length);
    setPhase('question');
    setInResultPhase(false);
    setIsPaused(false);
    setTeacherAnswerCount(0);
    autoAdvancedRef.current = -1;
    startClientTimer(now, questionDuration);
  }, [questions, questionDuration, broadcast, startClientTimer]);

  // ── Auto-start: khi room sẵn sàng và autoStart=true, tự gọi handleStartQuiz ─
  useEffect(() => {
    if (!autoStart || !isTeacher || phase !== 'idle') return;
    if (!room || room.state !== ConnectionState.Connected) return;
    if (startedOnceRef.current) return;
    startedOnceRef.current = true;
    handleStartQuiz().catch(() => { startedOnceRef.current = false; });
  }, [autoStart, isTeacher, phase, room, handleStartQuiz]);

  /** Teacher: hiển thị kết quả câu vừa rồi → broadcast quiz-results */
  const handleShowResults = useCallback(async () => {
    if (!currentQuestion) return;
    setAdvancing(true);
    stopTimer();

    const answers = answersRef.current.get(currentIndex) ?? [];
    const correct = currentQuestion.correct;

    // Tính điểm
    scoresRef.current = buildScores(scoresRef.current, answers, correct);

    // Tính stats
    const stats: Record<'A' | 'B' | 'C' | 'D', number> = { A: 0, B: 0, C: 0, D: 0 };
    for (const a of answers) stats[a.answer]++;

    await broadcast({
      type: 'quiz-results',
      questionIndex: currentIndex,
      correct,
      stats,
      scores: scoresRef.current.slice(0, 10),
    });

    setAdvancing(false);

    // Auto-advance after 4s
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      handleAdvance().catch(() => {});
    }, 4000);
  }, [currentQuestion, currentIndex, broadcast, stopTimer]);

  /** Teacher: kết thúc quiz → broadcast quiz-end → lưu MongoDB (KHÔNG unmount panel) */
  const handleFinish = useCallback(async () => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    const finalList = scoresRef.current;
    await broadcast({ type: 'quiz-end', finalScores: finalList, totalQuestionsAsked: questions.length });
    setFinalScores(finalList);
    setPhase('ended');
    stopTimer();

    // Lưu MongoDB 1 lần duy nhất — onQuizSaved gọi trong handleClose (sau khi GV đóng)
    setSaving(true);
    try {
      await fetch(`/api/classroom/${classroomId}/quiz/save-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: finalList,
          totalQuestionsAsked: questions.length,
        }),
      });
    } catch { /* ignore */ }
    setSaving(false);
  }, [scoresRef, questions.length, broadcast, classroomId, stopTimer]);

  /** Teacher: đến câu tiếp theo hoặc kết thúc */
  const handleAdvance = useCallback(async () => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    const isLast = currentIndex + 1 >= questions.length;
    if (isLast) {
      await handleFinish();
    } else {
      const nextIdx = currentIndex + 1;
      const q = questions[nextIdx];
      const now = Date.now();
      setInResultPhase(false);
      await broadcast({
        type: 'quiz-question',
        questionIndex: nextIdx,
        question: q,
        questionDuration,
        startedAt: now,
        totalQuestions: questions.length,
      });
      // Teacher tự cập nhật state (không nhận lại message của mình)
      setCurrentQuestion(q);
      setCurrentIndex(nextIdx);
      setPhase('question');
      setIsPaused(false);
      setTeacherAnswerCount(0);
      autoAdvancedRef.current = -1;
      startClientTimer(now, questionDuration);
    }
  }, [currentIndex, questions, questionDuration, broadcast, handleFinish, startClientTimer]);

  /** Teacher: đóng quiz sau khi xem kết quả */
  /** Teacher: đóng quiz sau khi xem kết quả → broadcast quiz-close → unmount panel */
  const handleClose = useCallback(async () => {
    await broadcast({ type: 'quiz-close' });
    setPhase('idle');
    stopTimer();
    // Giờ mới gọi onQuizSaved — đảm bảo panel không unmount trước khi broadcast xong
    onQuizSaved?.(finalScores, finalScores.length);
  }, [broadcast, stopTimer, onQuizSaved, finalScores]);

  /** Teacher: tạm dừng */
  const handlePause = useCallback(async () => {
    setIsPaused(true);
    stopTimer();
    await broadcast({ type: 'quiz-pause', questionIndex: currentIndex, timeRemaining: timeLeft });
  }, [currentIndex, timeLeft, broadcast, stopTimer]);

  /** Teacher: tiếp tục */
  const handleResume = useCallback(async () => {
    const now = Date.now();
    setIsPaused(false);
    startClientTimer(now, timeLeft);
    await broadcast({ type: 'quiz-resume', questionIndex: currentIndex, startedAt: now });
  }, [currentIndex, timeLeft, broadcast, startClientTimer]);

  // ─── Student actions ────────────────────────────────────────────────────────

  const handleStudentAnswer = useCallback(async (opt: 'A' | 'B' | 'C' | 'D') => {
    if (myAnswer || myAnswerSent || inResultPhase || timeLeft <= 0 || isPaused) return;
    setMyAnswer(opt);
    setMyAnswerSent(true);
    await sendToTeacher({
      type: 'quiz-answer',
      questionIndex: currentIndex,
      answer: opt,
      studentId: currentUserId,
      studentName: currentUserName,
      answeredAt: Date.now(),
    });
  }, [myAnswer, myAnswerSent, inResultPhase, timeLeft, isPaused, currentIndex, currentUserId, currentUserName, sendToTeacher]);

  // ─── Render guard ─────────────────────────────────────────────────────────
  // Đang kết nối (teacher chưa vào voice, đang tự connect)
  if (connecting && phase === 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
           style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(10px)' }}>
        <div className="flex flex-col items-center gap-4 px-8 py-7 rounded-3xl"
             style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 20px 60px rgba(14,165,233,0.2)' }}>
          <div className="w-10 h-10 rounded-full border-4 border-cyan-200 border-t-[#06B6D4] animate-spin" />
          <p className="font-bold text-[#082F49] text-sm">Đang chuẩn bị phòng quiz...</p>
          <p className="text-xs text-[#94A3B8]">Kết nối LiveKit lần đầu, vài giây thôi!</p>
        </div>
      </div>
    );
  }

  // Lỗi kết nối
  if (connError && phase === 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
           style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(10px)' }}>
        <div className="flex flex-col items-center gap-4 px-8 py-7 rounded-3xl text-center"
             style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)' }}>
          <span className="text-4xl">⚠️</span>
          <p className="font-bold text-[#DC2626] text-sm">{connError}</p>
          <button onClick={() => { setConnError(''); onQuizSaved?.([], 0); }}
            className="px-6 py-2 rounded-2xl bg-slate-100 text-[#334155] text-xs font-bold hover:bg-slate-200 transition-all">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'idle') return null;

  const q = currentQuestion;
  const timerPct = currentQuestion ? Math.max(0, (timeLeft / questionDuration) * 100) : 0;
  const timerColor = timeLeft > questionDuration * 0.5
    ? '#22C55E'
    : timeLeft > questionDuration * 0.25
    ? '#F59E0B'
    : '#EF4444';

  // ─── ENDED screen ──────────────────────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
           style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(14px)' }}>
        <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
             style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)' }}>
          <div className="px-6 pt-8 pb-4 flex flex-col items-center gap-2 text-center">
            <FaTrophy size={48} className="text-amber-400" />
            <p className="font-extrabold text-[#082F49] text-2xl">Quiz kết thúc!</p>
            <p className="text-sm text-[#94A3B8]">Kết quả sau {totalQuestions} câu hỏi</p>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '50vh' }}>
            {finalScores.slice(0, 10).map((s, i) => (
              <div key={s.studentId}
                   className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${
                     i === 0 ? 'bg-amber-50 border border-amber-200'
                   : i === 1 ? 'bg-slate-50 border border-slate-200'
                   : i === 2 ? 'bg-orange-50 border border-orange-200'
                   : 'bg-gray-50'
                   }`}>
                <span className="text-lg font-extrabold w-6 text-center text-[#082F49]">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#082F49] text-sm truncate">{s.studentName}</p>
                  <p className="text-[10px] text-[#94A3B8]">{s.correctCount} đúng · {s.wrongCount} sai</p>
                </div>
                <span className="font-extrabold text-[#06B6D4] text-base">{s.totalScore} đ</span>
              </div>
            ))}
            {finalScores.length === 0 && (
              <p className="text-center text-[#94A3B8] text-sm py-4">Không có học sinh nào tham gia trả lời</p>
            )}
          </div>

          {isTeacher && (
            <div className="px-6 pb-6 flex justify-center gap-3">
              <button
                onClick={handleClose}
                disabled={saving}
                className="px-8 py-3 rounded-2xl bg-[#06B6D4] text-white font-bold text-sm hover:bg-[#22D3EE] transition-all duration-300 shadow-lg disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Đóng Quiz'}
              </button>
            </div>
          )}
          {!isTeacher && (
            <div className="px-6 pb-6 flex justify-center">
              <button
                onClick={() => setPhase('idle')}
                className="px-8 py-3 rounded-2xl bg-slate-100 text-[#334155] font-bold text-sm hover:bg-slate-200 transition-all duration-300"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!q) return null;

  const answeredCount = answersRef.current.get(currentIndex)?.length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(2,6,23,0.75)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-xl flex flex-col rounded-3xl overflow-hidden shadow-2xl relative"
           style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)', maxHeight: '92vh' }}>

        {/* ── Top bar ──────────────────────────────────────────────────────── */}
        <div className="px-6 pt-5 pb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wide">
              Câu {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="text-xl font-extrabold tabular-nums transition-colors duration-300"
                  style={{ color: timerColor }}>
              {Math.ceil(timeLeft)}s
            </span>
          </div>

          {/* Timer bar */}
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-150"
                 style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>

          {/* Question dots */}
          <div className="flex gap-1.5 justify-center flex-wrap">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                i < currentIndex ? 'bg-[#22C55E] w-4'
                : i === currentIndex ? 'bg-[#06B6D4] w-6'
                : 'bg-gray-200 w-4'
              }`} />
            ))}
          </div>
        </div>

        {/* ── Question body ─────────────────────────────────────────────────── */}
        <div className="px-6 pb-4 flex-1 overflow-y-auto">
          {q.image && (
            <img src={q.image} alt="question" className="w-full rounded-2xl mb-4 max-h-40 object-cover" />
          )}
          <p className="text-[#082F49] text-base md:text-lg font-bold leading-snug mb-5 text-center">
            {q.question}
          </p>

          {isTeacher ? (
            /* ── Teacher view ─────────────────────────────────────────────── */
            <div className="flex flex-col gap-3">
              {/* Correct answer highlight (always visible for teacher) */}
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
                <span className="font-semibold">
                  {isTeacher ? teacherAnswerCount : answeredCount} / {participantCount} học sinh đã trả lời
                </span>
                {inResultPhase && phase === 'results' && (
                  <span className="ml-auto font-bold text-[#06B6D4]">→ Câu tiếp sau 4s...</span>
                )}
              </div>

              {/* Stats bar (shown in results phase) */}
              {phase === 'results' && resultsStats && (
                <div className="flex flex-col gap-1.5">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const cnt = resultsStats[opt];
                    const pct = participantCount > 0 ? (cnt / participantCount) * 100 : 0;
                    const isCorrectOpt = opt === q.correct;
                    return (
                      <div key={opt} className="flex items-center gap-2 text-xs">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-white font-extrabold flex-shrink-0 text-[10px] ${isCorrectOpt ? 'bg-[#22C55E]' : 'bg-gray-300'}`}>
                          {opt}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                               style={{ width: `${pct}%`, background: isCorrectOpt ? '#22C55E' : '#94A3B8' }} />
                        </div>
                        <span className="w-6 text-right font-bold text-[#475569]">{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ── Student view ─────────────────────────────────────────────── */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const style = OPT_STYLE[opt];
                  const isMyAnswer = myAnswer === opt;
                  const isCorrectOpt = shownCorrect === opt;
                  const showResult = phase === 'results' || (inResultPhase && shownCorrect !== null);

                  let gradient = `bg-gradient-to-br ${style.base}`;
                  if (showResult) {
                    if (isCorrectOpt) gradient = `bg-gradient-to-br ${style.correct}`;
                    else if (isMyAnswer && !isCorrectOpt) gradient = 'bg-gradient-to-br from-red-500 to-red-700';
                    else gradient = `bg-gradient-to-br ${style.base} opacity-40`;
                  }

                  const disabled = !!myAnswer || showResult || isPaused;

                  return (
                    <button
                      key={opt}
                      onClick={() => !disabled && handleStudentAnswer(opt)}
                      disabled={disabled}
                      className={`${gradient} ${isMyAnswer && !showResult ? style.selected : ''} relative flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white font-semibold text-sm text-left transition-all duration-300 shadow-md active:scale-95 disabled:cursor-default`}
                    >
                      <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-extrabold text-sm flex-shrink-0">{opt}</span>
                      <span className="flex-1">{q.options[opt]}</span>
                      {showResult && isCorrectOpt && <FaCheck size={14} className="flex-shrink-0" />}
                      {showResult && isMyAnswer && !isCorrectOpt && <FaTimes size={14} className="flex-shrink-0" />}
                      {isMyAnswer && !showResult && (
                        <span className="absolute top-1.5 right-2 text-[10px] font-bold bg-white/30 px-1.5 py-0.5 rounded-full">Đã chọn</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Result feedback */}
              {(phase === 'results' || (inResultPhase && shownCorrect)) && (
                <div className={`mt-4 p-3 rounded-2xl text-center text-sm font-bold ${
                  myAnswer === shownCorrect
                    ? 'bg-[#DCFCE7] text-[#16A34A]'
                    : myAnswer
                    ? 'bg-[#FEE2E2] text-[#DC2626]'
                    : 'bg-[#FEF9C3] text-[#CA8A04]'
                }`}>
                  {myAnswer === shownCorrect
                    ? '🎉 Chính xác!'
                    : myAnswer
                    ? `❌ Đáp án đúng là ${shownCorrect}: ${q.options[shownCorrect!]}`
                    : `⏱ Hết giờ! Đáp án đúng là ${shownCorrect}: ${q.options[shownCorrect!]}`}
                </div>
              )}

              {/* Waiting feedback after answer (before results) */}
              {myAnswer && phase === 'question' && !inResultPhase && (
                <div className="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold bg-[#E0F2FE] text-[#0284C7]">
                  ✅ Đã trả lời — Chờ giáo viên chốt kết quả...
                </div>
              )}

              {/* Live top scores (shown in results phase) */}
              {phase === 'results' && liveScores.length > 0 && (
                <div className="mt-4 flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide mb-1">Bảng điểm tạm thời</p>
                  {liveScores.slice(0, 5).map((s, i) => (
                    <div key={s.studentId} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs ${s.studentId === currentUserId ? 'bg-[#E0F2FE]' : 'bg-gray-50'}`}>
                      <span className="font-bold w-4 text-[#082F49]">{i + 1}</span>
                      <span className="flex-1 font-semibold text-[#082F49] truncate">{s.studentName}</span>
                      <span className="font-extrabold text-[#06B6D4]">{s.totalScore} đ</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Teacher controls ─────────────────────────────────────────────── */}
        {isTeacher && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3"
               style={{ background: 'rgba(248,250,252,0.9)' }}>
            <button
              onClick={() => isPaused ? handleResume() : handlePause()}
              disabled={advancing || phase === 'results'}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
                isPaused
                  ? 'bg-[#22C55E] text-white hover:bg-[#4ADE80]'
                  : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPaused ? <><FaPlay size={10} /> Tiếp tục</> : <><FaPause size={10} /> Tạm dừng</>}
            </button>

            {phase === 'results' ? (
              <button
                onClick={handleAdvance}
                disabled={advancing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-[#06B6D4] text-white hover:bg-[#22D3EE] transition-all duration-200 disabled:opacity-60"
              >
                {currentIndex + 1 >= totalQuestions ? '🏁 Kết thúc' : '→ Câu tiếp'}
              </button>
            ) : (
              <button
                onClick={handleShowResults}
                disabled={advancing || isPaused}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold bg-[#06B6D4] text-white hover:bg-[#22D3EE] transition-all duration-200 disabled:opacity-60"
              >
                Chốt kết quả
              </button>
            )}

            <button
              onClick={handleFinish}
              disabled={advancing || saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-red-400 border border-red-200 bg-red-50 hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
            >
              <FaStop size={9} /> Dừng quiz
            </button>
          </div>
        )}

        {/* ── Pause overlay ─────────────────────────────────────────────────── */}
        {isPaused && !isTeacher && (
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

// ─── TeacherQuizLauncher ───────────────────────────────────────────────────────
// Nút bắt đầu quiz hiển thị bên ngoài panel (dùng trong ClassroomRoom)

interface LauncherProps {
  room: Room | null;
  questions: QuizQuestion[];
  questionDuration: number;
  classroomId: string;
  isTeacher: boolean;
  currentUserId: string;
  currentUserName: string;
  teacherLiveKitIdentity: string;
  participantCount: number;
  onQuizSaved?: (scores: ScoreEntry[], totalQuestionsAsked: number) => void;
}

export function LiveKitQuizLauncher(props: LauncherProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const panelRef = useRef<{ handleStartQuiz: () => Promise<void> } | null>(null);

  // Only teacher sees the launch button
  if (!props.isTeacher) {
    return (
      <LiveKitQuizPanel
        {...props}
        onQuizSaved={props.onQuizSaved}
      />
    );
  }

  return (
    <>
      {!quizStarted && props.questions.length > 0 && props.room?.state === ConnectionState.Connected && (
        <button
          onClick={() => setQuizStarted(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#22C55E] text-white text-xs font-bold hover:bg-[#4ADE80] transition-all duration-300 shadow-md"
        >
          ▶ Bắt đầu Quiz LiveKit ({props.questions.length} câu)
        </button>
      )}
      {quizStarted && (
        <LiveKitQuizPanel
          {...props}
          onQuizSaved={(scores, total) => {
            setQuizStarted(false);
            props.onQuizSaved?.(scores, total);
          }}
        />
      )}
    </>
  );
}
