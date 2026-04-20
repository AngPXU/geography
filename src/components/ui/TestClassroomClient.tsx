'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaPlus, FaArrowLeft, FaTimes, FaSpinner, FaEdit, FaTrash, FaCheckCircle, FaFileCode, FaPlay, FaChevronLeft, FaChevronRight, FaEye, FaEyeSlash, FaRandom
} from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  _id?: string;
  type: 'text' | 'quiz';
  description?: string;
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectIndex?: number;
}

interface OldTest {
  _id: string;
  title: string;
  subject?: string;
  grade?: number;
  description?: string;
  authorId: string;
  authorName: string;
  questions: Question[];
  createdAt: string;
}

interface UserProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls = 'w-full px-4 py-2.5 rounded-[16px] text-sm text-[#082F49] placeholder-[#94A3B8] bg-white/80 border border-[#BAE6FD] focus:outline-none focus:border-[var(--tw-ring-color)] focus:ring-2 focus:ring-[#06B6D4]/30 transition-all duration-300';

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[14px] text-sm font-bold shadow-lg border transition-all ${type === 'success' ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]' : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
      }`}>
      {msg}
    </div>
  );
}

// Hàm format ngày giờ
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}


// ─── Create Test Modal ────────────────────────────────────────────────────────

function CreateTestModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (created: OldTest) => void;
}) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Địa lí');
  const [grade, setGrade] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Tên bài kiểm tra không được để trống'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/old-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        subject: subject.trim(),
        grade: grade ? Number(grade) : undefined,
        description: desc.trim(),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Tạo thất bại'); return; }
    onCreate(data.test);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-[24px] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', border: '1px solid white' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50">
          <h2 className="font-black text-[#082F49] text-lg">📝 Tạo bài kiểm tra mới</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"><FaTimes className="text-xs text-slate-500" /></button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm font-semibold px-4 py-3 bg-red-50 rounded-[12px] border border-red-200">{error}</p>}
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Tiêu đề bài kiểm tra *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Ví dụ: Kiểm tra 15 phút Bài 1..." />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[#334155] mb-1.5">Môn học</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} />
            </div>
            <div className="w-24">
              <label className="block text-xs font-bold text-[#334155] mb-1.5">Khối lớp</label>
              <input type="number" min={1} max={12} value={grade} onChange={e => setGrade(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Mô tả thêm</label>
            <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} className={inputCls + ' resize-none'} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-[14px] border border-slate-200 text-sm font-bold text-[#334155] hover:bg-slate-50">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
              {saving && <FaSpinner className="animate-spin text-xs" />} Tạo mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Question Builder (Tương tự HomeClassClient nhưng có thêm JSON) ──────────

interface QEntry {
  id: string;
  type: 'text' | 'quiz';
  description: string;
  quizQuestion: string;
  quizOptions: [string, string, string, string];
  quizCorrectIndex: number;
}
const mkQEntry = (): QEntry => ({
  id: Math.random().toString(36).slice(2),
  type: 'quiz', description: '', quizQuestion: '',
  quizOptions: ['', '', '', ''], quizCorrectIndex: 0,
});

function EditContentModal({ test, onClose, onSaved }: {
  test: OldTest;
  onClose: () => void;
  onSaved: (updated: OldTest) => void;
}) {
  const [entries, setEntries] = useState<QEntry[]>(() =>
    test.questions.map(q => ({
      id: Math.random().toString(36).slice(2),
      type: q.type,
      description: q.description || '',
      quizQuestion: q.quizQuestion || '',
      quizOptions: (q.quizOptions as [string, string, string, string]) || ['', '', '', ''],
      quizCorrectIndex: q.quizCorrectIndex ?? 0,
    }))
  );
  if (entries.length === 0) entries.push(mkQEntry());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const handleJSONImport = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) throw new Error('Cần là một mảng JSON.');
      const newEntries: QEntry[] = parsed.map((item: any) => ({
        id: Math.random().toString(36).slice(2),
        type: item.type === 'text' ? 'text' : 'quiz',
        description: item.description || '',
        quizQuestion: item.quizQuestion || item.question || '',
        quizOptions: Array.isArray(item.quizOptions) && item.quizOptions.length === 4
          ? item.quizOptions
          : Array.isArray(item.options) && item.options.length >= 4 ? item.options.slice(0, 4) : ['', '', '', ''],
        quizCorrectIndex: typeof item.quizCorrectIndex === 'number' ? item.quizCorrectIndex
          : typeof item.correctIndex === 'number' ? item.correctIndex : 0,
      }));
      setEntries(prev => [...prev, ...newEntries]);
      setShowJsonInput(false);
      setJsonText('');
    } catch (e: any) {
      setError('Lỗi phân tích JSON: ' + e.message);
    }
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (entries.some(en => en.type === 'quiz' && !en.quizQuestion.trim())) {
      setError('Câu trắc nghiệm không được để trống'); return;
    }
    setSaving(true); setError('');
    const res = await fetch(`/api/old-tests/${test._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questions: entries.map(en => ({
          type: en.type,
          description: en.type === 'text' ? (en.description || undefined) : undefined,
          quizQuestion: en.type === 'quiz' ? en.quizQuestion.trim() : undefined,
          quizOptions: en.type === 'quiz' ? en.quizOptions : undefined,
          quizCorrectIndex: en.type === 'quiz' ? en.quizCorrectIndex : undefined,
        })),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Lưu thất bại'); return; }
    onSaved(data.test);
  };

  const upd = (id: string, patch: Partial<QEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-3xl rounded-[24px] overflow-hidden max-h-[92vh] flex flex-col bg-white">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50 shrink-0">
          <div>
            <h2 className="font-black text-[#082F49] text-xl">✍️ Chỉnh sửa nội dung: {test.title}</h2>
            <p className="text-emerald-700 text-sm font-semibold mt-0.5">Đang có {entries.length} câu hỏi</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center"><FaTimes className="text-slate-500 text-xs" /></button>
        </div>

        {/* Cửa sổ dán JSON */}
        {showJsonInput && (
          <div className="bg-slate-800 p-4 shrink-0 text-white rounded-t-xl mx-4 mt-4 shadow-xl border border-slate-600">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-emerald-400 text-sm"><FaFileCode className="inline mr-2" />Nhập nhiều câu hỏi bằng JSON array</h3>
              <button onClick={() => setShowJsonInput(false)} className="text-slate-400 hover:text-white"><FaTimes /></button>
            </div>
            <p className="text-xs text-slate-400 mb-2">Định dạng mẫu: <code className="bg-black/30 px-1 rounded text-pink-300">[{`{"question":"Thủ đô VN?","options":["HN","HCM","ST","ĐN"],"correctIndex":0}`}]</code></p>
            <textarea rows={5} value={jsonText} onChange={e => setJsonText(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-emerald-200 outline-none focus:border-emerald-500" placeholder="[{ ... }, { ... }]" />
            <div className="flex justify-end mt-2">
              <button type="button" onClick={handleJSONImport} className="px-4 py-2 bg-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-500 transition">Import JSON</button>
            </div>
          </div>
        )}

        <form onSubmit={handle} className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          {error && <p className="text-red-600 text-sm font-semibold px-4 py-3 bg-red-50 rounded-[12px] border border-red-200">{error}</p>}

          <div className="flex items-center gap-2 mb-4">
            <button type="button" onClick={() => setShowJsonInput(!showJsonInput)} className="px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-black shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2">
              <FaFileCode /> Bulk Import (Dán JSON)
            </button>
            <button type="button" onClick={() => setEntries(prev => validateEntries(prev).concat([mkQEntry()]))} className="px-4 py-2 rounded-xl bg-teal-50 text-teal-700 text-xs font-black shadow-sm hover:bg-teal-100 border border-teal-200 transition-all flex items-center gap-2">
              <FaPlus /> Thêm 1 câu hỏi
            </button>
          </div>

          <div className="space-y-4">
            {entries.map((en, idx) => (
              <div key={en.id} className="rounded-[16px] border-2 border-white shadow-sm bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-[12px] font-black tracking-widest px-3 py-1 bg-slate-100 rounded-lg shadow-inner text-slate-600 uppercase">
                    Câu hỏi số {idx + 1}
                  </span>
                  <button type="button" onClick={() => setEntries(prev => prev.filter(e => e.id !== en.id))} className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 hover:scale-110 transition-all">
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>

                <div className="flex gap-2">
                  {(['quiz', 'text'] as const).map(v => (
                    <button key={v} type="button" onClick={() => upd(en.id, { type: v })} className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${en.type === v ? 'border-emerald-500 bg-emerald-50 shadow-sm text-emerald-800' : 'border-slate-100 bg-slate-50 text-[#94A3B8] hover:bg-slate-100'
                      }`}>
                      {v === 'quiz' ? '✅ Trắc nghiệm ABCD' : '📝 Tự luận / Văn bản'}
                    </button>
                  ))}
                </div>

                {en.type === 'text' && (
                  <textarea rows={3} value={en.description} onChange={e => upd(en.id, { description: e.target.value })} className={inputCls} placeholder="Nhập nội dung văn bản hoặc tự luận..." />
                )}
                {en.type === 'quiz' && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <input value={en.quizQuestion} onChange={e => upd(en.id, { quizQuestion: e.target.value })} className={inputCls + ' font-semibold text-base'} placeholder="Nội dung câu hỏi trắc nghiệm? *" />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {en.quizOptions.map((opt, i) => (
                        <div key={i} className={`flex items-center rounded-[14px] border-2 transition-all ${en.quizCorrectIndex === i ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}>
                          <button type="button" onClick={() => upd(en.id, { quizCorrectIndex: i })} className={`w-10 h-full shrink-0 flex items-center justify-center rounded-l-[12px] text-xs font-black transition-all ${en.quizCorrectIndex === i ? 'bg-emerald-400 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`} title="Chọn làm đáp án đúng">
                            {String.fromCharCode(65 + i)}
                          </button>
                          <input value={opt} onChange={e => { const o = [...en.quizOptions] as [string, string, string, string]; o[i] = e.target.value; upd(en.id, { quizOptions: o }); }} className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder-slate-400" placeholder={`Nhập đáp án...`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </form>

        <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-100 text-[#334155] font-bold hover:bg-slate-200 transition-all">Hủy bỏ</button>
          <button type="button" onClick={handle} disabled={saving} className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50">
            {saving ? <FaSpinner className="animate-spin text-lg" /> : <><FaCheckCircle className="text-lg" /> Lưu toàn bộ {entries.length} câu</>}
          </button>
        </div>

      </div>
    </div>
  );

  function validateEntries(arr: QEntry[]) { return arr; } // dummy call
}

// ─── Presentation Mode (Trình chiếu) ──────────────────────────────────────────

function PresentationModal({ test, onClose }: { test: OldTest; onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selections, setSelections] = useState<Record<number, number>>({});

  const isResultSlide = currentIndex === test.questions.length;
  const q = !isResultSlide ? test.questions[currentIndex] : null;

  const totalSlides = test.questions.length + 1; // +1 cho màn hình Kết Quả

  const quizzes = test.questions.map((q, i) => ({ q, originalIndex: i })).filter(item => item.q.type === 'quiz');
  let correctCount = 0;
  quizzes.forEach(item => {
    if (selections[item.originalIndex] === item.q.quizCorrectIndex) {
      correctCount++;
    }
  });
  const maxScore = 10;
  const scoreExact = quizzes.length > 0 ? (maxScore / quizzes.length) * correctCount : 0;
  const scoreRounded = Math.round(scoreExact);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentIndex(i => (i < totalSlides - 1 ? i + 1 : i));
        setShowAnswer(false);
      }
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(i => (i > 0 ? i - 1 : i));
        setShowAnswer(false);
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  const handleSelectOption = (optIndex: number) => {
    if (showAnswer || selections[currentIndex] !== undefined) return;
    setSelections(s => ({ ...s, [currentIndex]: optIndex }));
  };

  const content = (
    <div className="fixed inset-0 bg-[#FFFFFF] text-[#334155] flex flex-col justify-between select-none animate-in fade-in duration-300 overflow-hidden" style={{ zIndex: 2147483647 }}>

      {/* Mesh Gradient Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vh] rounded-full bg-[#E0F2FE] mix-blend-multiply filter blur-[120px] opacity-90 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vh] rounded-full bg-[#DCFCE7] mix-blend-multiply filter blur-[120px] opacity-90 pointer-events-none"></div>
      <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vh] rounded-full bg-[#E0F2FE] mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-[rgba(255,255,255,0.7)] backdrop-blur-[20px] border-b border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)]">
          <div>
            <h2 className="text-2xl font-black text-[#082F49] tracking-tight">{test.title}</h2>
            {!isResultSlide && (
              <p className="text-[#334155] font-bold text-sm mt-1 uppercase tracking-wider">Câu hỏi {currentIndex + 1} / {test.questions.length}</p>
            )}
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white border-2 border-[#E0F2FE] text-[#082F49] hover:text-white hover:bg-[#DC2626] hover:border-[#DC2626] shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex items-center justify-center transition-all text-xl">
            <FaTimes />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-5xl mx-auto w-full relative">
          {isResultSlide ? (
            <div className="w-full text-center animate-in zoom-in-95 duration-500">
              <h1 className="text-5xl md:text-6xl font-black text-[#082F49] mb-6 drop-shadow-sm">🎉 KẾT QUẢ KIỂM TRA BÀI CŨ</h1>
              <div className="flex justify-center flex-wrap gap-8 my-10">
                <div className="px-12 py-10 rounded-[24px] bg-[rgba(255,255,255,0.75)] backdrop-blur-[20px] border border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex flex-col items-center">
                  <p className="text-[#06B6D4] font-black tracking-widest text-sm uppercase mb-2">ĐIỂM SỐ</p>
                  <p className="text-8xl font-black text-[#082F49]">{scoreRounded}</p>
                  <p className="text-[#94A3B8] font-bold mt-3 text-lg">Chính xác: {scoreExact.toFixed(2)}</p>
                </div>
                <div className="px-12 py-10 rounded-[24px] bg-[rgba(255,255,255,0.75)] backdrop-blur-[20px] border border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex flex-col items-center justify-center min-w-[200px]">
                  <p className="text-[#22C55E] font-black tracking-widest text-sm uppercase mb-2">SỐ CÂU ĐÚNG</p>
                  <p className="text-6xl font-black text-[#082F49]">{correctCount} <span className="text-3xl text-[#94A3B8]">/ {quizzes.length}</span></p>
                </div>
              </div>
              <button onClick={onClose} className="px-10 py-5 rounded-full bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black text-xl transition-all hover:scale-105 shadow-[0_10px_30px_rgba(6,182,212,0.3)]">
                Hoàn thành
              </button>
            </div>
          ) : q?.type === 'text' ? (
            <div className="w-full text-center animate-in slide-in-from-bottom-10 duration-500 p-12 bg-[rgba(255,255,255,0.75)] backdrop-blur-[20px] border border-white shadow-[0_10px_30px_rgba(14,165,233,0.08)] rounded-[24px]">
              <h1 className="text-4xl md:text-5xl font-black text-[#082F49] leading-tight mb-8">📝 Ghi chú / Tự luận</h1>
              <p className="text-2xl text-[#334155] leading-relaxed whitespace-pre-wrap font-semibold">{q.description}</p>
            </div>
          ) : q ? (
            <div className="w-full animate-in slide-in-from-bottom-10 duration-500">
              <h1 className="text-4xl md:text-5xl font-black text-[#082F49] leading-tight mb-12 text-center text-balance drop-shadow-sm">{q.quizQuestion}</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
                {q.quizOptions?.map((opt, i) => {
                  const isCorrect = i === q.quizCorrectIndex;
                  const isSelected = selections[currentIndex] === i;
                  const hasSelectedAny = selections[currentIndex] !== undefined;
                  const isRevealed = showAnswer || hasSelectedAny;

                  let bgCls = 'bg-[rgba(255,255,255,0.9)] backdrop-blur-[20px] border-2 border-white shadow-[0_15px_30px_rgba(14,165,233,0.12)] cursor-pointer hover:shadow-[0_25px_40px_rgba(14,165,233,0.3)] hover:-translate-y-1 hover:border-[#BAE6FD] text-[#082F49]';
                  if (isRevealed) {
                    bgCls = 'bg-[rgba(255,255,255,0.5)] border-2 border-transparent text-[#94A3B8] opacity-60 cursor-default shadow-none';
                    if (isCorrect) {
                      bgCls = 'bg-[#BBF7D0] border-2 border-[#22C55E] text-[#16A34A] scale-[1.03] shadow-[0_20px_40px_rgba(34,197,94,0.3)] z-10 cursor-default font-black';
                    } else if (isSelected && !isCorrect) {
                      bgCls = 'bg-[#FEE2E2] border-2 border-[#DC2626] text-[#DC2626] scale-[1.03] shadow-[0_20px_40px_rgba(220,38,38,0.3)] z-10 cursor-default font-black';
                    }
                  }

                  return (
                    <div key={i} onClick={() => handleSelectOption(i)} className={`px-6 py-6 rounded-[24px] transition-all duration-300 flex items-center gap-5 group ${bgCls}`}>
                      <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl font-black shrink-0 transition-colors shadow-sm ${isRevealed && isCorrect ? 'bg-white text-[#16A34A]' :
                        isRevealed && isSelected && !isCorrect ? 'bg-white text-[#DC2626]' :
                          isRevealed ? 'bg-[rgba(255,255,255,0.5)] text-[#94A3B8]' :
                            'bg-[#E0F2FE] text-[#082F49] group-hover:bg-[#06B6D4] group-hover:text-white border border-[#BAE6FD] group-hover:border-[#06B6D4]'
                        }`}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-2xl font-bold">{opt}</span>
                      {isRevealed && isCorrect && <FaCheckCircle className="ml-auto text-3xl text-[#16A34A]" />}
                      {isRevealed && isSelected && !isCorrect && <FaTimes className="ml-auto text-3xl text-[#DC2626]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Controls */}
        <div className="p-6 bg-[rgba(255,255,255,0.5)] backdrop-blur-[20px] border-t border-white flex items-center justify-between z-10 shadow-[0_-10px_30px_rgba(14,165,233,0.08)]">
          <button onClick={() => { setCurrentIndex(i => i > 0 ? i - 1 : i); setShowAnswer(false); }} disabled={currentIndex === 0} className="px-6 py-3 rounded-[16px] bg-[rgba(255,255,255,0.75)] border border-white hover:bg-white disabled:opacity-50 disabled:bg-[rgba(255,255,255,0.2)] font-bold flex items-center gap-2 transition-all shadow-[0_10px_30px_rgba(14,165,233,0.08)] text-[#082F49]">
            <FaChevronLeft /> {currentIndex === 1 ? 'Quay về đầu' : 'Câu Trước'}
          </button>

          {q?.type === 'quiz' && !isResultSlide && (
            <button onClick={() => setShowAnswer(!showAnswer)} disabled={selections[currentIndex] !== undefined} className="px-8 py-4 rounded-[16px] bg-[#06B6D4] hover:bg-[#22D3EE] disabled:bg-slate-300 disabled:opacity-50 font-black text-lg shadow-[0_10px_30px_rgba(6,182,212,0.3)] flex items-center gap-2 transition-all hover:-translate-y-1 active:translate-y-0 text-white">
              <FaEye /> {showAnswer ? 'Ẩn đáp án' : 'Hiện đáp án'}
            </button>
          )}

          <button onClick={() => { setCurrentIndex(i => i < totalSlides - 1 ? i + 1 : i); setShowAnswer(false); }} disabled={currentIndex === totalSlides - 1} className={`px-6 py-3 rounded-[16px] font-bold flex items-center gap-2 transition-all border ${currentIndex === test.questions.length - 1 ? 'bg-[#22C55E] border-[#22C55E] hover:bg-[#4ADE80] text-white shadow-[0_10px_30px_rgba(34,197,94,0.3)] animate-pulse' : 'bg-[rgba(255,255,255,0.75)] border-white text-[#082F49] hover:bg-white shadow-[0_10px_30px_rgba(14,165,233,0.08)]'
            } disabled:opacity-50 disabled:bg-[rgba(255,255,255,0.2)]`}>
            {currentIndex === test.questions.length - 1 ? 'Xem Kết Quả' : 'Câu Tiếp'} <FaChevronRight />
          </button>
        </div>

      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}

// ─── Test Detail View ─────────────────────────────────────────────────────────

function TestDetailView({ test, onBack, onRefresh, onPresent }: { test: OldTest; onBack: () => void; onRefresh: () => void; onPresent: () => void; }) {
  const [editModal, setEditModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [hideAnswers, setHideAnswers] = useState(true);
  const [shuffling, setShuffling] = useState(false);

  const showToast = (m: string, t: 'success' | 'error' = 'success') => { setToast({ msg: m, type: t }); setTimeout(() => setToast(null), 3000); };

  const handleShuffle = async () => {
    if (!confirm('Bạn có chắc muốn xáo trộn ngẫu nhiên toàn bộ câu hỏi trong bài này?')) return;
    setShuffling(true);
    try {
      const newQuestions = [...test.questions].sort(() => Math.random() - 0.5);
      const res = await fetch(`/api/old-tests/${test._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: newQuestions })
      });
      if (res.ok) {
        showToast('Đã xáo trộn ngẫu nhiên thành công!');
        onRefresh();
      } else {
        throw new Error('API failed');
      }
    } catch {
      showToast('Lỗi khi xáo trộn', 'error');
    } finally {
      setShuffling(false);
    }
  };

  const qCount = test.questions.length;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all"><FaArrowLeft /></button>
        <h2 className="text-2xl font-black text-[#082F49] flex-1 truncate">{test.title}</h2>
        {qCount > 0 && (
          <button onClick={onPresent} className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-sm font-bold shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2">
            <FaPlay /> Trình chiếu
          </button>
        )}
        <button onClick={() => setEditModal(true)} className="px-5 py-2.5 rounded-2xl bg-[#082F49] text-white text-sm font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2"><FaEdit /> Chỉnh sửa</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Môn học', v: test.subject || '—', c: 'text-indigo-600', bg: 'bg-indigo-50' },
          { l: 'Khối lớp', v: test.grade || '—', c: 'text-sky-600', bg: 'bg-sky-50' },
          { l: 'Số câu', v: qCount + ' câu', c: 'text-emerald-600', bg: 'bg-emerald-50' },
          { l: 'Người tạo', v: test.authorName, c: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((it, i) => (
          <div key={i} className={`p-4 rounded-[20px] border border-white shadow-sm ${it.bg}`}>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">{it.l}</p>
            <p className={`text-xl font-black ${it.c} truncate`}>{it.v}</p>
          </div>
        ))}
      </div>

      {test.description && (
        <div className="p-4 rounded-2xl bg-white border shadow-sm"><p className="text-slate-600 text-sm font-medium">{test.description}</p></div>
      )}

      {/* Render list of questions purely for display */}
      <div className="flex items-center justify-between border-b pb-4 mb-4 mt-8">
        <h3 className="text-lg font-black text-[#082F49]">Danh sách Nội dung hiển thị ({qCount})</h3>
        <div className="flex items-center gap-3">
          <button onClick={() => setHideAnswers(!hideAnswers)} className={`px-4 py-2 rounded-[14px] font-bold text-xs transition-all flex items-center gap-2 shadow-sm border ${hideAnswers ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200' : 'bg-[#E0F2FE] text-[#06B6D4] hover:bg-[#BAE6FD] border-[#BAE6FD]'
            }`}>
            {hideAnswers ? <><FaEyeSlash /> Đang che đáp án</> : <><FaEye /> Đang hiện đáp án</>}
          </button>
          <button onClick={handleShuffle} disabled={shuffling || qCount < 2} className="px-4 py-2 rounded-[14px] bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white font-bold text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-md disabled:opacity-50">
            {shuffling ? <FaSpinner className="animate-spin" /> : <><FaRandom /> Xáo trộn</>}
          </button>
        </div>
      </div>
      <div className="space-y-4 pb-8">
        {test.questions.map((q, idx) => (
          <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-400"></div>
            <p className="text-xs font-black text-slate-400 mb-2">CÂU {idx + 1} {q.type === 'text' ? '· 📝 VĂN BẢN' : '· ✅ TRẮC NGHIỆM'}</p>
            {q.type === 'text' ? (
              <div className="w-full relative">
                <p className={`text-slate-700 text-[15px] leading-relaxed whitespace-pre-wrap transition-all ${hideAnswers ? 'filter blur-sm select-none opacity-50' : ''}`}>{q.description}</p>
                {hideAnswers && <div className="absolute inset-0 flex items-center justify-center font-bold text-slate-400 text-sm">Nội dung đã bị che</div>}
              </div>
            ) : (
              <div className="pl-2">
                <p className="text-slate-800 text-[16px] font-bold mb-4 leading-relaxed">{q.quizQuestion}</p>

                {hideAnswers ? (
                  <div className="w-full text-center py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[16px]">
                    <FaEyeSlash className="text-2xl text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">Đáp án đang bị ẩn để chống nhìn trộm</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.quizOptions?.map((op, i) => (
                      <div key={i} className={`px-4 py-3 rounded-xl border flex gap-3 items-center ${i === q.quizCorrectIndex ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-transparent'}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${i === q.quizCorrectIndex ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{String.fromCharCode(65 + i)}</span>
                        <span className={`text-sm ${i === q.quizCorrectIndex ? 'text-emerald-900 font-bold' : 'text-slate-600 font-medium'}`}>{op}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {qCount === 0 && <div className="text-center py-10 opacity-50"><p className="text-4xl mb-2">📭</p><p className="font-bold">Chưa có câu hỏi nào</p></div>}
      </div>

      {editModal && <EditContentModal test={test} onClose={() => setEditModal(false)} onSaved={(updated) => { test.questions = updated.questions; setEditModal(false); onRefresh(); showToast('Đã lưu nội dung!'); }} />}
    </div>
  );
}

// ─── Main List View ───────────────────────────────────────────────────────────

export function TestClassroomClient({ user }: UserProps) {
  const [tests, setTests] = useState<OldTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [presentationTestId, setPresentationTestId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    const res = await fetch('/api/old-tests');
    if (res.ok) { const d = await res.json(); setTests(d.tests || []); }
    setLoading(false);
  };
  useEffect(() => { fetchTests(); }, []);

  const showToast = (m: string, t: 'success' | 'error' = 'success') => { setToast({ msg: m, type: t }); setTimeout(() => setToast(null), 3000); };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bài kiểm tra này? Toàn bộ câu hỏi sẽ bị mất.')) return;
    const res = await fetch(`/api/old-tests/${id}`, { method: 'DELETE' });
    if (res.ok) { setTests(tests.filter(t => t._id !== id)); showToast('Đã xoá bài kiểm tra', 'error'); }
  };

  const activeTest = tests.find(t => t._id === activeTestId);

  if (activeTestId && activeTest) {
    return (
      <div className="space-y-6">
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        <TestDetailView test={activeTest} onBack={() => setActiveTestId(null)} onRefresh={() => fetchTests()} onPresent={() => setPresentationTestId(activeTestId)} />
        {presentationTestId && <PresentationModal test={tests.find(t => t._id === presentationTestId)!} onClose={() => setPresentationTestId(null)} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl flex items-center gap-3 font-black text-[#082F49]">
            <span className="text-4xl drop-shadow-sm">🗃️</span> Ngân hàng Bài Kiểm Tra Cũ
          </h2>
          <p className="text-[#94A3B8] text-sm font-semibold mt-1">
            Dành cho Giáo viên & Admin quản lý bộ đề • <span className="text-[#06B6D4]">Tổng cộng {tests.length} bài</span>
          </p>
        </div>
        <button onClick={() => setCreateModal(true)} className="px-6 py-3 rounded-[16px] bg-[#06B6D4] hover:bg-[#22D3EE] text-white shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:-translate-y-1 font-black flex items-center justify-center gap-2 transition-all sm:w-auto w-full shrink-0">
          <FaPlus /> Tạo Bài Kiểm Tra
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><FaSpinner className="animate-spin text-3xl text-cyan-500" /></div>
      ) : tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center opacity-80" style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderRadius: 32 }}>
          <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-4">📭</div>
          <h2 className="text-2xl font-black text-[#082F49]">Chưa có bài kiểm tra nào</h2>
          <p className="text-[#94A3B8] font-semibold mt-2">Bấm Tạo mới để thiết lập ngân hàng câu hỏi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tests.map(t => (
            <div key={t._id} onClick={() => setActiveTestId(t._id)} className="p-5 rounded-[24px] border-[1.5px] border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-[200px]" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)' }}>
              <div>
                <div className="flex justify-between items-start gap-4">
                  <div className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black tracking-widest uppercase mb-3 inline-block">
                    {t.subject} • Lớp {t.grade || '—'}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.questions && t.questions.length > 0 && (
                      <button onClick={(e) => { e.stopPropagation(); setPresentationTestId(t._id); }} className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" title="Trình chiếu">
                        <FaPlay className="text-[10px]" />
                      </button>
                    )}
                    <button onClick={e => handleDelete(t._id, e)} className="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100" title="Xóa">
                      <FaTrash className="text-[11px]" />
                    </button>
                  </div>
                </div>
                <h3 className="font-black text-[#082F49] text-xl leading-snug line-clamp-2">{t.title}</h3>
                {t.description && <p className="text-[#64748B] text-xs font-semibold mt-2 line-clamp-1">{t.description}</p>}
              </div>

              <div className="flex justify-between items-end border-t border-slate-100 pt-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[10px] font-black text-amber-600">{t.authorName.charAt(0).toUpperCase()}</div>
                  <span className="text-[11px] font-black text-slate-400">{t.authorName}</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 flex flex-col items-end">
                  <span className="text-emerald-500 text-sm">{t.questions?.length || 0} câu</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModal && <CreateTestModal onClose={() => setCreateModal(false)} onCreate={nt => { setTests([nt, ...tests]); setCreateModal(false); showToast('Tạo thành công!'); }} />}
      {presentationTestId && <PresentationModal test={tests.find(t => t._id === presentationTestId)!} onClose={() => setPresentationTestId(null)} />}
    </div>
  );
}
