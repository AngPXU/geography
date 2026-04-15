'use client';

import { useState, useCallback } from 'react';
import { FaTimes, FaPlus, FaTrash, FaCode, FaList, FaChevronDown, FaChevronUp, FaEye, FaSave, FaCheckCircle } from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuizQuestion {
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  image?: string;
}

interface Props {
  onClose: () => void;
  onSaved: (questions: QuizQuestion[], duration: number) => void;
  initialQuestions?: QuizQuestion[];
  initialDuration?: number;
}

// ─── Sample + format hint ─────────────────────────────────────────────────────

const SAMPLE_JSON = JSON.stringify(
  [
    {
      question: 'Thủ đô của Việt Nam là gì?',
      options: { A: 'TP. Hồ Chí Minh', B: 'Hà Nội', C: 'Đà Nẵng', D: 'Huế' },
      correct: 'B',
    },
    {
      question: 'Sông nào dài nhất Việt Nam?',
      options: { A: 'Sông Mekong', B: 'Sông Đà', C: 'Sông Hồng', D: 'Sông Mã' },
      correct: 'A',
    },
  ],
  null,
  2,
);

const EMPTY_QUESTION: QuizQuestion = {
  question: '',
  options: { A: '', B: '', C: '', D: '' },
  correct: 'A',
};

const OPTION_LABELS: ['A', 'B', 'C', 'D'] = ['A', 'B', 'C', 'D'];
const OPTION_COLORS: Record<string, string> = {
  A: 'border-red-300 bg-red-50 text-red-700',
  B: 'border-blue-300 bg-blue-50 text-blue-700',
  C: 'border-amber-300 bg-amber-50 text-amber-700',
  D: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]',
};

// ─── QuizCreator ──────────────────────────────────────────────────────────────

export function QuizCreator({ onClose, onSaved, initialQuestions, initialDuration }: Props) {
  const [tab, setTab] = useState<'json' | 'manual' | 'review'>('manual');
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [{ ...EMPTY_QUESTION }],
  );
  const [questionDuration, setQuestionDuration] = useState(initialDuration ?? 10);
  const [expandedIdx, setExpandedIdx] = useState<number>(0);

  // ── JSON parsing ─────────────────────────────────────────────────────────
  function handleJsonChange(val: string) {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setJsonError('Cần là một mảng JSON có ít nhất 1 câu hỏi');
        return;
      }
      for (const q of parsed) {
        if (!q.question || !q.options?.A || !q.options?.B || !q.options?.C || !q.options?.D || !q.correct) {
          setJsonError('Mỗi câu hỏi cần: question, options (A/B/C/D), correct');
          return;
        }
      }
      setJsonError(null);
    } catch {
      setJsonError('JSON không hợp lệ');
    }
  }

  // ── Manual editor ────────────────────────────────────────────────────────
  function updateQuestion(idx: number, patch: Partial<QuizQuestion>) {
    setQuestions((qs) => qs.map((q, i) => i === idx ? { ...q, ...patch } : q));
  }

  function updateOption(idx: number, opt: 'A' | 'B' | 'C' | 'D', value: string) {
    setQuestions((qs) => qs.map((q, i) =>
      i === idx ? { ...q, options: { ...q.options, [opt]: value } } : q,
    ));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, { ...EMPTY_QUESTION, options: { A: '', B: '', C: '', D: '' } }]);
    setExpandedIdx(questions.length);
  }

  function removeQuestion(idx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== idx));
    setExpandedIdx(Math.max(0, expandedIdx - 1));
  }

  // ── Validate manual ──────────────────────────────────────────────────────
  const manualValid = useCallback(() => {
    return questions.every((q) =>
      q.question.trim() && q.options.A.trim() && q.options.B.trim() &&
      q.options.C.trim() && q.options.D.trim(),
    );
  }, [questions]);

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    let finalQuestions: QuizQuestion[];
    if (tab === 'json') {
      try {
        finalQuestions = JSON.parse(jsonText);
        if (!Array.isArray(finalQuestions) || finalQuestions.length === 0) return;
      } catch { return; }
    } else {
      if (!manualValid()) return;
      finalQuestions = questions;
    }
    onSaved(finalQuestions, questionDuration);
  }

  const canSave = tab === 'json' ? (!jsonError && jsonText.trim().length > 2) : manualValid();
  const questionCount = tab === 'json'
    ? (() => { try { return JSON.parse(jsonText).length; } catch { return 0; } })()
    : questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
           style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#06B6D4] text-lg">❓</div>
            <div>
              <p className="font-bold text-[#082F49] text-base">Tạo câu hỏi Quiz</p>
              <p className="text-[10px] text-[#94A3B8]">ABCD · Lưu để bắt đầu khi sẵn sàng</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-[#94A3B8] hover:text-[#334155] hover:bg-gray-200 transition-all">
            <FaTimes size={13} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 gap-1 pt-3">
          {(['manual', 'json', 'review'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-xs font-semibold transition-all duration-200 ${
                tab === t ? 'bg-[#E0F2FE] text-[#06B6D4] border-b-2 border-[#06B6D4]' : 'text-[#94A3B8] hover:text-[#334155]'
              }`}>
              {t === 'manual' ? <><FaList size={10} /> Nhập thủ công</>
               : t === 'json' ? <><FaCode size={10} /> Nhập JSON</>
               : <><FaEye size={10} /> Xem lại{questions.length > 0 && initialQuestions === undefined || questions.length > 1 || questions[0]?.question ? <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#E0F2FE] text-[9px]">{questions.length}</span> : null}</>}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Review tab ── */}
          {tab === 'review' && (
            <div className="p-6 flex flex-col gap-3">
              {questions.length === 0 || (questions.length === 1 && !questions[0].question.trim()) ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <FaEye size={28} className="text-gray-200" />
                  <p className="text-sm text-[#94A3B8]">Chưa có câu hỏi nào…</p>
                  <p className="text-xs text-[#CBD5E1]">Nhập thủ công hoặc dán JSON để tạo câu hỏi</p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-start gap-3 px-4 py-3 bg-[#F8FAFC]">
                      <span className="w-6 h-6 rounded-lg bg-[#06B6D4] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                      <p className="text-sm font-semibold text-[#082F49] leading-snug">{q.question || <span className="text-[#94A3B8] italic">Chưa nhập</span>}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-gray-100">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <div key={opt} className={`flex items-center gap-2 px-4 py-2.5 text-xs ${
                          q.correct === opt ? 'bg-[#DCFCE7]' : 'bg-white'
                        }`}>
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 ${
                            q.correct === opt ? 'bg-[#22C55E] text-white' : 'bg-gray-100 text-[#94A3B8]'
                          }`}>{opt}</span>
                          <span className={q.correct === opt ? 'font-bold text-[#16A34A]' : 'text-[#334155]'}>{q.options[opt] || <em className="text-[#CBD5E1]">Trống</em>}</span>
                          {q.correct === opt && <FaCheckCircle size={9} className="text-[#22C55E] ml-auto flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* ── Review tab ── */}
          {tab === 'review' && (
            <div className="p-6 flex flex-col gap-3">
              {questions.length === 0 || (questions.length === 1 && !questions[0].question.trim()) ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <FaEye size={28} className="text-gray-200" />
                  <p className="text-sm text-[#94A3B8]">Chưa có câu hỏi nào...</p>
                  <p className="text-xs text-[#CBD5E1]">Nhập thủ công hoặc dán JSON để tạo câu hỏi</p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={idx} className="rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-start gap-3 px-4 py-3 bg-[#F8FAFC]">
                      <span className="w-6 h-6 rounded-lg bg-[#06B6D4] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                      <p className="text-sm font-semibold text-[#082F49] leading-snug">{q.question || <span className="text-[#94A3B8] italic">Chưa nhập</span>}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-gray-100">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <div key={opt} className={`flex items-center gap-2 px-4 py-2.5 text-xs ${
                          q.correct === opt ? 'bg-[#DCFCE7]' : 'bg-white'
                        }`}>
                          <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-extrabold flex-shrink-0 ${
                            q.correct === opt ? 'bg-[#22C55E] text-white' : 'bg-gray-100 text-[#94A3B8]'
                          }`}>{opt}</span>
                          <span className={q.correct === opt ? 'font-bold text-[#16A34A]' : 'text-[#334155]'}>
                            {q.options[opt] || <em className="text-[#CBD5E1]">Trống</em>}
                          </span>
                          {q.correct === opt && <FaCheckCircle size={9} className="text-[#22C55E] ml-auto flex-shrink-0" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {/* ── JSON tab ── */}
          {tab === 'json' && (
            <div className="p-6 flex flex-col gap-4">
              <div className="p-3 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] text-xs text-[#0369A1]">
                <p className="font-bold mb-1">📋 Định dạng JSON (tương thích với AI)</p>
                <p>Mỗi câu hỏi: <code className="bg-white px-1 rounded">question, options (A/B/C/D), correct</code></p>
                <p className="mt-1 text-[#94A3B8]">Bạn có thể yêu cầu AI tạo câu hỏi theo đúng định dạng này.</p>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={14}
                className="w-full rounded-2xl px-4 py-3 text-xs font-mono bg-[#F8FAFC] border border-[#BAE6FD] text-[#082F49] focus:outline-none focus:border-[#06B6D4] resize-none"
                placeholder="Dán JSON câu hỏi vào đây..."
                spellCheck={false}
              />
              {jsonError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <span>⚠️</span> {jsonError}
                </p>
              )}
              {!jsonError && jsonText.trim().length > 2 && (
                <p className="text-xs text-[#22C55E] font-semibold">
                  ✓ JSON hợp lệ · {(() => { try { return JSON.parse(jsonText).length; } catch { return 0; } })()} câu hỏi
                </p>
              )}
            </div>
          )}

          {/* ── Manual tab ── */}
          {tab === 'manual' && (
            <div className="p-6 flex flex-col gap-3">
              {questions.map((q, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Question header (collapsible) */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] hover:bg-[#F0F9FF] transition-colors"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? -1 : idx)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#E0F2FE] text-[#06B6D4] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-[#334155] truncate text-left">
                        {q.question.trim() || <span className="text-[#94A3B8] italic">Câu hỏi chưa nhập...</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {questions.length > 1 && (
                        <span onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                          className="w-6 h-6 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <FaTrash size={9} />
                        </span>
                      )}
                      {expandedIdx === idx ? <FaChevronUp size={10} className="text-[#94A3B8]" /> : <FaChevronDown size={10} className="text-[#94A3B8]" />}
                    </div>
                  </button>

                  {/* Expanded form */}
                  {expandedIdx === idx && (
                    <div className="p-4 flex flex-col gap-3 bg-white">
                      <textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                        rows={2}
                        placeholder="Nội dung câu hỏi..."
                        className="w-full rounded-xl px-3 py-2 text-sm border border-[#BAE6FD] text-[#082F49] placeholder-[#94A3B8] focus:outline-none focus:border-[#06B6D4] resize-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {OPTION_LABELS.map((opt) => (
                          <div key={opt} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${OPTION_COLORS[opt]}`}>
                            <span className="font-bold text-xs flex-shrink-0">{opt}</span>
                            <input
                              type="text"
                              value={q.options[opt]}
                              onChange={(e) => updateOption(idx, opt, e.target.value)}
                              placeholder={`Đáp án ${opt}...`}
                              className="flex-1 bg-transparent text-xs focus:outline-none placeholder-current placeholder-opacity-50"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-[#334155]">Đáp án đúng:</p>
                        {OPTION_LABELS.map((opt) => (
                          <button key={opt}
                            onClick={() => updateQuestion(idx, { correct: opt })}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all duration-200 ${
                              q.correct === opt
                                ? 'bg-[#22C55E] text-white shadow-md'
                                : 'bg-gray-100 text-[#94A3B8] hover:bg-gray-200'
                            }`}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button onClick={addQuestion}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-[#BAE6FD] text-[#06B6D4] text-xs font-semibold hover:bg-[#F0F9FF] transition-all duration-200">
                <FaPlus size={10} /> Thêm câu hỏi
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <p className="text-xs text-[#94A3B8] font-medium">Thời gian/câu:</p>
            <div className="flex items-center gap-1">
              {[5, 10, 15, 20, 30].map((s) => (
                <button key={s} onClick={() => setQuestionDuration(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    questionDuration === s ? 'bg-[#06B6D4] text-white' : 'bg-gray-100 text-[#94A3B8] hover:bg-gray-200'
                  }`}>
                  {s}s
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#22C55E] text-white text-sm font-bold hover:bg-[#4ADE80] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md"
          >
            <FaSave size={11} />
            {`Lưu câu hỏi (${questionCount} câu)`}
          </button>
        </div>
      </div>
    </div>
  );
}
