'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaPlus, FaUsers, FaBook, FaTrash, FaArrowLeft,
  FaUserPlus, FaCheckCircle, FaSpinner, FaTimes,
  FaEdit, FaClock, FaStar, FaChevronRight,
  FaSearch, FaSortAmountDown, FaSortAmountUp, FaPencilAlt,
} from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  userId: string;
  username: string;
  fullName?: string;
  avatar?: string;
  joinedAt: string;
}

interface HomeClassSummary {
  _id: string;
  name: string;
  subject?: string;
  description?: string;
  grade?: number;
  teacherName: string;
  teacherAvatar?: string;
  teacherId: string;
  members: Member[];
  createdAt: string;
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

interface SubmissionAnswer {
  questionIdx: number;
  answer?: string;
  textScore?: number;
}

interface Question {
  type: 'text' | 'quiz';
  description?: string;
  quizQuestion?: string;
  quizOptions?: string[];
  quizCorrectIndex?: number;
}

interface AssignmentItem {
  _id: string;
  title: string;
  questions: Question[];
  dueDate?: string;
  expReward: number;
  submissions: Submission[];
  createdAt: string;
}

interface HomeClassDetail extends HomeClassSummary {
  assignments: AssignmentItem[];
}

interface UserProfile {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  role: 1 | 2 | 3;
}

interface StudentSuggestion {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeUntil(dateStr: string): { label: string; urgent: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) {
    const overMs = Math.abs(diff);
    const overH  = Math.floor(overMs / 3600000);
    const overD  = Math.floor(overH / 24);
    const label  = overD > 0 ? `Quá hạn ${overD} ngày` : `Quá hạn ${overH} giờ`;
    return { label, urgent: true };
  }
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return { label: `Còn ${d} ngày`, urgent: d <= 1 };
  return { label: `Còn ${h} giờ`, urgent: h <= 6 };
}

const GLASS = {
  background: 'rgba(255,255,255,0.75)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,1)',
  boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
};

const inputCls = 'w-full px-4 py-2.5 rounded-[16px] text-sm text-[#082F49] placeholder-[#94A3B8] bg-white/80 border border-[#BAE6FD] focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.12)] transition-all duration-300';

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[14px] text-sm font-bold
      shadow-lg border transition-all
      ${type === 'success'
        ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
        : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
      }`}>
      {msg}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────────────────────

/** Đơn giản loại bỏ các thẻ script và thuộc tính event khỏi HTML (XSS cơ bản) */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/javascript\s*:/gi, '');
}

// ─── Rich Text Editor ──────────────────────────────────────────────────────────────────────────

function RichTextEditor({ value, onChange, placeholder, rows = 4 }: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const editorRef   = useRef<HTMLDivElement>(null);
  const imgRef      = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialized.current) {
      editorRef.current.innerHTML = value || '';
      initialized.current = true;
    }
  }, []);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    onChange(sanitizeHtml(editorRef.current?.innerHTML || ''));
  };

  const handleImageFile = (file: File) => {
    if (file.size > 3 * 1024 * 1024) { alert('Kích thước ảnh tối đa 3MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => exec('insertImage', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imgItem = items.find(it => it.type.startsWith('image/'));
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (file) handleImageFile(file);
    }
  };

  const btnCls = 'w-7 h-7 rounded-[8px] border border-slate-200 bg-white hover:bg-slate-100 '
    + 'flex items-center justify-center text-[#334155] text-xs font-black transition-all shrink-0';

  return (
    <div className="rounded-[14px] border border-[#BAE6FD] bg-white/80 overflow-hidden
      focus-within:border-[#06B6D4] focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.12)] transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50/80 flex-wrap">
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('bold'); }}
          className={btnCls} title="In đậm">
          <span style={{ fontWeight: 900 }}>B</span>
        </button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('italic'); }}
          className={btnCls} title="In nghiêng">
          <span style={{ fontStyle: 'italic', fontWeight: 700 }}>I</span>
        </button>
        <button type="button" onMouseDown={e => { e.preventDefault(); exec('underline'); }}
          className={btnCls} title="Gạch dưới">
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <button type="button"
          onMouseDown={e => { e.preventDefault(); imgRef.current?.click(); }}
          className={btnCls} title="Đính kèm hình ảnh">
          🖼️
        </button>
        <input ref={imgRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }} />
        <span className="ml-auto text-[10px] text-[#94A3B8] font-medium hidden sm:block">
          Có thể dán ảnh trực tiếp
        </span>
      </div>
      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(sanitizeHtml(editorRef.current?.innerHTML || ''))}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.75}rem` }}
        className="px-4 py-3 text-sm text-[#082F49] focus:outline-none
          empty:before:content-[attr(data-placeholder)] empty:before:text-[#94A3B8]
          [&_img]:max-w-full [&_img]:rounded-[8px] [&_img]:my-1 [&_b]:font-black
          [&_i]:italic [&_u]:underline"
      />
    </div>
  );
}

// ─── Create Class Modal ───────────────────────────────────────────────────────

function CreateClassModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (created: HomeClassSummary) => void;
}) {
  const [name, setName]       = useState('');
  const [subject, setSubject] = useState('');
  const [desc, setDesc]       = useState('');
  const [grade, setGrade]     = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Tên lớp học không được để trống'); return; }
    setSaving(true); setError('');
    const res  = await fetch('/api/homeclass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        name.trim(),
        subject:     subject.trim() || undefined,
        description: desc.trim() || undefined,
        grade:       grade ? Number(grade) : undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Tạo thất bại'); return; }
    onCreate(data.class);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-[24px] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-sky-50 to-cyan-50">
          <h2 className="font-black text-[#082F49] text-lg">🏫 Tạo lớp học mới</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <FaTimes className="text-xs" />
          </button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          {error && <p className="text-red-600 text-sm font-semibold px-4 py-3 bg-red-50 rounded-[12px] border border-red-200">{error}</p>}
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Tên lớp *</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls}
              placeholder="Ví dụ: Lớp Địa lý 8A" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Môn học</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls}
              placeholder="Địa lí, Lịch sử, …" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Khối lớp</label>
            <input type="number" min={1} max={12} value={grade} onChange={e => setGrade(e.target.value)} className={inputCls}
              placeholder="6, 7, 8, 9, …" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Mô tả</label>
            <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)} className={inputCls + ' resize-none'}
              placeholder="Thông tin thêm về lớp học…" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[14px] border border-slate-200 text-sm font-bold text-[#334155] hover:bg-slate-50">Huỷ</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-bold hover:from-sky-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <FaSpinner className="animate-spin text-xs" />} Tạo lớp
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



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
  type: 'text', description: '', quizQuestion: '',
  quizOptions: ['', '', '', ''], quizCorrectIndex: 0,
});

function fromExistingQuestions(questions: Question[]): QEntry[] {
  return questions.map(q => ({
    id: Math.random().toString(36).slice(2),
    type: q.type,
    description: q.description || '',
    quizQuestion: q.quizQuestion || '',
    quizOptions: (q.quizOptions as [string,string,string,string]) || ['','','',''],
    quizCorrectIndex: q.quizCorrectIndex ?? 0,
  }));
}

function QuestionBuilder({ entries, setEntries }: {
  entries: QEntry[];
  setEntries: React.Dispatch<React.SetStateAction<QEntry[]>>;
}) {
  const upd = (id: string, patch: Partial<QEntry>) =>
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

  return (
    <div className="space-y-3">
      {entries.map((en, idx) => (
        <div key={en.id} className="rounded-[16px] border-2 border-slate-100 bg-slate-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#082F49] uppercase tracking-widest">
              Câu #{idx + 1}
            </span>
            {entries.length > 1 && (
              <button type="button" onClick={() => setEntries(prev => prev.filter(e => e.id !== en.id))}
                className="w-6 h-6 rounded-full bg-red-50 border border-red-200 flex items-center
                  justify-center text-red-400 hover:bg-red-100 transition-all">
                <FaTimes className="text-[9px]" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['text', 'quiz'] as const).map(v => (
              <button key={v} type="button" onClick={() => upd(en.id, { type: v })}
                className={`flex-1 py-1.5 rounded-[10px] text-xs font-bold border-2 transition-all
                  ${en.type === v
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-[#334155]'
                  }`}>
                {v === 'text' ? '📝 Văn bản' : '🔤 Trắc nghiệm ABCD'}
              </button>
            ))}
          </div>
          {en.type === 'text' && (
            <RichTextEditor
              value={en.description}
              onChange={html => upd(en.id, { description: html })}
              placeholder="Nội dung / yêu cầu câu hỏi, có thể đính kèm ảnh..."
              rows={3}
            />
          )}
          {en.type === 'quiz' && (
            <div className="space-y-2">
              <input
                value={en.quizQuestion}
                onChange={e => upd(en.id, { quizQuestion: e.target.value })}
                className={inputCls}
                placeholder="Câu hỏi trắc nghiệm *" />
              {en.quizOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => upd(en.id, { quizCorrectIndex: i })}
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center
                      text-xs font-black border-2 transition-all
                      ${en.quizCorrectIndex === i
                        ? 'border-emerald-400 bg-emerald-400 text-white'
                        : 'border-slate-300 bg-white text-[#334155] hover:border-emerald-300'
                      }`}
                    title="Chọn đây là đáp án đúng">
                    {String.fromCharCode(65 + i)}
                  </button>
                  <input
                    value={opt}
                    onChange={e => {
                      const o = [...en.quizOptions] as [string,string,string,string];
                      o[i] = e.target.value;
                      upd(en.id, { quizOptions: o });
                    }}
                    className={inputCls + ' text-xs py-2'}
                    placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} />
                </div>
              ))}
              <p className="text-[10px] text-emerald-600 font-semibold">
                Bấm chữ cái để chọn đáp án đúng (xanh lá = đúng)
              </p>
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={() => setEntries(prev => [...prev, mkQEntry()])}
        className="w-full py-2.5 rounded-[14px] border-2 border-dashed border-emerald-300
          text-emerald-600 text-sm font-bold hover:bg-emerald-50 transition-all
          flex items-center justify-center gap-2">
        <FaPlus className="text-xs" /> Thêm câu hỏi
      </button>
    </div>
  );
}

// ─── Edit Assignment Modal ──────────────────────────────────────────────────

function EditAssignmentModal({ assignment, classId, onClose, onSaved }: {
  assignment: AssignmentItem;
  classId: string;
  onClose: () => void;
  onSaved: (updated: AssignmentItem) => void;
}) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const initDate = assignment.dueDate
    ? (() => { const d = new Date(assignment.dueDate!); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; })()
    : '';
  const initTime = assignment.dueDate
    ? (() => { const d = new Date(assignment.dueDate!); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; })()
    : '';

  const [title, setTitle]     = useState(assignment.title);
  const [entries, setEntries] = useState<QEntry[]>(() => fromExistingQuestions(assignment.questions));
  const [dueDate, setDueDate] = useState(initDate);
  const [dueTime, setDueTime] = useState(initTime);
  const [expReward, setExp]   = useState(String(assignment.expReward));
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề'); return; }
    if (entries.some(en => en.type === 'quiz' && !en.quizQuestion.trim())) {
      setError('Câu hỏi trắc nghiệm không được để trống'); return;
    }
    setSaving(true); setError('');
    const combinedDue = dueDate ? (dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59`) : undefined;
    const res = await fetch(`/api/homeclass/${classId}/assignments/${assignment._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        questions: entries.map(en => ({
          type:             en.type,
          description:      en.type === 'text' ? (en.description || undefined) : undefined,
          quizQuestion:     en.type === 'quiz' ? en.quizQuestion.trim() || undefined : undefined,
          quizOptions:      en.type === 'quiz' ? en.quizOptions : undefined,
          quizCorrectIndex: en.type === 'quiz' ? en.quizCorrectIndex : undefined,
        })),
        dueDate:    combinedDue,
        expReward:  Number(expReward),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Lưu thất bại'); return; }
    onSaved(data.assignment);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl rounded-[24px] overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-amber-50 to-orange-50 shrink-0">
          <h2 className="font-black text-[#082F49] text-lg">✏️ Chỉnh sửa bài tập</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200
            flex items-center justify-center text-slate-500"><FaTimes className="text-xs" /></button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && <p className="text-red-600 text-sm font-semibold px-4 py-3 bg-red-50 rounded-[12px] border border-red-200">{error}</p>}
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Tiêu đề bài tập *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} placeholder="Ví dụ: Ôn tập chương 1" />
          </div>
          <QuestionBuilder entries={entries} setEntries={setEntries} />
          <div className="rounded-[16px] bg-amber-50 border border-amber-200 p-4 space-y-3">
            <p className="text-xs font-bold text-amber-700">⚙️ Cài đặt chung</p>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1.5">
                <FaClock className="inline mr-1 text-orange-400" /> Hạn nộp
              </label>
              <div className="flex gap-2">
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls + ' flex-1'} />
                <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={inputCls + ' w-28'} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1.5">
                <FaStar className="inline mr-1 text-amber-400" /> EXP thưởng
              </label>
              <input type="number" min={0} max={500} value={expReward} onChange={e => setExp(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[14px] border border-slate-200 text-sm font-bold text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-amber-500 to-orange-500
                text-white text-sm font-bold hover:from-amber-400 hover:to-orange-400 transition-all
                flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <FaSpinner className="animate-spin text-xs" />} Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Assignment Modal ──────────────────────────────────────────────────

function CreateAssignmentModal({ classId, onClose, onCreate }: {
  classId: string;
  onClose: () => void;
  onCreate: (a: AssignmentItem) => void;
}) {
  const [title, setTitle]     = useState('');
  const [entries, setEntries] = useState<QEntry[]>([mkQEntry()]);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [expReward, setExp]   = useState('20');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Vui lòng nhập tiêu đề bài tập'); return; }
    if (entries.some(en => en.type === 'quiz' && !en.quizQuestion.trim())) {
      setError('Câu trắc nghiệm phải có câu hỏi'); return;
    }
    setSaving(true); setError('');
    const combinedDue = dueDate ? (dueTime ? `${dueDate}T${dueTime}` : `${dueDate}T23:59`) : undefined;
    const res = await fetch(`/api/homeclass/${classId}/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        questions: entries.map(en => ({
          type:             en.type,
          description:      en.type === 'text' ? (en.description || undefined) : undefined,
          quizQuestion:     en.type === 'quiz' ? en.quizQuestion.trim() || undefined : undefined,
          quizOptions:      en.type === 'quiz' ? en.quizOptions : undefined,
          quizCorrectIndex: en.type === 'quiz' ? en.quizCorrectIndex : undefined,
        })),
        dueDate:   combinedDue,
        expReward: Number(expReward),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Tạo thất bại'); return; }
    onCreate(data.assignment);
  };

  const qCount   = entries.length;
  const quizCount = entries.filter(e => e.type === 'quiz').length;
  const textCount = entries.filter(e => e.type === 'text').length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl rounded-[24px] overflow-hidden max-h-[92vh] flex flex-col"
        style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)' }}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-emerald-50 to-cyan-50 shrink-0 gap-3">
          <div>
            <h2 className="font-black text-[#082F49] text-lg">📋 Giao bài tập mới</h2>
            {qCount > 0 && (
              <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                {qCount} câu hỏi
                {quizCount > 0 && textCount > 0 && ` (${quizCount} TN, ${textCount} VB)`}
                {quizCount > 0 && textCount === 0 && ` trắc nghiệm`}
                {textCount > 0 && quizCount === 0 && ` văn bản`}
              </p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200
            flex items-center justify-center text-slate-500"><FaTimes className="text-xs" /></button>
        </div>
        <form onSubmit={handle} className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && <p className="text-red-600 text-sm font-semibold px-4 py-3 bg-red-50 rounded-[12px] border border-red-200">{error}</p>}
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1.5">Tiêu đề bài tập *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls}
              placeholder="Ví dụ: Kiểm tra 15 phút – Chương 1" />
          </div>
          <QuestionBuilder entries={entries} setEntries={setEntries} />
          <div className="rounded-[16px] bg-amber-50 border border-amber-200 p-4 space-y-3">
            <p className="text-xs font-bold text-amber-700">⚙️ Cài đặt chung</p>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1.5">
                <FaClock className="inline mr-1 text-orange-400" /> Hạn nộp
              </label>
              <div className="flex gap-2">
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls + ' flex-1'} />
                <input type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} className={inputCls + ' w-28'} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1.5">
                <FaStar className="inline mr-1 text-amber-400" /> EXP thưởng
              </label>
              <input type="number" min={0} max={500} value={expReward} onChange={e => setExp(e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[14px] border border-slate-200 text-sm font-bold text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-[14px] bg-gradient-to-r from-emerald-500 to-cyan-500
                text-white text-sm font-bold hover:from-emerald-400 hover:to-cyan-400 transition-all
                flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <FaSpinner className="animate-spin text-xs" />}
              Giao bài tập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



// ─── Class Detail View ────────────────────────────────────────────────────────

function ClassDetailView({ cls, profile, onBack, onRefresh }: {
  cls: HomeClassDetail;
  profile: UserProfile;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const isTeacher = profile.role === 2 || profile.role === 1 || cls.teacherId === profile._id;
  const [addUsername, setAddUsername]     = useState('');
  const [addLoading, setAddLoading]       = useState(false);
  const [addError, setAddError]           = useState('');
  const [assignModal, setAssignModal]     = useState(false);
  // ── student search dropdown ──
  const [suggestions, setSuggestions]     = useState<StudentSuggestion[]>([]);
  const [classNames, setClassNames]       = useState<string[]>([]);
  const [classFilter, setClassFilter]     = useState('');
  const [sortKey, setSortKey]             = useState<'username' | 'exp' | 'streak'>('username');
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('asc');
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const dropdownRef                       = useRef<HTMLDivElement>(null);
  const inputRef                          = useRef<HTMLInputElement>(null);
  const [ddPos, setDdPos]                 = useState<{ top: number; left: number; width: number } | null>(null);
  const [assignments, setAssignments]     = useState<AssignmentItem[]>(cls.assignments);
  const [members, setMembers]             = useState<Member[]>(cls.members);
  const [activeSection, setActiveSection] = useState<'assignments' | 'members'>('assignments');
  const router                             = useRouter();
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deletingAssign, setDeletingAssign] = useState<string | null>(null);
  const [editAssign, setEditAssign]         = useState<AssignmentItem | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── close dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── close dropdown on scroll so fixed position stays accurate ──
  useEffect(() => {
    const handler = () => setDropdownOpen(false);
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, []);

  // ── calculate fixed dropdown position from input element ──
  const updateDdPos = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDdPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
  };

  // ── debounced search ──
  useEffect(() => {
    if (!dropdownOpen) return;
    const t = setTimeout(() => fetchSuggestions(addUsername, classFilter, sortKey, sortDir), 250);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addUsername, classFilter, sortKey, sortDir, dropdownOpen]);

  const fetchSuggestions = async (
    q: string, cls_filter: string, sort: string, dir: string,
  ) => {
    setSearchLoading(true);
    const params = new URLSearchParams({ q, sort, sortDir: dir, limit: '5' });
    if (cls_filter) params.set('className', cls_filter);
    const res  = await fetch(`/api/homeclass/search-students?${params}`);
    const data = await res.json();
    setSearchLoading(false);
    if (res.ok) {
      setSuggestions(data.students ?? []);
      if (data.classNames?.length) setClassNames(data.classNames);
    }
  };

  const handlePickSuggestion = (s: StudentSuggestion) => {
    setAddUsername(s.username);
    setDropdownOpen(false);
  };

  const toggleSort = (key: 'username' | 'exp' | 'streak') => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUsername.trim()) return;
    setAddLoading(true); setAddError('');
    setDropdownOpen(false);
    const res  = await fetch(`/api/homeclass/${cls._id}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: addUsername.trim() }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (!res.ok) { setAddError(data.error); return; }
    setMembers(prev => [...prev, data.member]);
    setAddUsername('');
    showToast(`✅ Đã thêm ${addUsername}!`);
  };

  const handleRemoveMember = async (memberId: string) => {
    const res = await fetch(`/api/homeclass/${cls._id}/members?memberId=${memberId}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Xoá thất bại', 'error'); return; }
    setMembers(prev => prev.filter(m => m.userId !== memberId));
    showToast('🗑️ Đã xoá học sinh!', 'error');
  };

  const handleDeleteAssignment = async (assignId: string) => {
    const res = await fetch(`/api/homeclass/${cls._id}/assignments/${assignId}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Xoá thất bại', 'error'); return; }
    setAssignments(prev => prev.filter(a => a._id !== assignId));
    setDeletingAssign(null);
    showToast('🗑️ Đã xoá bài tập!', 'error');
  };

  const pendingCount = assignments.filter(a =>
    !a.submissions.some(s => s.userId === profile._id)
  ).length;

  return (
    <div className="space-y-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold text-sm
            transition-colors group">
          <span className="w-8 h-8 rounded-[10px] bg-slate-100 group-hover:bg-slate-200
            flex items-center justify-center transition-colors">
            <FaArrowLeft className="text-xs" />
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-[#082F49] text-xl truncate">{cls.name}</h2>
          <p className="text-[#94A3B8] text-xs font-semibold mt-0.5">
            {cls.subject && `${cls.subject} · `}
            {cls.grade && `Lớp ${cls.grade} · `}
            GV: {cls.teacherName}
          </p>
        </div>
        {isTeacher && (
          <button onClick={() => setAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[12px]
              bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold
              hover:from-emerald-400 hover:to-cyan-400 shadow-md transition-all">
            <FaPlus className="text-xs" /> Giao bài tập
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 bg-white/75 backdrop-blur-[20px] border border-white
        rounded-[16px] p-1 shadow-[0_4px_16px_rgba(14,165,233,0.07)] w-fit">
        {([
          ['assignments', `📋 Bài tập${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
          ['members', `👥 Học sinh (${members.length})`],
        ] as const).map(([sec, lbl]) => (
          <button key={sec} onClick={() => setActiveSection(sec)}
            className={`px-4 py-2 rounded-[12px] text-sm font-bold transition-all
              ${activeSection === sec
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                : 'text-[#334155] hover:bg-slate-50'
              }`}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── Assignments section ── */}
      {activeSection === 'assignments' && (
        <div className="space-y-3">
          {assignments.length === 0 ? (
            <div className="rounded-[24px] p-10 flex flex-col items-center gap-3 text-center"
              style={GLASS}>
              <span className="text-5xl">📭</span>
              <p className="font-bold text-[#082F49]">Chưa có bài tập nào</p>
              {isTeacher && (
                <button onClick={() => setAssignModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-[12px]
                    bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold">
                  <FaPlus className="text-xs" /> Giao bài tập đầu tiên
                </button>
              )}
            </div>
          ) : (
            assignments.map(a => {
              const alreadyDone  = a.submissions.some(s => s.userId === profile._id);
              const mySub        = a.submissions.find(s => s.userId === profile._id);
              const deadline     = a.dueDate ? timeUntil(a.dueDate) : null;
              const isLate       = deadline?.label === 'Đã quá hạn';
              const quizCount    = a.questions.filter(q => q.type === 'quiz').length;
              const textCount    = a.questions.filter(q => q.type === 'text').length;
              const totalQ       = a.questions.length;
              const cardIcon     = totalQ === 0 ? '📋' : quizCount === totalQ ? '🔤' : textCount === totalQ ? '📝' : '📋';
              const cardGradient = totalQ === 0 || textCount === totalQ
                ? 'from-emerald-400 to-cyan-500'
                : quizCount === totalQ
                  ? 'from-violet-400 to-fuchsia-500'
                  : 'from-amber-400 to-orange-500';
              return (
                <div
                  key={a._id}
                  className="rounded-[20px] p-5 cursor-pointer hover:shadow-[0_8px_24px_rgba(14,165,233,0.15)] transition-all"
                  style={GLASS}
                  onClick={() => router.push(`/homeclass/${cls._id}/${a._id}`)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center
                      text-lg shrink-0 bg-gradient-to-br ${cardGradient}`}>
                      {cardIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-black text-[#082F49] text-sm">{a.title}</p>
                          <p className="text-[#94A3B8] text-xs mt-0.5">
                            {totalQ} câu hỏi
                            {quizCount > 0 && textCount > 0 && ` (${quizCount} TN · ${textCount} VB)`}
                            {quizCount > 0 && textCount === 0 && ' trắc nghiệm'}
                            {textCount > 0 && quizCount === 0 && ' văn bản'}
                          </p>
                        </div>
                        {/* Status badge */}
                        {alreadyDone ? (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                            bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 shrink-0">
                            <FaCheckCircle className="text-[10px]" /> Đã nộp
                          </span>
                        ) : isLate ? (
                          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-600
                            text-xs font-bold border border-red-200 shrink-0">Quá hạn</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700
                            text-xs font-bold border border-amber-200 shrink-0">Chờ nộp</span>
                        )}
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {deadline && (
                          <span className={`flex items-center gap-1 text-xs font-semibold
                            ${deadline.urgent ? 'text-red-500' : 'text-[#94A3B8]'}`}>
                            <FaClock className="text-[10px]" /> {deadline.label}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <FaStar className="text-[10px]" /> +{a.expReward} EXP
                        </span>
                        <span className="text-[#94A3B8] text-xs">
                          {a.submissions.length}/{isTeacher ? members.length : 1} đã nộp
                        </span>
                      </div>

                      {/* Score badge if graded */}
                      {!isTeacher && mySub?.fullyGraded && mySub.totalScore !== undefined && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1
                          rounded-full bg-emerald-100 text-emerald-700 text-xs font-black border border-emerald-200">
                          🏆 {mySub.totalScore}/10 điểm
                        </div>
                      )}

                      {/* Teacher actions (prevent card click via stopPropagation) */}
                      {isTeacher && (
                        <div className="flex items-center gap-1.5 mt-3">
                          <button
                            onClick={e => { e.stopPropagation(); setEditAssign(a); }}
                            title="Chỉnh sửa bài tập"
                            className="w-7 h-7 rounded-[8px] bg-amber-50 border border-amber-200
                              flex items-center justify-center text-amber-500 hover:bg-amber-100 transition-all">
                            <FaPencilAlt className="text-[10px]" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setDeletingAssign(a._id); }}
                            title="Xoá bài tập"
                            className="w-7 h-7 rounded-[8px] bg-red-50 border border-red-200
                              flex items-center justify-center text-red-400 hover:bg-red-100 transition-all">
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Members section ── */}
      {activeSection === 'members' && (
        <div className="space-y-4">
          {/* Add member form (teacher only) */}
          {isTeacher && (
            <div className="rounded-[20px] p-5" style={{ ...GLASS, position: 'relative', zIndex: 20 }}>
              <h3 className="font-black text-[#082F49] text-sm mb-3 flex items-center gap-2">
                <FaUserPlus className="text-cyan-500" /> Thêm học sinh
              </h3>
              {addError && (
                <p className="text-red-600 text-xs font-semibold mb-3 px-3 py-2 bg-red-50
                  rounded-[10px] border border-red-200">{addError}</p>
              )}
              <form onSubmit={handleAddMember}>
                {/* Search input row */}
                <div ref={dropdownRef} className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs pointer-events-none" />
                      <input
                        ref={inputRef}
                        value={addUsername}
                      onChange={e => { setAddUsername(e.target.value); updateDdPos(); setDropdownOpen(true); }}
                        onFocus={() => { updateDdPos(); setDropdownOpen(true); fetchSuggestions(addUsername, classFilter, sortKey, sortDir); }}
                        className={inputCls + ' pl-9'}
                        placeholder="Tìm tên đăng nhập hoặc họ tên học sinh..."
                        autoComplete="off"
                      />
                    </div>
                    <button type="submit" disabled={addLoading || !addUsername.trim()}
                      className="px-4 py-2 rounded-[14px] bg-gradient-to-r from-cyan-500 to-blue-500
                        text-white text-sm font-bold hover:from-cyan-400 hover:to-blue-400 transition-all
                        flex items-center gap-2 disabled:opacity-50 shrink-0">
                      {addLoading ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                      Thêm
                    </button>
                  </div>

                  {/* Dropdown — position:fixed to escape all stacking contexts */}
                  {dropdownOpen && ddPos && (
                    <div
                      style={{
                        position: 'fixed',
                        top: ddPos.top,
                        left: ddPos.left,
                        width: ddPos.width,
                        zIndex: 9999,
                        borderRadius: '18px',
                        overflow: 'hidden',
                        ...GLASS,
                        boxShadow: '0 16px 40px rgba(14,165,233,0.14)',
                      }}>

                      {/* ── Filter & Sort bar ── */}
                      <div className="px-3 pt-3 pb-2 border-b border-slate-100">
                        {/* Class filter pills */}
                        {classNames.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <button type="button"
                              onClick={() => setClassFilter('')}
                              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all
                                ${ classFilter === ''
                                  ? 'bg-cyan-500 text-white'
                                  : 'bg-slate-100 text-[#334155] hover:bg-slate-200'
                                }`}>
                              Tất cả
                            </button>
                            {classNames.map(cn => (
                              <button key={cn} type="button"
                                onClick={() => setClassFilter(classFilter === cn ? '' : cn)}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all
                                  ${ classFilter === cn
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-slate-100 text-[#334155] hover:bg-slate-200'
                                  }`}>
                                Lớp {cn}
                              </button>
                            ))}
                          </div>
                        )}
                        {/* Sort buttons */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#94A3B8] font-semibold mr-1">Sắp xếp:</span>
                          {(['username', 'exp', 'streak'] as const).map(k => (
                            <button key={k} type="button"
                              onClick={() => toggleSort(k)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all
                                ${ sortKey === k
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-slate-100 text-[#94A3B8] hover:bg-slate-200'
                                }`}>
                              { k === 'username' ? 'Tên' : k === 'exp' ? 'EXP' : 'Streak' }
                              {sortKey === k && (
                                sortDir === 'asc'
                                  ? <FaSortAmountUp className="text-[9px]" />
                                  : <FaSortAmountDown className="text-[9px]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── Results ── */}
                      {searchLoading ? (
                        <div className="flex items-center justify-center py-5">
                          <FaSpinner className="animate-spin text-cyan-400" />
                        </div>
                      ) : suggestions.length === 0 ? (
                        <p className="text-center text-[#94A3B8] text-xs py-5">Không tìm thấy học sinh</p>
                      ) : (
                        <ul>
                          {suggestions.map((s, i) => (
                            <li key={s._id}>
                              <button type="button"
                                onMouseDown={() => handlePickSuggestion(s)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left
                                  hover:bg-sky-50 transition-all
                                  ${ i < suggestions.length - 1 ? 'border-b border-slate-50' : '' }`}>
                                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-violet-400
                                  to-purple-500 flex items-center justify-center text-white text-xs
                                  font-black shrink-0 overflow-hidden">
                                  {s.avatar
                                    ? <img src={s.avatar} alt="" className="w-full h-full object-cover" />
                                    : s.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[#082F49] text-sm truncate">{s.fullName}</p>
                                    {s.username && <p className="text-[#94A3B8] text-xs truncate">{s.username}</p>}
                                </div>
                                {s.className && (
                                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5
                                    rounded-full bg-sky-100 text-sky-600">
                                    Lớp {s.className}
                                  </span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Members list */}
          {members.length === 0 ? (
            <div className="rounded-[24px] p-10 flex flex-col items-center gap-3 text-center"
              style={{ ...GLASS, position: 'relative', zIndex: 1 }}>
              <span className="text-4xl">👥</span>
              <p className="font-bold text-[#082F49]">Chưa có học sinh nào</p>
              <p className="text-[#94A3B8] text-sm">Thêm học sinh bằng tên đăng nhập</p>
            </div>
          ) : (
            <div className="rounded-[20px] overflow-hidden" style={{ ...GLASS, position: 'relative', zIndex: 1 }}>
              {members.map((m, i) => (
                <div key={m.userId}
                  className={`flex items-center gap-3 px-5 py-3.5
                    ${i < members.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-violet-400 to-purple-500
                    flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                    {m.avatar
                      ? <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                      : m.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#082F49] text-sm">{m.username}</p>
                    {m.fullName && <p className="text-[#94A3B8] text-xs">{m.fullName}</p>}
                  </div>
                  {/* Submissions count for this member */}
                  <span className="text-xs text-[#94A3B8] font-semibold">
                    {assignments.filter(a => a.submissions.some(s => s.userId === m.userId)).length}/{assignments.length} bài
                  </span>
                  {isTeacher && (
                    <button onClick={() => handleRemoveMember(m.userId)}
                      className="w-7 h-7 rounded-[8px] bg-slate-50 border border-slate-200
                        flex items-center justify-center text-red-400 hover:bg-red-50 transition-all">
                      <FaTimes className="text-[10px]" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Assignment Modal */}
      {editAssign && (
        <EditAssignmentModal
          assignment={editAssign}
          classId={cls._id}
          onClose={() => setEditAssign(null)}
          onSaved={updated => {
            setAssignments(prev => prev.map(a => a._id === updated._id ? updated : a));
            setEditAssign(null);
            showToast('✅ Đã cập nhật bài tập!');
          }}
        />
      )}

      {/* Create assignment modal */}
      {assignModal && (
        <CreateAssignmentModal
          classId={cls._id}
          onClose={() => setAssignModal(false)}
          onCreate={item => { setAssignments(prev => [item, ...prev]); setAssignModal(false); showToast('✅ Đã giao bài tập!'); }}
        />
      )}
      {deletingAssign && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-[20px] border border-white
            rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <p className="font-bold text-[#082F49] mb-5">Xoá bài tập này?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingAssign(null)}
                className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
                  text-[#334155] hover:bg-slate-50">Huỷ</button>
              <button onClick={() => handleDeleteAssignment(deletingAssign)}
                className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-red-500 to-rose-500
                  text-white text-sm font-bold">Xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main HomeClassClient ─────────────────────────────────────────────────────

interface HomeClassClientProps {
  user: { name?: string | null; image?: string | null };
}

export function HomeClassClient({ user }: HomeClassClientProps) {
  const [profile, setProfile]       = useState<UserProfile | null>(null);
  const [classes, setClasses]       = useState<HomeClassSummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeClass, setActiveClass] = useState<HomeClassDetail | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => { if (d.user) setProfile(d.user); });
  }, []);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const res  = await fetch('/api/homeclass');
    const data = await res.json();
    setClasses(data.classes ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const handleOpenClass = async (id: string) => {
    const res  = await fetch(`/api/homeclass/${id}`);
    const data = await res.json();
    if (data.class) setActiveClass({ ...data.class, assignments: data.assignments ?? [] });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/homeclass/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    setClasses(prev => prev.filter(c => c._id !== id));
    showToast('🗑️ Đã xoá lớp học!', 'error');
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-32">
        <FaSpinner className="text-3xl text-violet-400 animate-spin" />
      </div>
    );
  }

  const isTeacher = profile.role === 2 || profile.role === 1;

  // ── Class detail view ──
  if (activeClass) {
    return (
      <ClassDetailView
        cls={activeClass}
        profile={profile}
        onBack={() => { setActiveClass(null); fetchClasses(); }}
        onRefresh={() => handleOpenClass(activeClass._id)}
      />
    );
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {createModal && (
        <CreateClassModal
          onClose={() => setCreateModal(false)}
          onCreate={async created => {
            setCreateModal(false);
            await fetchClasses();
            handleOpenClass(created._id);
          }}
        />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-[20px] border border-white
            rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <p className="font-bold text-[#082F49] mb-2">Xoá lớp học này?</p>
            <p className="text-sm text-[#94A3B8] mb-5">Tất cả bài tập sẽ bị xoá theo.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold text-[#334155]">Huỷ</button>
              <button onClick={() => handleDelete(deletingId)}
                className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold">Xoá</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#082F49] flex items-center gap-3">
              <span className="text-3xl">🏡</span>
              {isTeacher ? 'Lớp học ở nhà' : 'Bài tập về nhà'}
            </h1>
            <p className="text-[#94A3B8] text-sm mt-1 font-semibold">
              {isTeacher
                ? 'Tạo lớp, thêm học sinh và giao bài tập'
                : 'Xem các bài tập được giáo viên giao'}
            </p>
          </div>
          {isTeacher && (
            <button onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-[18px] font-bold text-white
                bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400
                hover:to-purple-400 shadow-lg transition-all duration-300 whitespace-nowrap">
              <FaPlus size={12} /> Tạo lớp học mới
            </button>
          )}
        </div>

        {/* Classes */}
        {classes.length === 0 ? (
          <div className="rounded-[24px] py-20 flex flex-col items-center gap-4 text-center"
            style={{ ...GLASS, border: '2px dashed rgba(139,92,246,0.3)' }}>
            <span className="text-6xl">
              {isTeacher ? '🏡' : '📋'}
            </span>
            <p className="font-bold text-[#082F49] text-base">
              {isTeacher ? 'Chưa có lớp học nào' : 'Bạn chưa được thêm vào lớp học nào'}
            </p>
            <p className="text-[#94A3B8] text-sm max-w-xs">
              {isTeacher
                ? 'Tạo lớp học đầu tiên để bắt đầu giao bài tập cho học sinh'
                : 'Giáo viên sẽ thêm bạn vào lớp học theo tên đăng nhập'}
            </p>
            {isTeacher && (
              <button onClick={() => setCreateModal(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-[16px] font-bold text-white
                  bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400
                  transition-all shadow-md">
                <FaPlus size={12} /> Tạo lớp học
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map(c => {
              const myPending = isTeacher ? 0 : 0; // Will be counted server-side if needed
              return (
                <div key={c._id}
                  className="rounded-[24px] overflow-hidden hover:-translate-y-1 transition-all duration-300"
                  style={GLASS}>
                  {/* Banner */}
                  <div className="px-6 py-5 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 60%, #A78BFA 100%)' }}>
                    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5" />
                    <div className="absolute right-8 bottom-0 w-16 h-16 rounded-full bg-white/5" />
                    <div className="relative z-10 flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white text-base truncate">{c.name}</p>
                        <p className="text-white/70 text-xs mt-0.5">
                          {c.subject && `${c.subject} · `}
                          {c.grade && `Lớp ${c.grade} · `}
                          GV: {c.teacherName}
                        </p>
                      </div>
                      {isTeacher && (
                        <button onClick={e => { e.stopPropagation(); setDeletingId(c._id); }}
                          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-red-400/30 flex items-center
                            justify-center text-white/70 hover:text-white transition-all shrink-0 ml-3">
                          <FaTrash size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Body */}
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1.5 text-[#94A3B8] font-semibold">
                        <FaUsers size={11} /> {c.members.length} học sinh
                      </span>
                      <span className="flex items-center gap-1.5 text-[#94A3B8] font-semibold">
                        <FaBook size={11} /> GV: {c.teacherName}
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-[#94A3B8] text-xs mb-4 line-clamp-2">{c.description}</p>
                    )}
                    <button onClick={() => handleOpenClass(c._id)}
                      className="w-full py-2.5 rounded-[14px] bg-gradient-to-r from-violet-500 to-purple-500
                        hover:from-violet-400 hover:to-purple-400 text-white text-sm font-bold
                        flex items-center justify-center gap-2 transition-all shadow-sm">
                      Vào lớp <FaChevronRight size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

