'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  FaArrowLeft, FaClock, FaStar, FaSpinner, FaCheckCircle,
  FaTimesCircle, FaChevronDown, FaChevronUp, FaSave,
} from 'react-icons/fa';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  type: 'text' | 'quiz';
  description?: string;
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectIndex?: number;
}

interface SubmissionAnswer {
  questionIdx: number;
  answer?: string;
  textScore?: number;
}

interface Submission {
  userId: string;
  username: string;
  submittedAt: string;
  answers: SubmissionAnswer[];
  totalScore?: number;
  fullyGraded?: boolean;
  gradedAt?: string;
}

interface AssignmentDetail {
  _id: string;
  title: string;
  questions: Question[];
  dueDate?: string;
  expReward: number;
  submissions: Submission[];
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const GLASS = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,1)',
  boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
} as const;

const inputCls =
  'w-full rounded-[14px] border-2 border-slate-200 focus:border-cyan-400 bg-white/80 ' +
  'px-4 py-2.5 text-sm text-[#082F49] font-medium outline-none transition-all ' +
  'placeholder:text-[#94A3B8]';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

function timeUntil(dateStr: string): { label: string; urgent: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return { label: 'Đã quá hạn', urgent: true };
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0) return { label: `Còn ${days} ngày`, urgent: days <= 1 };
  if (hours > 0) return { label: `Còn ${hours} giờ`, urgent: true };
  return { label: `Còn ${mins} phút`, urgent: true };
}

/** Client-side score computation (mirrors server logic exactly). */
function computeScore(
  questions: Question[],
  answers: SubmissionAnswer[],
): { totalScore: number; fullyGraded: boolean } {
  const N = questions.length;
  if (N === 0) return { totalScore: 0, fullyGraded: true };
  let rawSum = 0, textUngraded = 0;
  for (let i = 0; i < N; i++) {
    const q   = questions[i];
    const ans = answers.find(a => a.questionIdx === i);
    if (q.type === 'quiz') {
      rawSum += ans?.answer !== undefined && Number(ans.answer) === q.quizCorrectIndex ? 1 : 0;
    } else {
      if (ans?.textScore !== undefined) rawSum += ans.textScore / 10;
      else textUngraded++;
    }
  }
  const fullyGraded = textUngraded === 0;
  const rawTotal    = rawSum * (10 / N);
  return { totalScore: rawTotal === 0 ? 0 : Math.min(10, Math.ceil(rawTotal)), fullyGraded };
}

// ─── Student view ───────────────────────────────────────────────────────────────

function StudentView({
  assignment,
  userId,
  classId,
  onSubmitted,
}: {
  assignment: AssignmentDetail;
  userId: string;
  classId: string;
  onSubmitted: (submission: Submission) => void;
}) {
  const mySub     = assignment.submissions.find(s => s.userId === userId) ?? null;
  const submitted = Boolean(mySub);

  const [answers, setAnswers]       = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const deadline  = assignment.dueDate ? timeUntil(assignment.dueDate) : null;

  const handleSubmit = async () => {
    const textQs = assignment.questions.filter((q, i) => q.type === 'text' && answers[i] === undefined);
    if (textQs.length > 0) {
      setError('Vui lòng trả lời đầy đủ tất cả câu hỏi văn bản');
      return;
    }
    setSubmitting(true); setError('');
    const body = {
      answers: assignment.questions.map((_, i) => ({
        questionIdx: i,
        answer:      answers[i] ?? '',
      })),
    };
    const res  = await fetch(`/api/homeclass/${classId}/assignments/${assignment._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error || 'Nộp thất bại'); return; }
    // Build a fake submission for immediate UI update
    onSubmitted({
      userId,
      username: '',
      submittedAt: new Date().toISOString(),
      answers: body.answers,
      fullyGraded: false,
    });
  };

  if (submitted && mySub) {
    // Show submitted state
    return (
      <div className="space-y-4">
        <div className="rounded-[20px] p-5 flex items-center gap-3"
          style={{ ...GLASS, background: 'rgba(187,247,208,0.6)', border: '1px solid rgba(167,243,208,0.8)' }}>
          <FaCheckCircle className="text-emerald-500 text-lg shrink-0" />
          <div>
            <p className="font-black text-emerald-800">Bạn đã nộp bài thành công!</p>
            <p className="text-emerald-600 text-xs mt-0.5">
              Nộp lúc {new Date(mySub.submittedAt).toLocaleString('vi-VN')}
              {mySub.fullyGraded && mySub.totalScore !== undefined && (
                <span className="ml-2 font-black">· 🏆 {mySub.totalScore}/10 điểm</span>
              )}
              {!mySub.fullyGraded && <span className="ml-2">· ⏳ Đang chờ giáo viên chấm điểm</span>}
            </p>
          </div>
        </div>

        {/* Show answers */}
        {assignment.questions.map((q, i) => {
          const ans = mySub.answers.find(a => a.questionIdx === i);
          const isQuizCorrect = q.type === 'quiz' && Number(ans?.answer) === q.quizCorrectIndex;
          return (
            <div key={i} className="rounded-[20px] p-5 space-y-3" style={GLASS}>
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black
                  ${q.type === 'quiz' ? 'bg-violet-100 text-violet-600' : 'bg-cyan-100 text-cyan-600'}`}>
                  {i + 1}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                  ${q.type === 'quiz' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-cyan-600'}`}>
                  {q.type === 'quiz' ? '🔤 Trắc nghiệm' : '📝 Văn bản'}
                </span>
              </div>

              {q.type === 'quiz' && q.quizQuestion && (
                <p className="font-semibold text-[#082F49] text-sm">{q.quizQuestion}</p>
              )}
              {q.type === 'text' && q.description && (
                <div className="prose prose-sm max-w-none text-[#334155] text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.description) }} />
              )}

              {q.type === 'quiz' && (
                <div className="space-y-2">
                  {q.quizOptions?.map((opt, j) => {
                    const isSelected = Number(ans?.answer) === j;
                    const isCorrect  = j === q.quizCorrectIndex;
                    return (
                      <div key={j} className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] border-2 text-sm font-semibold
                        ${isSelected && isCorrect   ? 'bg-emerald-100 border-emerald-400 text-emerald-700' : ''}
                        ${isSelected && !isCorrect  ? 'bg-red-100 border-red-400 text-red-700'            : ''}
                        ${!isSelected && isCorrect  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : ''}
                        ${!isSelected && !isCorrect ? 'bg-slate-50 border-slate-200 text-[#334155]'       : ''}`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
                          ${isSelected ? (isCorrect ? 'bg-emerald-400 text-white' : 'bg-red-400 text-white') : 'bg-slate-200 text-[#334155]'}`}>
                          {String.fromCharCode(65 + j)}
                        </span>
                        {opt}
                        {isSelected && (isCorrect ? <FaCheckCircle className="ml-auto text-emerald-500" /> : <FaTimesCircle className="ml-auto text-red-500" />)}
                        {!isSelected && isCorrect && <span className="ml-auto text-xs text-emerald-600">✓ Đúng</span>}
                      </div>
                    );
                  })}
                  <p className={`text-xs font-bold ${isQuizCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isQuizCorrect ? '✅ Trả lời đúng!' : '❌ Trả lời sai'}
                  </p>
                </div>
              )}

              {q.type === 'text' && (
                <div>
                  <p className="text-xs font-bold text-[#94A3B8] mb-2">Câu trả lời của bạn:</p>
                  <div className="bg-slate-50 rounded-[12px] px-4 py-3 text-sm text-[#334155] whitespace-pre-wrap border border-slate-200">
                    {ans?.answer || <span className="text-[#94A3B8] italic">Không trả lời</span>}
                  </div>
                  {ans?.textScore !== undefined && (
                    <p className="text-xs font-bold text-emerald-600 mt-2">
                      📊 Điểm câu này: {ans.textScore}/10
                    </p>
                  )}
                  {ans?.textScore === undefined && (
                    <p className="text-xs text-[#94A3B8] mt-2">⏳ Giáo viên chưa chấm điểm câu này</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {mySub.fullyGraded && mySub.totalScore !== undefined && (
          <div className="rounded-[20px] p-5 text-center"
            style={{ ...GLASS, background: 'rgba(187,247,208,0.5)', border: '1px solid rgba(167,243,208,0.8)' }}>
            <p className="text-4xl font-black text-emerald-600">{mySub.totalScore}/10</p>
            <p className="text-emerald-700 font-bold text-sm mt-1">Tổng điểm bài tập</p>
            <p className="text-emerald-600 text-xs mt-1">
              Chấm lúc {mySub.gradedAt ? new Date(mySub.gradedAt).toLocaleString('vi-VN') : '—'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Unanswered form
  return (
    <div className="space-y-4">
      {deadline && (
        <div className={`rounded-[16px] px-4 py-3 flex items-center gap-2 text-sm font-semibold
          ${deadline.urgent
            ? 'bg-red-50 border border-red-200 text-red-600'
            : 'bg-amber-50 border border-amber-200 text-amber-700'}`}>
          <FaClock className="shrink-0" /> {deadline.label}
        </div>
      )}

      {error && (
        <div className="rounded-[16px] px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
          {error}
        </div>
      )}

      {assignment.questions.map((q, i) => (
        <div key={i} className="rounded-[20px] p-5 space-y-3" style={GLASS}>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0
              ${q.type === 'quiz' ? 'bg-violet-100 text-violet-600' : 'bg-cyan-100 text-cyan-600'}`}>
              {i + 1}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full
              ${q.type === 'quiz' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-cyan-600'}`}>
              {q.type === 'quiz' ? '🔤 Trắc nghiệm' : '📝 Văn bản'}
            </span>
          </div>

          {q.type === 'quiz' && q.quizQuestion && (
            <p className="font-semibold text-[#082F49] text-sm">{q.quizQuestion}</p>
          )}
          {q.type === 'text' && q.description && (
            <div className="prose prose-sm max-w-none text-[#334155] text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.description) }} />
          )}

          {q.type === 'quiz' && (
            <div className="space-y-2">
              {q.quizOptions?.map((opt, j) => {
                const selected = answers[i] === String(j);
                return (
                  <button key={j} type="button"
                    onClick={() => setAnswers(prev => ({ ...prev, [i]: String(j) }))}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] border-2 text-sm
                      font-semibold text-left transition-all
                      ${selected
                        ? 'border-violet-400 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white hover:border-violet-200 text-[#334155]'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs
                      font-black shrink-0 transition-all
                      ${selected ? 'bg-violet-400 text-white' : 'bg-slate-100 text-[#334155]'}`}>
                      {String.fromCharCode(65 + j)}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === 'text' && (
            <textarea
              rows={4}
              value={answers[i] ?? ''}
              onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
              className={inputCls + ' resize-none'}
              placeholder="Viết câu trả lời của bạn ở đây..."
            />
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-3.5 rounded-[16px] bg-gradient-to-r from-emerald-500 to-cyan-500
          text-white font-black text-sm hover:from-emerald-400 hover:to-cyan-400 transition-all
          flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg
          shadow-emerald-500/25">
        {submitting ? <><FaSpinner className="animate-spin" /> Đang nộp…</> : <>✅ Nộp bài tập</>}
      </button>
    </div>
  );
}

// ─── Teacher view ───────────────────────────────────────────────────────────────

function TeacherView({
  assignment,
  classId,
  onGraded,
}: {
  assignment: AssignmentDetail;
  classId: string;
  onGraded: (userId: string, questionIdx: number, textScore: number) => void;
}) {
  const textQs   = assignment.questions.map((q, i) => ({ q, i })).filter(x => x.q.type === 'text');
  const [expanded, setExpanded]       = useState<Record<string, boolean>>({});
  const [textScores, setTextScores]   = useState<Record<string, Record<number, string>>>({});
  const [saving, setSaving]           = useState<string | null>(null);
  const [toast, setToast]             = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSaveGrade = async (userId: string, questionIdx: number) => {
    const raw = textScores[userId]?.[questionIdx];
    if (raw === undefined) return;
    const score = Number(raw);
    if (isNaN(score) || score < 0 || score > 10) { showToast('Điểm phải từ 0 – 10'); return; }
    setSaving(`${userId}-${questionIdx}`);
    const res  = await fetch(`/api/homeclass/${classId}/assignments/${assignment._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, questionIdx, textScore: score }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) { showToast(data.error || 'Lưu điểm thất bại'); return; }
    onGraded(userId, questionIdx, score);
    showToast(`✅ Đã lưu điểm câu ${questionIdx + 1}!`);
  };

  // Correct rate for quiz questions
  const quizStats = assignment.questions.map((q, i) => {
    if (q.type !== 'quiz') return null;
    const answered = assignment.submissions.filter(s => s.answers.find(a => a.questionIdx === i)?.answer !== undefined);
    const correct  = answered.filter(s => Number(s.answers.find(a => a.questionIdx === i)?.answer) === q.quizCorrectIndex);
    return { i, total: answered.length, correct: correct.length };
  });

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] px-4 py-3 rounded-[16px] bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-sm shadow-lg transition-all">
          {toast}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-[16px] p-4 text-center" style={GLASS}>
          <p className="text-2xl font-black text-[#082F49]">{assignment.submissions.length}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Đã nộp</p>
        </div>
        <div className="rounded-[16px] p-4 text-center" style={GLASS}>
          <p className="text-2xl font-black text-emerald-600">{assignment.submissions.filter(s => s.fullyGraded).length}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Đã chấm xong</p>
        </div>
        <div className="rounded-[16px] p-4 text-center" style={GLASS}>
          <p className="text-2xl font-black text-cyan-600">{assignment.questions.length}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Câu hỏi</p>
        </div>
      </div>

      {/* Quiz stats */}
      {quizStats.filter(Boolean).length > 0 && (
        <div className="rounded-[20px] p-5 space-y-3" style={GLASS}>
          <p className="font-black text-[#082F49] text-sm">📊 Tỉ lệ đúng trắc nghiệm</p>
          {quizStats.filter(Boolean).map(stat => stat && (
            <div key={stat.i} className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#94A3B8] w-16 shrink-0">Câu {stat.i + 1}</span>
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all"
                  style={{ width: stat.total ? `${Math.round(stat.correct * 100 / stat.total)}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-bold text-[#334155] shrink-0 w-14 text-right">
                {stat.correct}/{stat.total} ({stat.total ? Math.round(stat.correct * 100 / stat.total) : 0}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* No submissions yet */}
      {assignment.submissions.length === 0 && (
        <div className="rounded-[24px] p-10 flex flex-col items-center gap-3 text-center" style={GLASS}>
          <span className="text-5xl">📭</span>
          <p className="font-bold text-[#082F49]">Chưa có học sinh nào nộp bài</p>
        </div>
      )}

      {/* Per-student submissions */}
      {assignment.submissions.map(sub => {
        const isOpen     = expanded[sub.userId] ?? false;
        // Compute running score with current textScores state
        const mergedAnswers: { questionIdx: number; answer?: string; textScore?: number }[] = sub.answers.map(a => ({
          ...a,
          textScore: textScores[sub.userId]?.[a.questionIdx] !== undefined
            ? Number(textScores[sub.userId][a.questionIdx])
            : a.textScore,
        }));
        // Also add any newly entered scores for questions without existing answers
        textQs.forEach(({ i }) => {
          if (!mergedAnswers.find(a => a.questionIdx === i)) {
            const s = textScores[sub.userId]?.[i];
            if (s !== undefined) mergedAnswers.push({ questionIdx: i, textScore: Number(s) });
          }
        });
        const { totalScore, fullyGraded } = computeScore(assignment.questions, mergedAnswers);

        return (
          <div key={sub.userId} className="rounded-[20px] overflow-hidden" style={GLASS}>
            {/* Header row */}
            <button
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50/50 transition-all"
              onClick={() => setExpanded(prev => ({ ...prev, [sub.userId]: !isOpen }))}>
              <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-violet-400 to-purple-500
                flex items-center justify-center text-white text-xs font-black shrink-0">
                {sub.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#082F49] text-sm">{sub.username}</p>
                <p className="text-[#94A3B8] text-xs">
                  Nộp {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                </p>
              </div>
              {/* Score chip */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-black border
                ${fullyGraded
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-amber-100 border-amber-300 text-amber-700'}`}>
                {fullyGraded ? `${totalScore}/10` : textQs.length > 0 ? 'Chưa chấm' : `${totalScore}/10`}
              </div>
              {isOpen ? <FaChevronUp className="text-[#94A3B8] shrink-0" /> : <FaChevronDown className="text-[#94A3B8] shrink-0" />}
            </button>

            {/* Expanded answers */}
            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {assignment.questions.map((q, i) => {
                  const ans     = sub.answers.find(a => a.questionIdx === i);
                  const isRight = q.type === 'quiz' && Number(ans?.answer) === q.quizCorrectIndex;
                  const localScore = textScores[sub.userId]?.[i];

                  return (
                    <div key={i} className="px-5 py-4 space-y-2">
                      {/* Question label */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                          ${q.type === 'quiz' ? 'bg-violet-50 text-violet-600' : 'bg-cyan-50 text-cyan-600'}`}>
                          Câu {i + 1} – {q.type === 'quiz' ? 'Trắc nghiệm' : 'Văn bản'}
                        </span>
                        {q.type === 'quiz' && (
                          isRight
                            ? <span className="text-xs font-bold text-emerald-600">✅ Đúng</span>
                            : <span className="text-xs font-bold text-red-500">❌ Sai</span>
                        )}
                      </div>

                      {/* Question prompt */}
                      {q.type === 'quiz' && q.quizQuestion && (
                        <p className="text-xs text-[#334155] font-semibold">{q.quizQuestion}</p>
                      )}
                      {q.type === 'text' && q.description && (
                        <div className="text-xs text-[#94A3B8] leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.description.replace(/<img[^>]*>/gi, '🖼️')) }} />
                      )}

                      {/* Answer */}
                      {q.type === 'quiz' && (
                        <div className="space-y-1.5">
                          {q.quizOptions?.map((opt, j) => {
                            const isSelected = Number(ans?.answer) === j;
                            const isCorrect  = j === q.quizCorrectIndex;
                            return (
                              <div key={j} className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold
                                ${isCorrect  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : ''}
                                ${isSelected && !isCorrect ? 'bg-red-50 border border-red-200 text-red-600' : ''}
                                ${!isCorrect && !isSelected ? 'bg-slate-50 border border-slate-100 text-[#94A3B8]' : ''}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0
                                  ${isSelected ? (isCorrect ? 'bg-emerald-400 text-white' : 'bg-red-400 text-white') : 'bg-slate-100 text-[#94A3B8]'}`}>
                                  {String.fromCharCode(65 + j)}
                                </span>
                                {opt}
                                {isSelected && <span className="ml-auto">{isCorrect ? '✓' : '✗'}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'text' && (
                        <div className="space-y-2">
                          <div className="bg-slate-50 rounded-[12px] px-4 py-3 text-sm text-[#334155] whitespace-pre-wrap border border-slate-200 min-h-[60px]">
                            {ans?.answer || <span className="text-[#94A3B8] italic text-xs">Không có câu trả lời</span>}
                          </div>
                          {/* Score input */}
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-[#334155] shrink-0">Điểm:</label>
                            <input
                              type="number" min={0} max={10} step={1}
                              value={localScore !== undefined ? localScore : (ans?.textScore !== undefined ? String(ans.textScore) : '')}
                              onChange={e => setTextScores(prev => ({
                                ...prev,
                                [sub.userId]: { ...prev[sub.userId], [i]: e.target.value },
                              }))}
                              className="w-20 rounded-[10px] border-2 border-slate-200 focus:border-cyan-400 bg-white px-3 py-1.5 text-sm text-center font-bold text-[#082F49] outline-none transition-all"
                              placeholder="0-10"
                            />
                            <span className="text-xs text-[#94A3B8]">/ 10</span>
                            <button
                              onClick={() => handleSaveGrade(sub.userId, i)}
                              disabled={saving === `${sub.userId}-${i}` || localScore === undefined}
                              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[10px]
                                bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold
                                hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50">
                              {saving === `${sub.userId}-${i}` ? <FaSpinner className="animate-spin text-[10px]" /> : <FaSave className="text-[10px]" />}
                              Lưu
                            </button>
                            {ans?.textScore !== undefined && localScore === undefined && (
                              <span className="text-xs text-emerald-600 font-semibold">✓ {ans.textScore}/10</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Running total */}
                <div className="px-5 py-4 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#334155]">
                    {fullyGraded ? '🏆 Tổng điểm:' : '⏳ Điểm tạm tính:'}
                  </span>
                  <span className={`text-2xl font-black ${fullyGraded ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {totalScore}/10
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

interface Props {
  classId: string;
  assignmentId: string;
}

export default function AssignmentDetailPage({ classId, assignmentId }: Props) {
  const router             = useRouter();
  const { data: session }  = useSession();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isTeacher, setIsTeacher]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const userId = (session?.user as { id?: string } | null)?.id ?? '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/homeclass/${classId}/assignments/${assignmentId}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Không thể tải bài tập'); return; }
      setAssignment(data.assignment);
      setIsTeacher(data.isTeacher);
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [classId, assignmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmitted = useCallback((sub: Submission) => {
    setAssignment(prev => prev ? { ...prev, submissions: [...prev.submissions, sub] } : prev);
  }, []);

  const handleGraded = useCallback((userId: string, questionIdx: number, textScore: number) => {
    setAssignment(prev => {
      if (!prev) return prev;
      const subs = prev.submissions.map(s => {
        if (s.userId !== userId) return s;
        const answers = s.answers.map(a => a.questionIdx === questionIdx ? { ...a, textScore } : a);
        if (!answers.find(a => a.questionIdx === questionIdx)) answers.push({ questionIdx, textScore });
        const { totalScore, fullyGraded } = computeScore(prev.questions, answers);
        return { ...s, answers, totalScore, fullyGraded, gradedAt: fullyGraded ? new Date().toISOString() : s.gradedAt };
      });
      return { ...prev, submissions: subs };
    });
  }, []);

  const deadline  = assignment?.dueDate ? timeUntil(assignment.dueDate) : null;
  const quizCount = assignment ? assignment.questions.filter(q => q.type === 'quiz').length : 0;
  const textCount = assignment ? assignment.questions.filter(q => q.type === 'text').length : 0;

  // ── Mesh gradient background ──
  const bgStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 20% 20%, #E0F2FE 0%, transparent 50%), radial-gradient(circle at 80% 80%, #DCFCE7 0%, transparent 50%), #FFFFFF',
  };

  if (loading) return (
    <div style={bgStyle} className="flex items-center justify-center">
      <FaSpinner className="animate-spin text-cyan-400 text-3xl" />
    </div>
  );

  if (error || !assignment) return (
    <div style={bgStyle} className="flex flex-col items-center justify-center gap-4 p-8">
      <span className="text-5xl">😕</span>
      <p className="font-bold text-[#082F49] text-lg">{error || 'Không tìm thấy bài tập'}</p>
      <button onClick={() => router.back()}
        className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-cyan-500 text-white font-bold text-sm">
        <FaArrowLeft /> Quay lại
      </button>
    </div>
  );

  return (
    <div style={bgStyle} className="font-[Nunito,Quicksand,sans-serif]">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-12 space-y-5">
        {/* Back button */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold text-sm
            transition-colors group">
          <span className="w-8 h-8 rounded-[10px] bg-white/75 backdrop-blur-[20px] border border-white
            group-hover:bg-white flex items-center justify-center transition-all">
            <FaArrowLeft className="text-xs" />
          </span>
          Quay lại lớp học
        </button>

        {/* Assignment header */}
        <div className="rounded-[24px] p-6 space-y-3" style={GLASS}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl shrink-0
              bg-gradient-to-br ${quizCount > 0 && textCount === 0 ? 'from-violet-400 to-fuchsia-500' : textCount > 0 && quizCount === 0 ? 'from-emerald-400 to-cyan-500' : 'from-amber-400 to-orange-500'}`}>
              {quizCount > 0 && textCount === 0 ? '🔤' : textCount > 0 && quizCount === 0 ? '📝' : '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-black text-[#082F49] text-xl">{assignment.title}</h1>
              <p className="text-[#94A3B8] text-sm mt-1">
                {assignment.questions.length} câu hỏi
                {quizCount > 0 && textCount > 0 && ` · ${quizCount} TN + ${textCount} VB`}
                {quizCount > 0 && textCount === 0 && ' trắc nghiệm'}
                {textCount > 0 && quizCount === 0 && ' văn bản'}
              </p>
            </div>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            {deadline && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                ${deadline.urgent
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                <FaClock className="text-[10px]" /> {deadline.label}
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
              <FaStar className="text-[10px]" /> +{assignment.expReward} EXP
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-[#334155] border border-slate-200">
              📤 {assignment.submissions.length} đã nộp
            </span>
          </div>

          {/* Max score info */}
          {textCount > 0 && (
            <p className="text-xs text-[#94A3B8] leading-relaxed bg-slate-50 rounded-[12px] px-3 py-2">
              💡 Tổng điểm tối đa <strong>10 điểm</strong>.
              {quizCount > 0 && ` Trắc nghiệm tự chấm, văn bản do giáo viên cho điểm.`}
              {quizCount === 0 && ` Giáo viên sẽ chấm từng câu văn bản.`}
            </p>
          )}
        </div>

        {/* Main content */}
        {isTeacher ? (
          <TeacherView
            assignment={assignment}
            classId={classId}
            onGraded={handleGraded}
          />
        ) : (
          <StudentView
            assignment={assignment}
            userId={userId}
            classId={classId}
            onSubmitted={handleSubmitted}
          />
        )}
      </div>
    </div>
  );
}
