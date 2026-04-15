'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaTrophy, FaCheck, FaTimes, FaClock, FaRedo, FaUserTimes } from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreEntry {
  studentId: string;
  studentName: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
}

interface Props {
  roomId: string;
  currentUserId: string;
  isTeacher: boolean;
  participantCount: number;
}

// ─── Medal helper ─────────────────────────────────────────────────────────────

function medal(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

// ─── ScorePanel ───────────────────────────────────────────────────────────────

export function ScorePanel({ roomId, currentUserId, isTeacher, participantCount }: Props) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);
  const [resetting, setResetting] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch scores (polling 4s) ──────────────────────────────────────────────
  const fetchScores = useCallback(async () => {
    try {
      const r = await fetch(`/api/classroom/${roomId}/scores`);
      if (!r.ok) return;
      const d = await r.json() as {
        scores: ScoreEntry[];
        totalQuestionsAsked: number;
        onlineIds: string[];
      };
      const sorted = [...d.scores].sort((a, b) =>
        b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.correctCount - a.correctCount,
      );
      setScores(sorted);
      setTotalQuestionsAsked(d.totalQuestionsAsked);
      setOnlineIds(new Set(d.onlineIds));
    } catch { /* ignore */ }
  }, [roomId]);

  useEffect(() => {
    fetchScores();
    pollRef.current = setInterval(fetchScores, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchScores]);

  // ── Reset scores (teacher only) ────────────────────────────────────────────
  async function handleReset() {
    if (!confirm('Xoá toàn bộ điểm số hiện tại?')) return;
    setResetting(true);
    await fetch(`/api/classroom/${roomId}/scores`, { method: 'DELETE' });
    await fetchScores();
    setResetting(false);
  }

  // ── Kick student (teacher only) ──────────────────────────────────────────
  async function handleKick(studentId: string, studentName: string) {
    if (!confirm(`Đá "${studentName}" ra khỏi phòng học?`)) return;
    setKickingId(studentId);
    await fetch(`/api/classroom/${roomId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });
    await fetchScores();
    setKickingId(null);
  }

  const notAnsweredBase = (entry: ScoreEntry) =>
    Math.max(0, totalQuestionsAsked - entry.correctCount - entry.wrongCount);

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden h-full"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,1)',
        boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/60"
        style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-2">
          <FaTrophy size={14} className="text-amber-400" />
          <p className="font-bold text-[#082F49] text-sm">Tính điểm</p>
          <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#06B6D4] text-[9px] font-bold">
            {scores.length} HS
          </span>
          {totalQuestionsAsked > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 text-[9px] font-bold">
              {totalQuestionsAsked} câu
            </span>
          )}
        </div>
        {isTeacher && totalQuestionsAsked > 0 && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-red-400 border border-red-200 bg-red-50 hover:bg-red-100 transition-all duration-200"
          >
            <FaRedo size={8} /> Reset
          </button>
        )}
      </div>

      {/* Column headers */}
      <div
        className="flex-shrink-0 px-3 py-2 border-b border-white/50 text-[9px] font-bold uppercase tracking-wide text-[#94A3B8]"
        style={{ display: 'grid', gridTemplateColumns: '1.5rem 1fr 2rem 2rem 2rem 2.5rem auto' }}
      >
        <span />
        <span>Học sinh</span>
        <span className="text-center text-[#22C55E]"><FaCheck size={8} className="inline" /></span>
        <span className="text-center text-red-400"><FaTimes size={8} className="inline" /></span>
        <span className="text-center text-[#94A3B8]"><FaClock size={8} className="inline" /></span>
        <span className="text-center text-amber-500">Điểm</span>
        {isTeacher && <span />}
      </div>

      {/* Score list */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'rgba(248,250,252,0.8)' }}>
        {scores.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-12 text-center">
            <FaTrophy size={28} className="text-amber-200" />
            <p className="text-xs text-[#94A3B8] font-medium">Chưa có học sinh nào</p>
            <p className="text-[10px] text-[#CBD5E1]">Học sinh xuất hiện khi tham gia phòng</p>
          </div>
        ) : (
          <div className="divide-y divide-white/40">
            {scores.map((entry, idx) => {
              const rank = idx + 1;
              const m = medal(rank);
              const isMine = entry.studentId === currentUserId;
              const isOnline = onlineIds.has(entry.studentId);
              const notAns = notAnsweredBase(entry);

              return (
                <div
                  key={entry.studentId}
                  className={`items-center gap-1 px-3 py-2.5 transition-all duration-200 ${
                    isMine ? 'bg-[#E0F2FE]/60' : 'hover:bg-white/50'
                  }`}
                  style={{ display: 'grid', gridTemplateColumns: '1.5rem 1fr 2rem 2rem 2rem 2.5rem auto' }}
                >
                  {/* Rank */}
                  <div className="text-center">
                    {m ? (
                      <span className="text-sm leading-none">{m}</span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#CBD5E1]">{rank}</span>
                    )}
                  </div>

                  {/* Name + online dot */}
                  <div className="min-w-0 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isOnline ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'
                    }`} title={isOnline ? 'Đang online' : 'Đã rời phòng'} />
                    <p className={`text-xs font-semibold truncate leading-tight ${
                      isMine ? 'text-[#06B6D4]' : 'text-[#082F49]'
                    }`}>
                      {entry.studentName}
                      {isMine && <span className="ml-1 text-[8px] text-[#06B6D4]/70">(bạn)</span>}
                    </p>
                  </div>

                  {/* Correct */}
                  <div className="text-center">
                    <span className="text-xs font-bold text-[#22C55E]">{entry.correctCount}</span>
                  </div>

                  {/* Wrong */}
                  <div className="text-center">
                    <span className="text-xs font-bold text-red-400">{entry.wrongCount}</span>
                  </div>

                  {/* Not answered */}
                  <div className="text-center">
                    <span className="text-xs font-bold text-[#94A3B8]">{notAns}</span>
                  </div>

                  {/* Total score */}
                  <div className="text-center">
                    <span className={`text-sm font-extrabold ${
                      rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-700' : 'text-[#082F49]'
                    }`}>
                      {entry.totalScore}
                    </span>
                  </div>

                  {/* Kick button (teacher only, not self) */}
                  {isTeacher && (
                    <div className="text-center">
                      <button
                        onClick={() => handleKick(entry.studentId, entry.studentName)}
                        disabled={kickingId === entry.studentId}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-[#CBD5E1] hover:text-red-400 hover:bg-red-50 transition-all duration-200 disabled:opacity-40"
                        title={`Đá ${entry.studentName} ra`}
                      >
                        <FaUserTimes size={10} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer summary */}
      <div
        className="flex-shrink-0 px-4 py-2 border-t border-white/60 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.7)' }}
      >
        <p className="text-[9px] text-[#94A3B8]">
          {onlineIds.size} online · {scores.length} tổng
        </p>
        {totalQuestionsAsked > 0 && (
          <p className="text-[9px] text-[#94A3B8]">
            Cao nhất <span className="font-bold text-amber-500">{scores[0]?.totalScore ?? 0}</span>
          </p>
        )}
      </div>
    </div>
  );
}
