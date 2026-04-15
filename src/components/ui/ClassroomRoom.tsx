'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaDoorOpen, FaChalkboard, FaBullhorn, FaCheck, FaUserGraduate, FaPlay } from 'react-icons/fa';
import { QuizQuestion } from './QuizCreator';
import { ChatPanel } from './ChatPanel';
import { ScorePanel } from './ScorePanel';
import { QuizCreator } from './QuizCreator';
import { QuizPanel, IActiveQuiz } from './QuizPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  seatRow: number;
  seatCol: number;
  lastSeen: string;
}

interface ClassroomData {
  _id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  subject?: string;
  rows: number;
  cols: number;
  participants: Participant[];
  announcement?: string;
  kickedIds?: string[];
  activeQuiz?: IActiveQuiz;
}

interface Props {
  classroom: ClassroomData;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  isTeacher: boolean;
  onLeave: () => void;
}

// ─── Desk component ───────────────────────────────────────────────────────────

function Desk({
  row, col, participant, isOwn, isTeacher, onSit,
}: {
  row: number; col: number;
  participant?: Participant;
  isOwn: boolean;
  isTeacher: boolean;
  onSit: (r: number, c: number) => void;
}) {
  const empty = !participant;
  const canSit = empty && !isTeacher;

  const initial = participant?.studentName?.[0]?.toUpperCase() ?? '';

  return (
    <div
      className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${canSit ? 'cursor-pointer hover:scale-110 group' : ''}`}
      onClick={() => canSit && onSit(row, col)}
      title={empty ? (canSit ? 'Ngồi vào đây' : 'Trống') : participant!.studentName}
    >
      {/* Desk surface — avatar lives inside */}
      <div className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-t-xl rounded-b-sm relative flex items-center justify-center overflow-hidden transition-all duration-300 ${
        isOwn
          ? 'border-2 border-[#06B6D4] shadow-[0_0_14px_rgba(6,182,212,0.4)]'
          : empty
          ? 'bg-amber-50 border-2 border-dashed border-amber-200 group-hover:border-[#06B6D4]/60 group-hover:bg-[#E0F2FE]/50'
          : 'border border-gray-200 shadow-sm'
      }`}>
        {empty ? (
          <span className="text-2xl text-amber-300 group-hover:text-[#06B6D4] transition-colors">🪑</span>
        ) : (
          <div className="w-full h-full">
            {participant!.studentAvatar ? (
              <img src={participant!.studentAvatar} alt={participant!.studentName} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full flex items-center justify-center font-bold text-xl text-white ${
                isOwn ? 'bg-gradient-to-br from-[#06B6D4] to-[#0369A1]' : 'bg-gradient-to-br from-cyan-400 to-blue-500'
              }`}>
                {initial}
              </div>
            )}
            {/* Own seat glow ring overlay */}
            {isOwn && (
              <div className="absolute inset-0 border-2 border-[#06B6D4] rounded-t-xl rounded-b-sm pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Desk legs */}
      <div className="flex gap-4">
        <div className="w-0.5 h-2 bg-amber-700/40 rounded-full" />
        <div className="w-0.5 h-2 bg-amber-700/40 rounded-full" />
      </div>

      {/* Full name label */}
      <p className={`text-[9px] font-semibold text-center leading-tight w-20 break-words line-clamp-2 ${
        empty ? 'text-amber-300' : isOwn ? 'text-[#06B6D4]' : 'text-[#475569]'
      }`}>
        {empty ? '—' : participant!.studentName}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClassroomRoom({
  classroom: initial,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  isTeacher,
  onLeave,
}: Props) {
  const [classroom, setClassroom] = useState<ClassroomData>(initial);
  const [announcement, setAnnouncement] = useState(initial.announcement ?? '');
  const [editingAnnouncement, setEditingAnnouncement] = useState(false);
  const [draftAnnouncement, setDraftAnnouncement] = useState(initial.announcement ?? '');
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [leavingLoading, setLeavingLoading] = useState(false);
  const [movingTo, setMovingTo] = useState<string | null>(null); // "r,c" string
  const [kicked, setKicked] = useState(false);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<QuizQuestion[]>([]);
  const [savedDuration, setSavedDuration] = useState(10);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start quiz countdown ─────────────────────────────────────────────
  function startCountdown() {
    setCountdown(10);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          // Launch quiz
          fetch(`/api/classroom/${classroom._id}/quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: savedQuestions, questionDuration: savedDuration }),
          }).then(() => fetchRoom());
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const roomId = classroom._id;

  // ── Polling ──────────────────────────────────────────────────────────────
  const fetchRoom = useCallback(async () => {
    try {
      const r = await fetch(`/api/classroom/${roomId}`);
      if (!r.ok) return;
      const d = await r.json() as { classroom: ClassroomData };
      setClassroom(d.classroom);
      setAnnouncement(d.classroom.announcement ?? '');
      // Detect kicked
      if (!isTeacher && d.classroom.kickedIds?.includes(currentUserId)) {
        setKicked(true);
      }
    } catch { /* ignore */ }
  }, [roomId]);

  useEffect(() => {
    // faster poll during active quiz
    const interval = classroom.activeQuiz && !classroom.activeQuiz.isFinished ? 1500 : 4000;
    pollRef.current = setInterval(fetchRoom, interval);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchRoom, !!(classroom.activeQuiz && !classroom.activeQuiz.isFinished)]);

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTeacher) return;
    const beat = () => fetch(`/api/classroom/${roomId}/heartbeat`, { method: 'POST' }).catch(() => {});
    beat(); // immediate
    heartbeatRef.current = setInterval(beat, 30_000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [roomId, isTeacher]);

  // ── Sit / move seat ───────────────────────────────────────────────────────
  async function handleSit(row: number, col: number) {
    const key = `${row},${col}`;
    setMovingTo(key);
    try {
      const r = await fetch(`/api/classroom/${roomId}/seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ row, col }),
      });
      if (r.ok) await fetchRoom();
    } finally {
      setMovingTo(null);
    }
  }

  // ── Leave room ────────────────────────────────────────────────────────────
  async function handleLeave() {
    setLeavingLoading(true);
    if (!isTeacher) {
      await fetch(`/api/classroom/${roomId}/leave`, { method: 'POST' }).catch(() => {});
    }
    if (pollRef.current) clearInterval(pollRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    onLeave();
  }

  // ── Save announcement ─────────────────────────────────────────────────────
  async function handleSaveAnnouncement() {
    setSavingAnnouncement(true);
    await fetch(`/api/classroom/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement: draftAnnouncement }),
    }).catch(() => {});
    setAnnouncement(draftAnnouncement);
    setEditingAnnouncement(false);
    setSavingAnnouncement(false);
    await fetchRoom();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const myParticipant = classroom.participants.find((p) => p.studentId === currentUserId);
  const onlineCount = classroom.participants.length;
  const totalSeats = classroom.rows * classroom.cols;

  function getSeatOccupant(r: number, c: number): Participant | undefined {
    return classroom.participants.find((p) => p.seatRow === r && p.seatCol === c);
  }

  const unseatedStudents = classroom.participants.filter((p) => p.seatRow === -1);

  // ── Render ────────────────────────────────────────────────────────────────

  if (kicked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-7rem)] gap-6">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl text-center max-w-sm"
             style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 40px rgba(220,38,38,0.1)' }}>
          <span className="text-5xl">🚪</span>
          <p className="font-bold text-[#082F49] text-lg">Bạn đã bị mời ra khỏi phòng</p>
          <p className="text-sm text-[#94A3B8]">Giáo viên đã xoá bạn khỏi phòng học này.</p>
          <button onClick={onLeave}
            className="px-6 py-2.5 rounded-2xl bg-[#06B6D4] text-white text-sm font-bold hover:bg-[#22D3EE] transition-all duration-300 shadow-md">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col min-h-[calc(100vh-7rem)] -mx-4 md:-mx-8 -mt-4 overflow-hidden">

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 2px 16px rgba(14,165,233,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#06B6D4]">
            <FaChalkboard size={15} />
          </div>
          <div>
            <p className="font-bold text-[#082F49] text-sm leading-tight">{classroom.name}</p>
            <p className="text-[10px] text-[#94A3B8]">
              {classroom.subject && `${classroom.subject} · `}Mã phòng: <span className="font-mono font-bold text-[#06B6D4]">{classroom.code}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] hidden sm:block">
            {onlineCount} / {totalSeats} chỗ
          </span>
          <button
            onClick={handleLeave}
            disabled={leavingLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-[#DC2626] border border-red-200 bg-red-50 hover:bg-red-100 transition-all duration-300"
          >
            <FaDoorOpen size={13} /> Thoát ra
          </button>
        </div>
      </div>

      {/* ── Classroom body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'linear-gradient(180deg, #F0FDF4 0%, #FEF9EE 40%, #FEFCE8 100%)' }}>

        {/* ── Blackboard section ───────────────────────────────────────── */}
        <div
          className="relative mx-4 md:mx-8 mt-6 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #065F46 60%, #047857 100%)',
            border: '10px solid #92400E',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.35), 0 10px 40px rgba(0,0,0,0.2)',
            minHeight: '100px',
          }}
        >
          {/* Chalk dust texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
            backgroundSize: '60px 60px, 45px 45px',
          }} />

          {/* Board content */}
          <div className="relative z-10 px-6 py-5 flex flex-col items-center gap-3">
            {/* Subject title */}
            <p className="text-white/50 text-xs tracking-[0.25em] uppercase font-mono">
              {classroom.subject ?? '— lớp học —'}
            </p>

            {/* Announcement */}
            {editingAnnouncement && isTeacher ? (
              <div className="w-full max-w-xl flex flex-col gap-2">
                <textarea
                  className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-2 text-sm resize-none border border-white/20 focus:outline-none focus:border-white/50 font-mono"
                  rows={3}
                  placeholder="Nhập thông báo trên bảng..."
                  value={draftAnnouncement}
                  onChange={(e) => setDraftAnnouncement(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingAnnouncement(false)} className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white">Hủy</button>
                  <button onClick={handleSaveAnnouncement} disabled={savingAnnouncement}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-white/20 text-white hover:bg-white/30 transition-all">
                    <FaCheck size={10} /> Lưu lên bảng
                  </button>
                </div>
              </div>
            ) : (
              <>
                {announcement ? (
                  <p className="text-center text-white/90 text-base md:text-lg font-medium max-w-xl"
                     style={{ fontFamily: '"Segoe UI", sans-serif', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                    📢 {announcement}
                  </p>
                ) : (
                  <p className="text-white/25 text-sm italic">
                    {isTeacher ? 'Bấm để viết lên bảng...' : 'Chưa có thông báo từ giáo viên'}
                  </p>
                )}
                {isTeacher && (
                  <button onClick={() => { setDraftAnnouncement(announcement); setEditingAnnouncement(true); }}
                    className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-white/80 transition-colors mt-1">
                    <FaBullhorn size={9} /> {announcement ? 'Sửa thông báo' : 'Viết lên bảng'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Chalk tray */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#92400E]/60" />
        </div>

        {/* ── Teacher podium ───────────────────────────────────────────── */}
        <div className="flex flex-col items-center py-5 gap-2">
          <div
            className="relative flex flex-col items-center px-8 py-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 8px 32px rgba(14,165,233,0.1)',
            }}
          >
            {/* Teacher avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-xl mb-2"
                 style={{ boxShadow: '0 0 0 4px rgba(6,182,212,0.2), 0 8px 24px rgba(0,0,0,0.15)' }}>
              {classroom.teacherAvatar ? (
                <img src={classroom.teacherAvatar} alt={classroom.teacherName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#06B6D4] to-[#0369A1] flex items-center justify-center text-white text-2xl">
                  👨‍🏫
                </div>
              )}
            </div>
            <p className="font-bold text-[#082F49] text-sm">{classroom.teacherName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] text-[#22C55E] font-semibold">Đang giảng bài</span>
            </div>
            {/* Quiz buttons — teacher only */}
            {isTeacher && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setShowQuizCreator(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#E0F2FE] text-[#06B6D4] border border-[#BAE6FD] text-xs font-bold hover:bg-[#BAE6FD] transition-all duration-300"
                >
                  ❓ Tạo câu hỏi
                </button>
                {savedQuestions.length > 0 && countdown === null && (
                  <button
                    onClick={startCountdown}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#22C55E] text-white text-xs font-bold hover:bg-[#4ADE80] transition-all duration-300 shadow-md"
                  >
                    <FaPlay size={9} /> Bắt đầu ({savedQuestions.length} câu)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Podium table */}
          <div className="w-40 h-3 rounded-full bg-amber-800/30" />
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mx-4 md:mx-8 mb-4">
          <div className="flex-1 h-px bg-amber-200" />
          <span className="text-xs text-amber-400 font-semibold whitespace-nowrap">
            PHÒNG HỌC · {onlineCount} học sinh online
          </span>
          <div className="flex-1 h-px bg-amber-200" />
        </div>

        {/* ── Unseated students notice ─────────────────────────────────── */}
        {unseatedStudents.length > 0 && (
          <div className="mx-4 md:mx-8 mb-4 px-4 py-2.5 rounded-2xl flex items-center gap-2"
               style={{ background: 'rgba(254,243,199,0.8)', border: '1px solid rgba(251,191,36,0.3)' }}>
            <span className="text-amber-500 text-sm">🚶</span>
            <p className="text-xs text-amber-700 font-medium">
              {unseatedStudents.map((s) => s.studentName.split(' ').pop()).join(', ')} đang đứng — hãy chọn một chỗ ngồi!
            </p>
          </div>
        )}

        {/* ── My seat indicator ────────────────────────────────────────── */}
        {!isTeacher && myParticipant && myParticipant.seatRow === -1 && (
          <div className="mx-4 md:mx-8 mb-4 px-4 py-3 rounded-2xl flex items-center gap-2"
               style={{ background: 'rgba(224,242,254,0.9)', border: '1px solid rgba(6,182,212,0.3)' }}>
            <FaUserGraduate size={13} className="text-[#06B6D4]" />
            <p className="text-xs text-[#0369A1] font-semibold">Bấm vào chỗ trống để ngồi vào đó</p>
          </div>
        )}

        {/* ── Seat grid + Score + Chat ────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-10 items-stretch">

          {/* Score panel — left side */}
          <div className="w-full lg:w-64 xl:w-72 flex-shrink-0" style={{ height: '70vh', position: 'sticky', top: '1rem' }}>
            <ScorePanel
              roomId={roomId}
              currentUserId={currentUserId}
              isTeacher={isTeacher}
              participantCount={onlineCount}
            />
          </div>

          {/* Seat rows — horizontal scroll on mobile when cols overflow */}
          <div className="flex-1 overflow-x-auto pb-2">
            <div className="space-y-3 min-w-max mx-auto px-1">
            {Array.from({ length: classroom.rows }, (_, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-2 md:gap-4"
                   style={{ opacity: 1 - rowIdx * 0.04 }}>
                {Array.from({ length: classroom.cols }, (_, colIdx) => {
                  const occupant = getSeatOccupant(rowIdx, colIdx);
                  const isOwn = occupant?.studentId === currentUserId;
                  const isMoving = movingTo === `${rowIdx},${colIdx}`;
                  return (
                    <div key={colIdx} className={`transition-transform duration-200 ${isMoving ? 'scale-110' : ''}`}>
                      <Desk
                        row={rowIdx} col={colIdx}
                        participant={occupant}
                        isOwn={isOwn}
                        isTeacher={isTeacher}
                        onSit={handleSit}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
            </div>
          </div>

          {/* Inline chat panel — sits right next to the desks */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0" style={{ height: '70vh', position: 'sticky', top: '1rem' }}>
            <ChatPanel
              roomId={roomId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              isTeacher={isTeacher}
            />
          </div>

        </div>
      </div>
    </div>

    {/* ── Quiz Creator modal ─────────────────────────────────────── */}
    {showQuizCreator && (
      <QuizCreator
        onClose={() => setShowQuizCreator(false)}
        onSaved={(qs, dur) => { setSavedQuestions(qs); setSavedDuration(dur); setShowQuizCreator(false); }}
        initialQuestions={savedQuestions.length > 0 ? savedQuestions : undefined}
        initialDuration={savedDuration}
      />
    )}

    {/* ── Active quiz panel overlay ────────────────────────────────── */}
    {classroom.activeQuiz && (
      <QuizPanel
        activeQuiz={classroom.activeQuiz}
        roomId={roomId}
        isTeacher={isTeacher}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    )}

    {/* ── Countdown overlay ────────────────────────────────────────── */}
    {countdown !== null && (
      <div className="fixed inset-0 z-50 flex items-center justify-center"
           style={{ background: 'rgba(2,6,23,0.82)', backdropFilter: 'blur(12px)' }}>
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-extrabold text-white"
               style={{ background: 'rgba(6,182,212,0.25)', border: '4px solid rgba(6,182,212,0.6)', boxShadow: '0 0 60px rgba(6,182,212,0.4)' }}>
            {countdown}
          </div>
          <p className="text-white text-2xl font-bold">Chuẩn bị nào!</p>
          <div className="flex flex-col items-center gap-1 text-white/70">
            <p className="text-sm"><span className="font-bold text-white">{savedQuestions.length}</span> câu hỏi · <span className="font-bold text-white">{savedDuration}s</span> mỗi câu</p>
            <p className="text-xs">Quiz bắt đầu sau <span className="font-bold text-[#22D3EE]">{countdown}</span> giây...</p>
          </div>
          <button onClick={() => { clearInterval(countdownRef.current!); setCountdown(null); }}
            className="px-5 py-2 rounded-2xl border border-white/30 text-white/60 text-xs hover:text-white hover:border-white/60 transition-all">
            Huỷ
          </button>
        </div>
      </div>
    )}
  </>
  );
}
