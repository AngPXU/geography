'use client';

import { useState, useCallback } from 'react';
import { FaTrophy, FaCheck, FaTimes, FaClock, FaRedo, FaUserTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Icon } from '@iconify/react';

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
  scores: ScoreEntry[];
  totalQuestionsAsked: number;
  onlineIds: Set<string>;
  kickedIds: string[];
  onRefresh: () => void | Promise<void>;
}

// ─── Medal helper ─────────────────────────────────────────────────────────────

function medal(rank: number) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

// ─── ScorePanel ───────────────────────────────────────────────────────────────

export function ScorePanel({ roomId, currentUserId, isTeacher, scores: rawScores, totalQuestionsAsked, onlineIds, kickedIds, onRefresh }: Props) {
  const [resetting, setResetting] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const scores = [...rawScores].sort((a, b) =>
    b.totalScore !== a.totalScore ? b.totalScore - a.totalScore : b.correctCount - a.correctCount,
  );

  // ── Reset scores (teacher only) ────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    if (!confirm('Xoá toàn bộ điểm số hiện tại?')) return;
    setResetting(true);
    await fetch(`/api/classroom/${roomId}/scores`, { method: 'DELETE' });
    onRefresh();
    setResetting(false);
  }, [roomId, onRefresh]);

  // ── Kick student (teacher only) ──────────────────────────────────────────
  const handleKick = useCallback(async (studentId: string, studentName: string) => {
    if (!confirm(`Đá "${studentName}" ra khỏi phòng học?`)) return;
    setKickingId(studentId);
    await fetch(`/api/classroom/${roomId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    });
    onRefresh();
    setKickingId(null);
  }, [roomId, onRefresh]);

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
          <Icon icon="solar:cup-bold" width={14} />
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
        style={{ display: 'grid', gridTemplateColumns: '1.5rem 1fr 2rem 2rem 2rem 2.5rem' }}
      >
        <span />
        <span>Học sinh</span>
        <span className="text-center text-[#22C55E]"><FaCheck size={8} className="inline" /></span>
        <span className="text-center text-red-400"><FaTimes size={8} className="inline" /></span>
        <span className="text-center text-[#94A3B8]"><FaClock size={8} className="inline" /></span>
        <span className="text-center text-amber-500">Điểm</span>
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
              const isExpanded = expandedId === entry.studentId;

              return (
                <div key={entry.studentId}>
                  {/* Main row */}
                  <div
                    className={`items-center gap-1 px-3 py-2.5 transition-all duration-200 ${isMine ? 'bg-[#E0F2FE]/60' : 'hover:bg-white/50'
                      }`}
                    style={{ display: 'grid', gridTemplateColumns: '1.5rem 1fr 2rem 2rem 2rem 2.5rem' }}
                  >
                    {/* Rank */}
                    <div className="text-center">
                      {m ? (
                        <span className="text-sm leading-none">{m}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#CBD5E1]">{rank}</span>
                      )}
                    </div>

                    {/* Name + online dot — clickable to expand */}
                    <div
                      className={`min-w-0 flex items-center gap-1.5 ${isTeacher ? 'cursor-pointer select-none' : ''}`}
                      onClick={() => isTeacher && setExpandedId(isExpanded ? null : entry.studentId)}
                      title={isTeacher ? (isExpanded ? 'Thu gọn' : 'Xem đầy đủ tên') : undefined}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'
                        }`} />
                      <p className={`text-xs font-semibold truncate leading-tight flex-1 ${isMine ? 'text-[#06B6D4]' : 'text-[#082F49]'
                        }`}>
                        {entry.studentName}
                        {isMine && <span className="ml-1 text-[8px] text-[#06B6D4]/70">(bạn)</span>}
                      </p>
                      {isTeacher && (
                        <span className="flex-shrink-0 text-[#CBD5E1]">
                          {isExpanded ? <FaChevronUp size={8} /> : <FaChevronDown size={8} />}
                        </span>
                      )}
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
                      <span className={`text-sm font-extrabold ${rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-amber-700' : 'text-[#082F49]'
                        }`}>
                        {entry.totalScore}
                      </span>
                    </div>
                  </div>

                  {/* Expanded panel — full name + kick button */}
                  {isExpanded && isTeacher && (
                    <div
                      className="mx-3 mb-2 px-3 py-2.5 rounded-2xl flex items-center justify-between gap-3"
                      style={{
                        background: 'rgba(224,242,254,0.85)',
                        border: '1px solid rgba(6,182,212,0.2)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-[#22C55E]' : 'bg-[#CBD5E1]'
                          }`} />
                        <p className="text-xs font-bold text-[#082F49] break-all leading-snug">
                          {entry.studentName}
                        </p>
                      </div>
                      {entry.studentId !== currentUserId && (
                        <button
                          onClick={() => { handleKick(entry.studentId, entry.studentName); setExpandedId(null); }}
                          disabled={kickingId === entry.studentId}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-red-400 border border-red-200 bg-red-50 hover:bg-red-100 flex-shrink-0 transition-all duration-200 disabled:opacity-40"
                        >
                          <FaUserTimes size={9} /> Đá ra
                        </button>
                      )}
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
