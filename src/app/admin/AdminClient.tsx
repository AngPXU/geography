'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  FaArrowLeft, FaBell, FaChartBar, FaDatabase, FaEdit,
  FaGlobeAsia, FaPlus, FaSearch, FaShieldAlt, FaSpinner,
  FaTimes, FaTrash, FaUsers, FaDownload, FaExclamationTriangle,
  FaUserPlus, FaSortAmountDown, FaSortAmountUp, FaSchool,
} from 'react-icons/fa';
import QuizManager from './components/QuizManager';
import { Icon } from '@iconify/react';

/* ─────────────────────────── types ───────────────────────────── */

interface CardRow {
  _id: string;
  grade: number;
  lessonId: string;
  lessonTitle: string;
  lessonIcon: string;
  front: string;
  back: string;
  hint?: string;
  order: number;
  createdAt: string;
}

interface UserRow {
  _id: string;
  username: string;
  email?: string;
  role: number;
  fullName?: string;
  exp: number;
  streak: number;
  createdAt: string;
  provider?: string;
  avatar?: string;
}

interface StudentSuggestion {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  className?: string;
}

interface AdminMember {
  userId: string;
  username: string;
  fullName?: string;
  avatar?: string;
  joinedAt: string;
}

interface AdminClass {
  _id: string;
  name: string;
  subject?: string;
  description?: string;
  grade?: number;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  members: AdminMember[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalUsers: number;
  newUsers: number;
  totalFlashcards: number;
}

interface FormState {
  grade: string;
  lessonId: string;
  lessonTitle: string;
  lessonIcon: string;
  front: string;
  back: string;
  hint: string;
}

const EMPTY_FORM: FormState = {
  grade: '6',
  lessonId: '',
  lessonTitle: '',
  lessonIcon: '📚',
  front: '',
  back: '',
  hint: '',
};

const GRADE_COLORS: Record<number, string> = {
  6: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  7: 'bg-violet-100 text-violet-700 border-violet-200',
  8: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  9: 'bg-rose-100 text-rose-700 border-rose-200',
};

const ROLE_LABEL: Record<number, { label: string; cls: string }> = {
  1: { label: 'Admin',    cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  2: { label: 'Giáo viên', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  3: { label: 'Học sinh', cls: 'bg-sky-100 text-sky-700 border-sky-200' },
};

/* ─────────────────────────── components ──────────────────────── */

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number | string;
  sub?: string; color: string;
}) {
  return (
    <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-6
      shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex items-center gap-5">
      <div className={`w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[#082F49] text-3xl font-black leading-tight">{value}</p>
        {sub && <p className="text-[#94A3B8] text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─────────────────────────── helpers ─────────────────────────── */

const JSON_TEMPLATE_SINGLE = JSON.stringify(
  {
    grade: 6,
    lessonId: '6-1',
    lessonTitle: 'Bài 1: Trái Đất trong Hệ Mặt Trời',
    lessonIcon: '🌏',
    front: 'Trái Đất',
    back: 'Hành tinh thứ 3 tính từ Mặt Trời, khoảng cách ~150 triệu km.',
    hint: 'Gợi ý (tuỳ chọn)',
  },
  null,
  2
);

const JSON_TEMPLATE_ARRAY = JSON.stringify(
  [
    {
      grade: 6,
      lessonId: '6-1',
      lessonTitle: 'Bài 1: Trái Đất trong Hệ Mặt Trời',
      lessonIcon: '🌏',
      front: 'Trái Đất',
      back: 'Hành tinh thứ 3 tính từ Mặt Trời, khoảng cách ~150 triệu km.',
    },
    {
      grade: 6,
      lessonId: '6-1',
      lessonTitle: 'Bài 1: Trái Đất trong Hệ Mặt Trời',
      lessonIcon: '🌏',
      front: 'Hệ Mặt Trời',
      back: 'Gồm Mặt Trời và 8 hành tinh quay xung quanh.',
    },
  ],
  null,
  2
);

function formToJson(form: FormState): string {
  return JSON.stringify(
    {
      grade: Number(form.grade),
      lessonId: form.lessonId,
      lessonTitle: form.lessonTitle,
      lessonIcon: form.lessonIcon,
      front: form.front,
      back: form.back,
      ...(form.hint ? { hint: form.hint } : {}),
    },
    null,
    2
  );
}

function parseJsonToForms(text: string): { forms: FormState[]; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { forms: [], error: 'JSON không hợp lệ. Kiểm tra lại cú pháp.' };
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  const forms: FormState[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as Record<string, unknown>;
    if (!item.grade || !item.lessonId || !item.lessonTitle || !item.front || !item.back) {
      return {
        forms: [],
        error: `Mục ${i + 1}: thiếu trường bắt buộc (grade, lessonId, lessonTitle, front, back).`,
      };
    }
    const g = Number(item.grade);
    if (![6, 7, 8, 9].includes(g)) {
      return { forms: [], error: `Mục ${i + 1}: grade phải là 6, 7, 8 hoặc 9.` };
    }
    forms.push({
      grade: String(g),
      lessonId: String(item.lessonId).trim(),
      lessonTitle: String(item.lessonTitle).trim(),
      lessonIcon: String(item.lessonIcon ?? '📚').trim(),
      front: String(item.front).trim(),
      back: String(item.back).trim(),
      hint: item.hint ? String(item.hint).trim() : '',
    });
  }

  return { forms, error: '' };
}

/* ─────────────────────────── modal ───────────────────────────── */

function CardModal({
  mode, initial, onClose, onSave,
}: {
  mode: 'add' | 'edit';
  initial: FormState;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
}) {
  const [inputMode, setInputMode] = useState<'form' | 'json'>('form');
  const [form, setForm]           = useState<FormState>(initial);
  const [jsonText, setJsonText]   = useState(() => formToJson(initial));
  const [jsonPreview, setJsonPreview] = useState<{ count: number; error: string }>({ count: 1, error: '' });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  /* live-validate JSON as user types */
  useEffect(() => {
    if (inputMode !== 'json') return;
    if (!jsonText.trim()) { setJsonPreview({ count: 0, error: '' }); return; }
    const { forms, error: e } = parseJsonToForms(jsonText);
    setJsonPreview({ count: forms.length, error: e });
  }, [jsonText, inputMode]);

  /* sync: form → json when switching to json mode */
  const switchToJson = () => {
    setJsonText(formToJson(form));
    setInputMode('json');
    setError('');
  };

  /* sync: json → form when switching back (best-effort, single card) */
  const switchToForm = () => {
    const { forms, error: e } = parseJsonToForms(jsonText);
    if (!e && forms.length === 1) setForm(forms[0]);
    setInputMode('form');
    setError('');
  };

  const set = (k: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (inputMode === 'form') {
      if (!form.lessonId.trim() || !form.lessonTitle.trim() || !form.front.trim() || !form.back.trim()) {
        setError('Vui lòng điền đầy đủ các trường bắt buộc.');
        return;
      }
      setSaving(true);
      try { await onSave(form); onClose(); }
      catch (err: unknown) { setError(err instanceof Error ? err.message : 'Lỗi khi lưu'); }
      finally { setSaving(false); }
      return;
    }

    /* JSON mode */
    if (!jsonText.trim()) { setError('Nội dung JSON trống.'); return; }
    const { forms, error: parseErr } = parseJsonToForms(jsonText);
    if (parseErr) { setError(parseErr); return; }

    if (mode === 'edit' && forms.length > 1) {
      setError('Chế độ sửa chỉ chấp nhận 1 đối tượng JSON.');
      return;
    }

    setSaving(true);
    try {
      for (const f of forms) await onSave(f);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const isJsonValid = inputMode === 'json' && !jsonPreview.error && jsonPreview.count > 0;
  const submitLabel = () => {
    if (saving) return <><FaSpinner className="animate-spin" /> Đang lưu...</>;
    if (inputMode === 'json' && isJsonValid && jsonPreview.count > 1)
      return `Thêm ${jsonPreview.count} thẻ`;
    return mode === 'add' ? 'Thêm thẻ' : 'Lưu thay đổi';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-cyan-50 to-blue-50">
          <h3 className="font-black text-[#082F49] text-lg">
            {mode === 'add' ? '➕ Thêm thẻ mới' : '✏️ Sửa thẻ'}
          </h3>

          {/* Toggle */}
          <div className="flex items-center gap-2 mx-auto bg-white/80 border border-slate-200/80 rounded-full p-1">
            <button
              type="button"
              onClick={switchToForm}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-bold
                transition-all ${inputMode === 'form'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#334155]'}`}>
              <span>📝</span> Form
            </button>
            <button
              type="button"
              onClick={switchToJson}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-xs font-bold
                transition-all ${inputMode === 'json'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#334155]'}`}>
              <span>{'{}'}</span> JSON
            </button>
          </div>

          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center
              justify-center text-slate-500 transition-colors">
            <FaTimes className="text-xs" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-full bg-red-50 border
              border-red-200 text-red-600 text-sm font-semibold">
              <FaExclamationTriangle className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* ════════ FORM MODE ════════ */}
          {inputMode === 'form' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Lớp *</label>
                  <select value={form.grade} onChange={set('grade')}
                    className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                      text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                      focus:ring-2 focus:ring-cyan-100 transition-all">
                    {[6, 7, 8, 9].map(g => (
                      <option key={g} value={g}>Lớp {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Icon bài học</label>
                  <input value={form.lessonIcon} onChange={set('lessonIcon')}
                    className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                      text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                      focus:ring-2 focus:ring-cyan-100 transition-all"
                    placeholder="📚" maxLength={8} />
                </div>
              </div>

              {/* Lesson context — readonly info bar */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-full bg-slate-50
                border border-slate-200">
                <span className="text-xl shrink-0">{form.lessonIcon || '📚'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[#082F49] font-black text-xs truncate">{form.lessonTitle}</p>
                  <p className="text-[#94A3B8] text-[10px] font-semibold">
                    Lớp {form.grade} · Mã: {form.lessonId}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border
                  border-slate-200 px-2 py-0.5 rounded-full shrink-0">Bài học</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Mặt trước (thuật ngữ) *
                </label>
                <input value={form.front} onChange={set('front')} required
                  className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                    text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                    focus:ring-2 focus:ring-cyan-100 transition-all"
                  placeholder="Nhập thuật ngữ..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Mặt sau (định nghĩa) *
                </label>
                <textarea value={form.back} onChange={set('back')} required rows={3}
                  className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                    text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                    focus:ring-2 focus:ring-cyan-100 transition-all resize-none"
                  placeholder="Nhập định nghĩa / giải thích..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Gợi ý (tuỳ chọn)</label>
                <input value={form.hint} onChange={set('hint')}
                  className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                    text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                    focus:ring-2 focus:ring-cyan-100 transition-all"
                  placeholder="Gợi ý nhớ bài..." />
              </div>
            </>
          )}

          {/* ════════ JSON MODE ════════ */}
          {inputMode === 'json' && (
            <>
              {/* Info banner */}
              <div className="rounded-[20px] bg-[rgba(186,230,253,0.55)] border border-sky-200 px-4 py-3">
                <p className="text-[#0284C7] text-xs font-bold mb-1">
                  {mode === 'add'
                    ? '📋 Dán object JSON hoặc array JSON để thêm nhiều thẻ cùng lúc.'
                    : '📋 Dán object JSON để cập nhật thẻ này.'}
                </p>
                <p className="text-[#0284C7] text-[11px] font-semibold opacity-80">
                  Trường bắt buộc: <code className="bg-sky-100 px-1 rounded">grade</code>{' '}
                  <code className="bg-sky-100 px-1 rounded">lessonId</code>{' '}
                  <code className="bg-sky-100 px-1 rounded">lessonTitle</code>{' '}
                  <code className="bg-sky-100 px-1 rounded">front</code>{' '}
                  <code className="bg-sky-100 px-1 rounded">back</code>
                </p>
              </div>

              {/* Template buttons */}
              <div className="flex gap-2">
                <button type="button"
                  onClick={() => setJsonText(JSON_TEMPLATE_SINGLE)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                    bg-slate-100 border border-slate-200 text-[#334155] hover:bg-slate-200
                    transition-all">
                  📄 Template 1 thẻ
                </button>
                {mode === 'add' && (
                  <button type="button"
                    onClick={() => setJsonText(JSON_TEMPLATE_ARRAY)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                      bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100
                      transition-all">
                    📄 Template nhiều thẻ
                  </button>
                )}
                <button type="button"
                  onClick={() => {
                    try { setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2)); }
                    catch { /* ignore */ }
                  }}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                    font-bold bg-emerald-50 border border-emerald-200 text-emerald-600
                    hover:bg-emerald-100 transition-all">
                  ✨ Format
                </button>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Nội dung JSON *</label>
                <textarea
                  value={jsonText}
                  onChange={e => setJsonText(e.target.value)}
                  rows={12}
                  spellCheck={false}
                  className={`w-full px-4 py-3 rounded-[20px] border bg-slate-900 text-green-300
                    text-[12px] font-mono leading-relaxed focus:outline-none transition-all resize-y
                    ${jsonPreview.error
                      ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-200'
                    }`}
                  placeholder={JSON_TEMPLATE_SINGLE}
                />
              </div>

              {/* Live status */}
              {jsonText.trim() && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold
                  ${jsonPreview.error
                    ? 'bg-red-50 border border-red-200 text-red-600'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                  }`}>
                  <span>{jsonPreview.error ? '❌' : '✅'}</span>
                  {jsonPreview.error
                    ? jsonPreview.error
                    : `Hợp lệ — ${jsonPreview.count} thẻ sẽ được ${mode === 'add' ? 'thêm' : 'cập nhật'}`
                  }
                </div>
              )}
            </>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving || (inputMode === 'json' && !!jsonPreview.error)}
              className={`flex-1 py-2.5 rounded-full text-white text-sm font-bold
                disabled:opacity-50 transition-all flex items-center justify-center gap-2
                ${inputMode === 'json'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-400 hover:to-purple-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400'
                }`}>
              {submitLabel()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ───────────────────────── confirm dialog ─────────────────────── */

function ConfirmDialog({ message, onConfirm, onCancel, danger = true }: {
  message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] p-6 text-center">
        <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl mb-4
          ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <FaExclamationTriangle className={danger ? 'text-red-500' : 'text-amber-500'} />
        </div>
        <p className="text-[#082F49] font-bold text-base mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold
              text-[#334155] hover:bg-slate-50 transition-all">
            Huỷ
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-full text-white text-sm font-bold transition-all
              ${danger
                ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
              }`}>
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════ LESSON TYPES ════════════════════════════ */

interface LessonInfo {
  _id?: string;
  grade: number;
  lessonId: string;
  lessonTitle: string;
  lessonIcon: string;
}

interface LessonRow extends LessonInfo {
  _id: string;
  cardCount: number;
}

/* ── helpers ── */
const genLessonId = () =>
  `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;

/* ── LessonFormModal (Add / Edit lesson) ─────────────────────── */

function LessonFormModal({
  apiPrefix, mode, initial, onClose, onSaved,
}: {
  apiPrefix: string;
  mode: 'add' | 'edit';
  initial?: LessonRow;
  onClose: () => void;
  onSaved: (lesson: LessonRow) => void;
}) {
  const [grade, setGrade]             = useState(initial?.grade ?? 6);
  const [lessonId, setLessonId]       = useState(() => mode === 'add' ? genLessonId() : (initial?.lessonId ?? ''));
  const [lessonTitle, setLessonTitle] = useState(initial?.lessonTitle ?? '');
  const [lessonIcon, setLessonIcon]   = useState(initial?.lessonIcon ?? '📚');
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!lessonTitle.trim() || (mode === 'add' && !lessonId.trim())) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (mode === 'add') {
        res = await fetch(`${apiPrefix}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade, lessonId: lessonId.trim(), lessonTitle: lessonTitle.trim(), lessonIcon: lessonIcon.trim() || '📚' }),
        });
      } else {
        res = await fetch(`${apiPrefix}/lessons/${initial!._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonTitle: lessonTitle.trim(), lessonIcon: lessonIcon.trim() || '📚' }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu');
      onSaved({ ...(initial ?? { _id: data.lesson._id, grade, lessonId, cardCount: 0 }), ...data.lesson });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-emerald-50 to-cyan-50">
          <h3 className="font-black text-[#082F49] text-lg">
            {mode === 'add' ? '📂 Thêm bài học mới' : '✏️ Sửa bài học'}
          </h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center
              justify-center text-slate-500 transition-colors">
            <FaTimes className="text-xs" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-red-50 border
              border-red-200 text-red-600 text-sm font-semibold">
              <FaExclamationTriangle className="shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Lớp *</label>
              <select value={grade} onChange={e => setGrade(Number(e.target.value))}
                disabled={mode === 'edit'}
                className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                  text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                  focus:ring-2 focus:ring-cyan-100 transition-all disabled:opacity-60">
                {[6, 7, 8, 9].map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Icon</label>
              <input value={lessonIcon} onChange={e => setLessonIcon(e.target.value)}
                maxLength={8} placeholder="📚"
                className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                  text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                  focus:ring-2 focus:ring-cyan-100 transition-all" />
            </div>
          </div>
          {mode === 'add' && (
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">
                Mã định danh
                <span className="ml-1.5 text-[10px] font-semibold text-emerald-500 bg-emerald-50
                  border border-emerald-200 px-1.5 py-0.5 rounded-full">Tự động</span>
              </label>
              <div className="flex gap-2">
                <input value={lessonId} readOnly
                  className="flex-1 px-3 py-2.5 rounded-full border border-slate-200 bg-slate-100
                    text-sm font-mono text-[#334155] cursor-default select-all" />
                <button type="button" onClick={() => setLessonId(genLessonId())}
                  title="Tạo ID mới"
                  className="px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                    text-base hover:bg-slate-100 transition-all shrink-0">
                  🔄
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">Tên bài học *</label>
            <input value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required
              placeholder="Bài 1: Trái Đất trong Hệ Mặt Trời"
              className="w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50
                text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                focus:ring-2 focus:ring-cyan-100 transition-all" />
          </div>
          {mode === 'add' && (
            <div className="rounded-[20px] bg-[rgba(186,230,253,0.4)] border border-sky-200 px-4 py-3">
              <p className="text-[#0284C7] text-xs font-semibold">
                💡 Sau khi tạo, bạn sẽ được chuyển vào trang tạo thẻ ghi nhớ cho bài học này.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500
                text-white text-sm font-bold hover:from-emerald-400 hover:to-cyan-400 transition-all
                flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <FaSpinner className="animate-spin text-xs" />}
              {mode === 'add' ? 'Tạo bài học →' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

/* ── DeleteLessonConfirm ──────────────────────────────────────── */

function DeleteLessonConfirm({
  apiPrefix, lesson, onClose, onDeleted,
}: {
  apiPrefix: string;
  lesson: LessonRow;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  const handle = async () => {
    setDeleting(true);
    setError('');
    try {
      const res  = await fetch(`${apiPrefix}/lessons/${lesson._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xoá');
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setDeleting(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <FaExclamationTriangle className="text-red-500 text-sm" />
          </div>
          <h3 className="font-black text-red-700 text-base">Xoá bài học</h3>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-full bg-red-50 border border-red-200
              text-red-600 text-sm font-semibold">{error}</div>
          )}
          {/* Lesson info */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[20px] border border-slate-200">
            <span className="text-2xl shrink-0">{lesson.lessonIcon}</span>
            <div className="min-w-0">
              <p className="font-black text-[#082F49] text-sm truncate">{lesson.lessonTitle}</p>
              <p className="text-[#94A3B8] text-xs font-semibold">Lớp {lesson.grade} · Mã: {lesson.lessonId}</p>
            </div>
          </div>
          {/* Warning */}
          <div className="rounded-[20px] bg-[rgba(254,226,226,0.6)] border border-red-200 px-4 py-3">
            <p className="text-red-600 text-xs font-bold">
              ⚠️ Xoá bài học này sẽ xoá toàn bộ{' '}
              <span className="font-black">{lesson.cardCount} thẻ ghi nhớ</span>{' '}
              bên trong. Thao tác không thể hoàn tác.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button onClick={handle} disabled={deleting}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500
                text-white text-sm font-bold hover:from-red-400 hover:to-rose-400 transition-all
                flex items-center justify-center gap-2 disabled:opacity-50">
              {deleting && <FaSpinner className="animate-spin text-xs" />}
              Xoá bài học
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

/* ── Paginator ────────────────────────────────────────────────── */

function Paginator({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (arr[i - 1] as number) + 1 < p) acc.push('...');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
        className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200
          text-[#334155] disabled:opacity-40 hover:bg-slate-50 transition-all">
        ← Trước
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} className="px-1.5 text-[#94A3B8] text-xs">…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p as number)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-all
              ${page === p
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                : 'border border-slate-200 text-[#334155] hover:bg-slate-50'
              }`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200
          text-[#334155] disabled:opacity-40 hover:bg-slate-50 transition-all">
        Sau →
      </button>
    </div>
  );
}

/* ── LessonsView ──────────────────────────────────────────────── */

function LessonsView({ apiPrefix, onSelectLesson, onClearAll }: {
  apiPrefix: string;
  onSelectLesson: (l: LessonRow) => void;
  onClearAll: () => void;
}) {
  const [lessons, setLessons]           = useState<LessonRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [gradeFilter, setGradeFilter]   = useState<number | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [sortKey, setSortKey]           = useState<'grade' | 'title' | 'count'>('grade');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');
  const [page, setPage]                 = useState(1);
  const [formMode, setFormMode]         = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget]     = useState<LessonRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LessonRow | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const PAGE_SIZE = 14;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${apiPrefix}/lessons`);
      const data = await res.json();
      setLessons(data.lessons ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  const filtered = useMemo(() => {
    let list = lessons;
    if (gradeFilter !== 'all') list = list.filter(l => l.grade === gradeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.lessonTitle.toLowerCase().includes(q) || l.lessonId.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'grade') cmp = a.grade - b.grade || a.lessonId.localeCompare(b.lessonId);
      if (sortKey === 'title') cmp = a.lessonTitle.localeCompare(b.lessonTitle);
      if (sortKey === 'count') cmp = a.cardCount - b.cardCount;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [lessons, gradeFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[20px] text-sm font-bold
          shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all border
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
            : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#082F49]">📂 Bài học</h2>
          <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">
            {loading ? '...' : `${filtered.length} bài học`}
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button onClick={onClearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border
              border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-all">
            <FaTrash className="text-xs" /> Xoá tất cả
          </button>
          <button onClick={() => { setEditTarget(null); setFormMode('add'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold
              hover:from-emerald-400 hover:to-cyan-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
            <FaPlus className="text-xs" /> Thêm bài học
          </button>
        </div>
      </div>

      {/* Filter + Sort + Search */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
        p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)] space-y-3">
        {/* Grade pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 6, 7, 8, 9] as const).map(g => (
            <button key={g} onClick={() => { setGradeFilter(g); setPage(1); }}
              className={`px-4 py-1.5 rounded-[9999px] text-sm font-bold border transition-all
                ${gradeFilter === g
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-[0_8px_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-50 text-[#334155] border-slate-200 hover:border-cyan-300 hover:text-cyan-600'
                }`}>
              {g === 'all' ? 'Tất cả' : `Lớp ${g}`}
            </button>
          ))}
        </div>
        {/* Sort + Search row */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#94A3B8]">Sắp xếp:</span>
          {([['grade', 'Lớp'], ['title', 'Tên bài'], ['count', 'Số thẻ']] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => toggleSort(k)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                border transition-all
                ${sortKey === k
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : 'bg-slate-50 border-slate-200 text-[#334155] hover:border-cyan-200'
                }`}>
              {lbl} {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-200
            rounded-full px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2
            focus-within:ring-cyan-100 transition-all">
            <FaSearch className="text-[#94A3B8] text-xs shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm bài học..."
              className="bg-transparent text-sm font-semibold text-[#082F49]
                placeholder:text-[#94A3B8] outline-none w-36 sm:w-44" />
            {search && (
              <button onClick={() => setSearch('')}
                className="text-[#94A3B8] hover:text-slate-600 transition-colors">
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lessons grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
          <p className="text-[#94A3B8] font-semibold text-sm">Đang tải...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center text-4xl">📭</div>
          <p className="text-[#082F49] font-bold text-base">Chưa có bài học nào</p>
          <p className="text-[#94A3B8] text-sm font-semibold text-center px-4">
            Nhấn &quot;Thêm bài học&quot; để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {paginated.map(lesson => (
            <div key={`${lesson.grade}-${lesson.lessonId}`}
              className="flex items-center gap-3 bg-white/65 backdrop-blur-[24px] border border-white/80
                rounded-[24px] px-4 py-3 shadow-[0_4px_16px_rgba(14,165,233,0.07)]
                hover:shadow-[0_6px_20px_rgba(6,182,212,0.12)] hover:border-cyan-200
                hover:bg-white/90 transition-all duration-200">

              {/* Clickable main area */}
              <button onClick={() => onSelectLesson(lesson)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <span className="text-xl shrink-0">{lesson.lessonIcon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#082F49] text-sm truncate leading-tight">{lesson.lessonTitle}</p>
                  <p className="text-[#94A3B8] text-[11px] font-semibold mt-0.5">Mã: {lesson.lessonId}</p>
                </div>
              </button>

              {/* Right side: grade + count + actions */}
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${GRADE_COLORS[lesson.grade] ?? ''}`}>
                  Lớp {lesson.grade}
                </span>
                <span className="text-[#94A3B8] text-xs font-bold w-14 text-right">
                  {lesson.cardCount} thẻ
                </span>
                {/* Always-visible CRUD buttons */}
                <div className="flex gap-1 ml-1 pl-2 border-l border-slate-100">
                  <button
                    onClick={() => { setEditTarget(lesson); setFormMode('edit'); }}
                    title="Sửa bài học"
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                      flex items-center justify-center text-cyan-600 hover:bg-cyan-50
                      hover:border-cyan-300 transition-all">
                    <FaEdit className="text-[10px]" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    title="Xoá bài học"
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                      flex items-center justify-center text-red-400 hover:bg-red-50
                      hover:border-red-300 transition-all">
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[#94A3B8] text-xs font-semibold">
            Trang {page}/{totalPages} · {filtered.length} bài học
          </p>
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Add / Edit modal */}
      {formMode && (
        <LessonFormModal
          apiPrefix={apiPrefix}
          mode={formMode}
          initial={editTarget ?? undefined}
          onClose={() => { setFormMode(null); setEditTarget(null); }}
          onSaved={saved => {
            setFormMode(null);
            setEditTarget(null);
            if (formMode === 'add') {
              setLessons(prev => [...prev, { ...saved, cardCount: saved.cardCount ?? 0 }]);
              showToast('✅ Đã tạo bài học!');
              onSelectLesson(saved);
            } else {
              setLessons(prev => prev.map(l => l._id === saved._id ? { ...l, ...saved } : l));
              showToast('✅ Đã cập nhật bài học!');
            }
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteLessonConfirm
          apiPrefix={apiPrefix}
          lesson={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setLessons(prev => prev.filter(l => l._id !== deleteTarget._id));
            showToast('🗑️ Đã xoá bài học!', 'error');
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

/* ── CardsView ────────────────────────────────────────────────── */

function CardsView({ apiPrefix, lesson, onBack, onRefreshLessons }: {
  apiPrefix: string;
  lesson: LessonRow;
  onBack: () => void;
  onRefreshLessons: () => void;
}) {
  const [cards, setCards]               = useState<CardRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [sortKey, setSortKey]           = useState<'order' | 'front' | 'createdAt'>('order');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');
  const [page, setPage]                 = useState(1);
  const PAGE_SIZE = 14;

  const [modalOpen, setModalOpen]       = useState(false);
  const [modalMode, setModalMode]       = useState<'add' | 'edit'>('add');
  const [editingCard, setEditingCard]   = useState<CardRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CardRow | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // drag-to-reorder state
  const [dragIdx, setDragIdx]           = useState<number | null>(null);
  const [overIdx, setOverIdx]           = useState<number | null>(null);
  const [reordering, setReordering]     = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ lessonId: lesson.lessonId, grade: String(lesson.grade) });
      const res  = await fetch(`${apiPrefix}?${params}`);
      const data = await res.json();
      setCards(data.cards ?? []);
    } finally { setLoading(false); }
  }, [lesson]);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  const filtered = useMemo(() => {
    let list = cards;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.hint ?? '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'order')     cmp = a.order - b.order;
      if (sortKey === 'front')     cmp = a.front.localeCompare(b.front);
      if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [cards, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleAdd = async (form: FormState) => {
    const res = await fetch(`${apiPrefix}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, grade: Number(form.grade) }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Lỗi'); }
    showToast('Đã thêm thẻ!');
    fetchCards();
    onRefreshLessons();
  };

  const handleEdit = async (form: FormState) => {
    if (!editingCard) return;
    const res = await fetch(`${apiPrefix}/${editingCard._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, grade: Number(form.grade) }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Lỗi'); }
    showToast('Đã cập nhật!');
    fetchCards();
  };

  const handleDelete = async (card: CardRow) => {
    const res = await fetch(`${apiPrefix}/${card._id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Xoá thất bại', 'error'); return; }
    showToast('Đã xoá thẻ!');
    fetchCards();
    onRefreshLessons();
  };

  const openAdd  = () => { setModalMode('add');  setEditingCard(null); setModalOpen(true); };
  const openEdit = (card: CardRow) => { setModalMode('edit'); setEditingCard(card); setModalOpen(true); };

  // drag is only available when sorted by order asc with no search
  const canDrag = sortKey === 'order' && sortDir === 'asc' && !search.trim();

  const handleDrop = async (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setOverIdx(null); return; }
    const fromAbs = (page - 1) * PAGE_SIZE + dragIdx;
    const toAbs   = (page - 1) * PAGE_SIZE + toIdx;
    const reordered = [...filtered];
    const [moved] = reordered.splice(fromAbs, 1);
    reordered.splice(toAbs, 0, moved);
    const withOrders = reordered.map((c, i) => ({ ...c, order: i }));
    setCards(withOrders);
    setDragIdx(null); setOverIdx(null);
    setReordering(true);
    try {
      const res = await fetch(`${apiPrefix}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: withOrders.map(c => ({ id: c._id, order: c.order })) }),
      });
      if (!res.ok) throw new Error();
      showToast('✅ Đã cập nhật thứ tự thẻ!');
    } catch {
      showToast('Lỗi khi cập nhật thứ tự', 'error');
      fetchCards();
    } finally { setReordering(false); }
  };

  const defaultAddForm: FormState = {
    ...EMPTY_FORM,
    grade: String(lesson.grade),
    lessonId: lesson.lessonId,
    lessonTitle: lesson.lessonTitle,
    lessonIcon: lesson.lessonIcon,
  };

  const editForm: FormState = editingCard
    ? {
        grade: String(editingCard.grade), lessonId: editingCard.lessonId,
        lessonTitle: editingCard.lessonTitle, lessonIcon: editingCard.lessonIcon,
        front: editingCard.front, back: editingCard.back, hint: editingCard.hint ?? '',
      }
    : defaultAddForm;

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-6 right-6 z-[99999] px-5 py-3 rounded-[24px] text-sm font-bold
          shadow-lg border
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] text-[#16A34A] border-green-200'
            : 'bg-[rgba(254,226,226,0.95)] text-[#DC2626] border-red-200'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold
              text-sm transition-colors group">
            <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200
              flex items-center justify-center transition-colors">
              <FaArrowLeft className="text-xs" />
            </span>
            <span className="hidden sm:inline">Danh sách bài học</span>
          </button>
          <span className="text-slate-300 font-bold">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{lesson.lessonIcon}</span>
            <div>
              <p className="font-black text-[#082F49] text-sm leading-none">{lesson.lessonTitle}</p>
              <p className="text-[#94A3B8] text-xs font-semibold mt-0.5">
                Lớp {lesson.grade} · {cards.length} thẻ
              </p>
            </div>
          </div>
        </div>
        <button onClick={openAdd}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-full
            bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold
            hover:from-cyan-400 hover:to-blue-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
          <FaPlus className="text-xs" /> Thêm thẻ
        </button>
      </div>

      {/* Sort + Search bar */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
        p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex flex-wrap gap-3 items-center">
        <span className="text-xs font-bold text-[#94A3B8]">Sắp xếp:</span>
        {([['order', 'Thứ tự'], ['front', 'A-Z'], ['createdAt', 'Ngày tạo']] as const).map(([k, lbl]) => (
          <button key={k} onClick={() => toggleSort(k)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
              border transition-all
              ${sortKey === k
                ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                : 'bg-slate-50 border-slate-200 text-[#334155] hover:border-cyan-200'
              }`}>
            {lbl} {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-200
          rounded-full px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2
          focus-within:ring-cyan-100 transition-all">
          <FaSearch className="text-[#94A3B8] text-xs shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Tìm thẻ..."
            className="bg-transparent text-sm font-semibold text-[#082F49]
              placeholder:text-[#94A3B8] outline-none w-32 sm:w-44" />
          {search && (
            <button onClick={() => setSearch('')}
              className="text-[#94A3B8] hover:text-slate-600 transition-colors">
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Cards table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
          <p className="text-[#94A3B8] font-semibold text-sm">Đang tải...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center text-4xl">📭</div>
          <p className="text-[#082F49] font-bold">
            {cards.length === 0 ? 'Bài học chưa có thẻ nào' : 'Không tìm thấy thẻ phù hợp'}
          </p>
          {cards.length === 0 && (
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-full
                bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold
                hover:from-cyan-400 hover:to-blue-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
              <FaPlus className="text-xs" /> Thêm thẻ đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
          shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
          {/* Drag hint */}
          {canDrag && (
            <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100
              bg-gradient-to-r from-cyan-50/60 to-transparent">
              <span className="text-sm">☰</span>
              <p className="text-[#0284C7] text-xs font-semibold">
                Giữ và kéo hàng để sắp xếp lại thứ tự thẻ{reordering ? ' · Đang lưu...' : ''}
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white/40 backdrop-blur-md">
                  {canDrag && <th className="w-8 px-3 py-3" />}
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs w-[5%]">#</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs w-[30%]">Mặt trước</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs w-[45%]">Mặt sau</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">Gợi ý</th>
                  <th className="px-5 py-3 text-[#94A3B8] font-bold text-xs text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((card, idx) => (
                  <tr
                    key={card._id}
                    draggable={canDrag}
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
                    onDragLeave={e => {
                      if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
                        setOverIdx(null);
                    }}
                    onDrop={e => { e.preventDefault(); handleDrop(idx); }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                    className={[
                      'border-b transition-colors',
                      dragIdx === idx ? 'opacity-40 bg-slate-100' : 'hover:bg-cyan-50/30',
                      overIdx === idx && dragIdx !== idx ? 'border-t-2 border-t-cyan-500' : 'border-slate-50',
                    ].join(' ')}
                  >
                    {canDrag && (
                      <td className="px-3 py-3 w-8">
                        <span className="text-slate-300 hover:text-slate-400 cursor-grab
                          active:cursor-grabbing select-none text-base leading-none">⠿</span>
                      </td>
                    )}
                    <td className="px-5 py-3 text-[#94A3B8] text-xs font-bold">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-5 py-3 font-bold text-[#082F49]">
                      {card.front.length > 40 ? card.front.slice(0, 40) + '…' : card.front}
                    </td>
                    <td className="px-5 py-3 text-[#334155]">
                      {card.back.length > 80 ? card.back.slice(0, 80) + '…' : card.back}
                    </td>
                    <td className="px-5 py-3 text-[#94A3B8] italic text-xs">{card.hint ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(card)}
                          className="w-7 h-7 rounded-full bg-cyan-50 border border-cyan-200
                            flex items-center justify-center text-cyan-600 hover:bg-cyan-100
                            transition-colors">
                          <FaEdit className="text-[10px]" />
                        </button>
                        <button onClick={() => setConfirmDelete(card)}
                          className="w-7 h-7 rounded-full bg-red-50 border border-red-200
                            flex items-center justify-center text-red-500 hover:bg-red-100
                            transition-colors">
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-[#94A3B8] text-xs font-semibold">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} thẻ
              </p>
              <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <CardModal
          mode={modalMode}
          initial={modalMode === 'edit' ? editForm : defaultAddForm}
          onClose={() => setModalOpen(false)}
          onSave={modalMode === 'add' ? handleAdd : handleEdit}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          message={`Xoá thẻ "${confirmDelete.front}"? Thao tác này không thể hoàn tác.`}
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════ DATA TAB (orchestrator) ═════════════════ */

function DataManager({ apiPrefix, title }: { apiPrefix: string; title: string }) {
  const [view, setView]                     = useState<'lessons' | 'cards'>('lessons');
  const [selectedLesson, setSelectedLesson] = useState<LessonRow | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmSeed, setConfirmSeed]         = useState(false);
  const [seeding, setSeeding]                 = useState(false);
  const [toast, setToast]                     = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [lessonsKey, setLessonsKey]           = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectLesson = (lesson: LessonRow) => {
    setSelectedLesson(lesson);
    setView('cards');
  };

  const handleBack = () => { setView('lessons'); setSelectedLesson(null); };

  const handleClearAll = async () => {
    const res = await fetch(`${apiPrefix}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Xoá thất bại', 'error'); return; }
    showToast('Đã xoá toàn bộ thẻ!');
    if (view === 'cards') handleBack();
    setLessonsKey(k => k + 1);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res  = await fetch(`${apiPrefix}/seed`, { method: 'POST' });
      const data = await res.json();
      if (data.skipped) showToast(data.message, 'error');
      else { showToast(`Đã nhập ${data.count} thẻ từ dữ liệu gốc!`); setLessonsKey(k => k + 1); }
    } catch { showToast('Lỗi khi nhập dữ liệu', 'error'); }
    finally { setSeeding(false); }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-[99999] px-5 py-3 rounded-[24px] text-sm font-bold
          shadow-lg border
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] text-[#16A34A] border-green-200'
            : 'bg-[rgba(254,226,226,0.95)] text-[#DC2626] border-red-200'
          }`}>
          {toast.msg}
        </div>
      )}

      {view === 'lessons' && (
        <LessonsView apiPrefix={apiPrefix} key={lessonsKey} onSelectLesson={handleSelectLesson} onClearAll={() => setConfirmClearAll(true)} />
      )}
      {view === 'cards' && selectedLesson && (
        <CardsView
          apiPrefix={apiPrefix}
          lesson={selectedLesson}
          onBack={handleBack}
          onRefreshLessons={() => setLessonsKey(k => k + 1)}
        />
      )}

      {confirmClearAll && (
        <ConfirmDialog
          message="Xoá TOÀN BỘ thẻ trong database? Thao tác này không thể hoàn tác."
          onConfirm={() => { handleClearAll(); setConfirmClearAll(false); }}
          onCancel={() => setConfirmClearAll(false)}
        />
      )}
      {confirmSeed && (
        <ConfirmDialog
          message="Nhập toàn bộ dữ liệu mặc định vào database? (Chỉ hoạt động khi DB chưa có dữ liệu)"
          onConfirm={() => { handleSeed(); setConfirmSeed(false); }}
          onCancel={() => setConfirmSeed(false)}
          danger={false}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   BẢN ĐỒ TAB — helper types + sub-components
══════════════════════════════════════════════ */

type EcoSortField = 'name' | 'gdpPerCapita' | 'population' | 'area' | 'lifeExpectancy';

const MAP_CATEGORIES = [
  { key: 'economic', label: 'Kinh tế',   icon: '🏭', color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200'  },
  { key: 'physical', label: 'Địa hình',  icon: '⛰️', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'ocean',    label: 'Đại dương', icon: '🌊', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200'   },
  { key: 'climate',  label: 'Khí hậu',  icon: '🌡️', color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200'   },
  { key: 'vietnam',  label: 'Việt Nam',  icon: '🇻🇳', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200'    },
];

const INCOME_MAP: Record<string, { label: string; color: string; bg: string; dot: string; pill: string }> = {
  HIC: { label: 'Thu nhập cao',    color: 'text-amber-700',   bg: 'bg-amber-50',   dot: '#F59E0B', pill: 'bg-amber-50 border border-amber-200 text-amber-700'     },
  UMC: { label: 'Trên trung bình', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: '#10B981', pill: 'bg-emerald-50 border border-emerald-200 text-emerald-700' },
  LMC: { label: 'Dưới trung bình', color: 'text-blue-700',    bg: 'bg-blue-50',    dot: '#3B82F6', pill: 'bg-blue-50 border border-blue-200 text-blue-700'         },
  LIC: { label: 'Thu nhập thấp',   color: 'text-rose-700',    bg: 'bg-rose-50',    dot: '#F43F5E', pill: 'bg-rose-50 border border-rose-200 text-rose-700'         },
  INX: { label: 'Không phân loại', color: 'text-slate-600',   bg: 'bg-slate-50',   dot: '#94A3B8', pill: 'bg-slate-50 border border-slate-200 text-slate-600'      },
};

const INCOME_OPTIONS_MAP = [
  { value: 'HIC', label: 'Thu nhập cao',    dot: '#F59E0B' },
  { value: 'UMC', label: 'Trên trung bình', dot: '#10B981' },
  { value: 'LMC', label: 'Dưới trung bình', dot: '#3B82F6' },
  { value: 'LIC', label: 'Thu nhập thấp',   dot: '#F43F5E' },
  { value: 'INX', label: 'Không phân loại', dot: '#94A3B8' },
];

function flagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return '🏳️';
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(
    iso2.toUpperCase().charCodeAt(0) + offset,
    iso2.toUpperCase().charCodeAt(1) + offset,
  );
}
function fmtUSD(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${Math.round(v).toLocaleString('en-US')}`;
}
function fmtPop(n: number | null | undefined) {
  if (n == null || isNaN(Number(n))) return '—';
  const v = Number(n);
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(Math.round(v));
}

interface CdvForm {
  capitalCity: string; incomeLevelCode: string;
  gdpPerCapita: string; gdpTotal: string; population: string;
  unemployment: string; lifeExpectancy: string;
  nameOfficial: string; area: string;
  tld: string; callingCodes: string; unMember: boolean;
  flagImage: string;
  images: string[];
}

function CdvFieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-[#334155] mb-1">{children}</label>;
}
function CdvReadonly({ value }: { value: string }) {
  return (
    <div className="w-full px-3 py-2.5 rounded-[16px] border border-slate-100 bg-slate-50/60 text-sm text-[#334155] font-semibold min-h-[40px]">
      {value || <span className="text-[#94A3B8]">—</span>}
    </div>
  );
}
function CdvInput({ value, onChange, type = 'text', placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-[16px] border border-slate-200 bg-white text-sm
        text-[#082F49] font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
    />
  );
}

/* ── CountryDetailView (inline — không có page wrapper) ── */
function CountryDetailView({ country: initial, onBack, onDeleted, onUpdated }: {
  country: any;
  onBack: () => void;
  onDeleted: () => void;
  onUpdated: (updated: any) => void;
}) {
  const [country, setCountry] = useState(initial);
  const a = country.attributes ?? {};
  const flag = flagEmoji(a.iso2);
  const incCode: string = a.incomeLevelCode ?? 'INX';
  const incInfo = INCOME_OPTIONS_MAP.find(o => o.value === incCode) ?? INCOME_OPTIONS_MAP[4];

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CdvForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const startEdit = () => {
    setForm({
      capitalCity: a.capitalCity ?? '',
      incomeLevelCode: a.incomeLevelCode ?? 'INX',
      gdpPerCapita: a.gdpPerCapita != null ? String(a.gdpPerCapita) : '',
      gdpTotal: a.gdpTotal != null ? String(a.gdpTotal) : '',
      population: a.population != null ? String(a.population) : '',
      unemployment: a.unemployment != null ? String(a.unemployment) : '',
      lifeExpectancy: a.lifeExpectancy != null ? String(a.lifeExpectancy) : '',
      nameOfficial: a.nameOfficial ?? '',
      area: a.area != null ? String(a.area) : '',
      tld: Array.isArray(a.tld) ? a.tld.join(', ') : (a.tld ?? ''),
      callingCodes: Array.isArray(a.callingCodes) ? a.callingCodes.join(', ') : (a.callingCodes ?? ''),
      unMember: a.unMember ?? true,
      flagImage: a.flagImage ?? '',
      images: Array.isArray(a.images) ? a.images.filter(Boolean) : [],
    });
    setSaveError('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true); setSaveError('');
    try {
      const patch = {
        attributes: {
          ...country.attributes,
          capitalCity: form.capitalCity,
          incomeLevelCode: form.incomeLevelCode,
          incomeLevel: INCOME_OPTIONS_MAP.find(o => o.value === form.incomeLevelCode)?.label ?? form.incomeLevelCode,
          gdpPerCapita: form.gdpPerCapita !== '' ? parseFloat(form.gdpPerCapita) : undefined,
          gdpTotal: form.gdpTotal !== '' ? parseFloat(form.gdpTotal) : undefined,
          population: form.population !== '' ? parseFloat(form.population) : undefined,
          unemployment: form.unemployment !== '' ? parseFloat(form.unemployment) : undefined,
          lifeExpectancy: form.lifeExpectancy !== '' ? parseFloat(form.lifeExpectancy) : undefined,
          nameOfficial: form.nameOfficial,
          area: form.area !== '' ? parseFloat(form.area) : undefined,
          tld: form.tld.split(',').map((s: string) => s.trim()).filter(Boolean),
          callingCodes: form.callingCodes.split(',').map((s: string) => s.trim()).filter(Boolean),
          unMember: form.unMember,
          flagImage: form.flagImage.trim() || undefined,
          images: (form.images ?? []).filter(Boolean),
        },
      };
      const res = await fetch(`/api/map/features/${country._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại');
      const updated = data.feature ?? { ...country, attributes: patch.attributes };
      setCountry(updated);
      onUpdated(updated);
      setEditing(false);
      showToast('Đã lưu thay đổi!');
    } catch (err: any) { setSaveError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/map/features/${country._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xoá thất bại');
      onDeleted();
    } catch (err: any) { showToast(err.message, 'error'); setDeleting(false); }
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[20px] text-sm font-bold
          shadow-[0_8px_24px_rgba(0,0,0,0.12)] border ${
            toast.type === 'success'
              ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
              : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>{toast.msg}</div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm bg-[rgba(255,255,255,0.92)] backdrop-blur-[24px]
            border border-white/80 rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto">
              <FaTrash className="text-lg" />
            </div>
            <p className="text-center font-bold text-[#082F49]">
              Xoá quốc gia &ldquo;{country.name}&rdquo;?<br />
              <span className="text-sm font-normal text-[#94A3B8]">Thao tác này không thể hoàn tác.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold text-[#334155] hover:bg-slate-50 transition-all">
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting && <FaSpinner className="animate-spin text-xs" />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack}
            className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold text-sm transition-colors group">
            <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
              <FaArrowLeft className="text-xs" />
            </span>
            <span className="hidden sm:inline">Danh sách Quốc gia</span>
          </button>
          <span className="text-slate-300 font-bold">/</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl leading-none">{flag}</span>
            <div>
              <p className="font-black text-[#082F49] text-sm leading-none">{country.name}</p>
              <p className="text-[#94A3B8] text-xs font-semibold mt-0.5">{a.iso2} · {a.iso3}</p>
            </div>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setSaveError(''); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-bold text-[#334155] hover:bg-slate-50 transition-all">
                <FaTimes className="text-xs" /> Huỷ
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#06B6D4,#0284c7)', boxShadow: '0 8px 20px rgba(6,182,212,0.35)' }}>
                {saving && <FaSpinner className="animate-spin text-xs" />}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-200 bg-cyan-50 text-sm font-bold text-cyan-700 hover:bg-cyan-100 transition-all">
                <FaEdit className="text-xs" /> Chỉnh sửa
              </button>
              <button onClick={() => setConfirmDelete(true)} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200 bg-rose-50 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-60">
                {deleting ? <FaSpinner className="animate-spin text-xs" /> : <FaTrash className="text-xs" />}
                Xoá
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <div className="bg-[rgba(254,226,226,0.9)] border border-red-200 text-red-700 text-sm font-bold px-5 py-3 rounded-[20px]">
          ❌ {saveError}
        </div>
      )}

      {/* Hero card */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] px-6 py-5 shadow-sm">
        <div className="flex items-center gap-5">
          {/* Flag image */}
          <div className="flex-shrink-0">
            {a.flagImage ? (
              <div className="w-24 h-16 rounded-[16px] overflow-hidden border border-white/80 shadow-[0_4px_16px_rgba(14,165,233,0.15)] bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.flagImage} alt={`Cờ ${country.name}`}
                  className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-16 rounded-[16px] border border-dashed border-slate-300 bg-slate-50/80
                flex flex-col items-center justify-center gap-1 text-[#94A3B8]">
                <span className="text-2xl leading-none">{flag}</span>
                <span className="text-[9px] font-bold">Chưa có ảnh</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-[#082F49] leading-tight">{country.name}</h2>
            {a.nameOfficial && a.nameOfficial !== country.name && (
              <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">{a.nameOfficial}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {a.iso2 && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.iso2}</span>}
              {a.iso3 && <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.iso3}</span>}
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${INCOME_MAP[incCode]?.pill ?? INCOME_MAP['INX'].pill}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: incInfo.dot }} />
                {incInfo.label}
              </span>
              {a.unMember === true && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">🇺🇳 LHQ</span>
              )}
            </div>
          </div>
        </div>

        {/* Flag image path — chỉ hiện khi editing */}
        {editing && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <CdvFieldLabel>Đường dẫn ảnh cờ (trong /public/flag/)</CdvFieldLabel>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <CdvInput
                  value={form!.flagImage}
                  onChange={v => setForm(p => p && ({ ...p, flagImage: v }))}
                  placeholder="VD: /flag/vn.png"
                />
              </div>
              {form!.flagImage && (
                <div className="w-14 h-10 rounded-[12px] overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form!.flagImage} alt="preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
            <p className="text-[10px] text-[#94A3B8] font-semibold mt-1.5">
              Đặt ảnh vào thư mục <code className="bg-slate-100 px-1 rounded">public/flag/</code>, nhập đường dẫn bắt đầu từ <code className="bg-slate-100 px-1 rounded">/flag/</code>
            </p>
          </div>
        )}
      </div>

      {/* Hình ảnh quốc gia — card riêng, luôn hiển thị */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-[#082F49]">🖼️ Hình ảnh quốc gia</h3>
          {editing && (
            <button type="button"
              onClick={() => setForm(p => p && ({ ...p, images: [...(p.images ?? []), ''] }))}
              className="text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5">
              + Thêm URL
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            {(form!.images ?? []).length === 0 && (
              <p className="text-sm text-[#94A3B8] italic text-center py-4">
                Chưa có ảnh nào. Nhấn &ldquo;+ Thêm URL&rdquo; để bắt đầu.
              </p>
            )}
            {(form!.images ?? []).map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={e => setForm(p => {
                    if (!p) return p;
                    const imgs = [...(p.images ?? [])]; imgs[i] = e.target.value;
                    return { ...p, images: imgs };
                  })}
                  placeholder={`https://... (URL ảnh ${i + 1})`}
                  className="flex-1 px-3 py-2.5 rounded-[14px] border border-slate-200 bg-white/80 text-sm text-[#334155]
                    font-medium outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                />
                <button type="button"
                  onClick={() => setForm(p => {
                    if (!p) return p;
                    return { ...p, images: (p.images ?? []).filter((_, j) => j !== i) };
                  })}
                  className="w-8 h-8 rounded-full bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center flex-shrink-0 hover:bg-rose-100 transition-all">
                  <FaTimes className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          Array.isArray(a.images) && a.images.filter(Boolean).length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {a.images.filter(Boolean).map((url: string, i: number) => (
                <div key={i} className="aspect-video rounded-[16px] overflow-hidden border border-slate-100 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${country.name} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#94A3B8] italic text-center py-4">
              Chưa có hình ảnh. Nhấn &ldquo;Chỉnh sửa&rdquo; để thêm URL ảnh.
            </p>
          )
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Địa lý & Hành chính */}
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-6 shadow-sm space-y-4">
          <h3 className="flex items-center font-black text-[#082F49]"><Icon icon="mingcute:map-line" width={22} />&nbsp; Địa lý &amp; Hành chính</h3>

          <div><CdvFieldLabel>Tên chính thức</CdvFieldLabel>
            {editing ? <CdvInput value={form!.nameOfficial} onChange={v => setForm(p => p && ({ ...p, nameOfficial: v }))} />
                     : <CdvReadonly value={a.nameOfficial ?? ''} />}</div>

          <div><CdvFieldLabel>Thủ đô</CdvFieldLabel>
            {editing ? <CdvInput value={form!.capitalCity} onChange={v => setForm(p => p && ({ ...p, capitalCity: v }))} placeholder="VD: Hanoi" />
                     : <CdvReadonly value={a.capitalCity ?? ''} />}</div>

          <div className="grid grid-cols-2 gap-3">
            <div><CdvFieldLabel>Khu vực</CdvFieldLabel><CdvReadonly value={a.region ?? ''} /></div>
            <div><CdvFieldLabel>Tiểu vùng</CdvFieldLabel><CdvReadonly value={a.subregion ?? ''} /></div>
          </div>

          <div><CdvFieldLabel>Diện tích (km²)</CdvFieldLabel>
            {editing ? <CdvInput value={form!.area} onChange={v => setForm(p => p && ({ ...p, area: v }))} type="number" placeholder="VD: 331212" />
                     : <CdvReadonly value={a.area != null ? `${Number(a.area).toLocaleString('vi-VN')} km²` : ''} />}</div>

          <div><CdvFieldLabel>TLD (phân cách bởi dấu phẩy)</CdvFieldLabel>
            {editing ? <CdvInput value={form!.tld} onChange={v => setForm(p => p && ({ ...p, tld: v }))} placeholder=".vn, .viet" />
                     : <CdvReadonly value={Array.isArray(a.tld) ? a.tld.join(', ') : (a.tld ?? '')} />}</div>

          <div><CdvFieldLabel>Mã điện thoại (phân cách bởi dấu phẩy)</CdvFieldLabel>
            {editing ? <CdvInput value={form!.callingCodes} onChange={v => setForm(p => p && ({ ...p, callingCodes: v }))} placeholder="+84" />
                     : <CdvReadonly value={Array.isArray(a.callingCodes) ? a.callingCodes.join(', ') : (a.callingCodes ?? '')} />}</div>

          <div><CdvFieldLabel>Tiền tệ (chỉ đọc)</CdvFieldLabel>
            <CdvReadonly value={
              Array.isArray(a.currencies) && a.currencies.length > 0
                ? a.currencies.join(' · ')
                : ''
            } /></div>

          <div><CdvFieldLabel>Thành viên Liên Hợp Quốc</CdvFieldLabel>
            {editing ? (
              <div className="flex gap-3">
                {([true, false] as const).map(v => (
                  <button key={String(v)} type="button" onClick={() => setForm(p => p && ({ ...p, unMember: v }))}
                    className={`flex-1 py-2 rounded-full text-sm font-bold border transition-all ${
                      form!.unMember === v
                        ? v ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>{v ? '✅ Có' : '❌ Không'}</button>
                ))}
              </div>
            ) : <CdvReadonly value={a.unMember === true ? ' Có' : a.unMember === false ? '❌ Không' : ''} />}</div>
        </div>

        {/* Kinh tế */}
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-6 shadow-sm space-y-4">
          <h3 className="flex items-center font-black text-[#082F49]"><Icon icon="mingcute:receive-money-line" width={22} />&nbsp; Kinh tế</h3>

          <div><CdvFieldLabel>Mức thu nhập</CdvFieldLabel>
            {editing ? (
              <select value={form!.incomeLevelCode}
                onChange={e => setForm(p => p && ({ ...p, incomeLevelCode: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-[16px] border border-slate-200 bg-white text-sm text-[#082F49]
                  font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 cursor-pointer">
                {INCOME_OPTIONS_MAP.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <div className="py-1">
                <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full ${INCOME_MAP[incCode]?.pill ?? INCOME_MAP['INX'].pill}`}>
                  <span className="w-2 h-2 rounded-full" style={{ background: incInfo.dot }} />
                  {incInfo.label}
                </span>
              </div>
            )}</div>

          <div><CdvFieldLabel>GDP / đầu người (USD)</CdvFieldLabel>
            {editing ? <CdvInput value={form!.gdpPerCapita} onChange={v => setForm(p => p && ({ ...p, gdpPerCapita: v }))} type="number" placeholder="VD: 3756" />
                     : <CdvReadonly value={a.gdpPerCapita != null ? `$${Number(a.gdpPerCapita).toLocaleString('en-US')}` : ''} />}</div>

          <div><CdvFieldLabel>Tổng GDP (USD)</CdvFieldLabel>
            {editing ? <CdvInput value={form!.gdpTotal} onChange={v => setForm(p => p && ({ ...p, gdpTotal: v }))} type="number" placeholder="VD: 409000000000" />
                     : <CdvReadonly value={a.gdpTotal != null ? `$${Number(a.gdpTotal).toLocaleString('en-US')}` : ''} />}</div>

          <div><CdvFieldLabel>Dân số</CdvFieldLabel>
            {editing ? <CdvInput value={form!.population} onChange={v => setForm(p => p && ({ ...p, population: v }))} type="number" placeholder="VD: 98186856" />
                     : <CdvReadonly value={a.population != null ? `${Number(a.population).toLocaleString('vi-VN')} người` : ''} />}</div>

          <div><CdvFieldLabel>Tỷ lệ thất nghiệp (%)</CdvFieldLabel>
            {editing ? <CdvInput value={form!.unemployment} onChange={v => setForm(p => p && ({ ...p, unemployment: v }))} type="number" placeholder="VD: 2.3" />
                     : <CdvReadonly value={a.unemployment != null ? `${Number(a.unemployment).toFixed(1)}%` : ''} />}</div>

          <div><CdvFieldLabel>Tuổi thọ trung bình (năm)</CdvFieldLabel>
            {editing ? <CdvInput value={form!.lifeExpectancy} onChange={v => setForm(p => p && ({ ...p, lifeExpectancy: v }))} type="number" placeholder="VD: 73.4" />
                     : <CdvReadonly value={a.lifeExpectancy != null ? `${Number(a.lifeExpectancy).toFixed(1)} tuổi` : ''} />}</div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Tham chiếu (chỉ đọc)</p>
            <div className="grid grid-cols-3 gap-3">
              <div><CdvFieldLabel>ISO2</CdvFieldLabel><CdvReadonly value={a.iso2 ?? ''} /></div>
              <div><CdvFieldLabel>ISO3</CdvFieldLabel><CdvReadonly value={a.iso3 ?? ''} /></div>
              <div><CdvFieldLabel>Toạ độ</CdvFieldLabel><CdvReadonly value={`${country.lat ?? '—'}, ${country.lng ?? '—'}`} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── MapTab — manages view state like QuizManager ── */
function MapTab() {
  const [view, setView] = useState<'overview' | 'detail'>('overview');
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);

  /* seed state */
  const [stats, setStats] = useState<{ total: number; categories: Record<string, number> } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedLog, setSeedLog] = useState<{ type: 'success' | 'error' | 'info'; msg: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  /* countries list state */
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [search, setSearch] = useState('');
  const [filterIncome, setFilterIncome] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [sortField, setSortField] = useState<EcoSortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const regions = useMemo(() => {
    const set = new Set<string>();
    countries.forEach(c => { if (c.attributes?.region) set.add(c.attributes.region); });
    return Array.from(set).sort();
  }, [countries]);

  const filtered = useMemo(() => {
    let arr = [...countries];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.attributes?.iso2?.toLowerCase().includes(q) ||
        c.attributes?.iso3?.toLowerCase().includes(q) ||
        c.attributes?.capitalCity?.toLowerCase().includes(q) ||
        c.attributes?.nameOfficial?.toLowerCase().includes(q)
      );
    }
    if (filterIncome !== 'all') arr = arr.filter(c => c.attributes?.incomeLevelCode === filterIncome);
    if (filterRegion !== 'all') arr = arr.filter(c => c.attributes?.region === filterRegion);
    arr.sort((a, b) => {
      let va: any = a.name, vb: any = b.name;
      if (sortField !== 'name') { va = a.attributes?.[sortField] ?? -1; vb = b.attributes?.[sortField] ?? -1; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [countries, search, filterIncome, filterRegion, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: EcoSortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  };

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const cats = MAP_CATEGORIES.map(c => c.key);
      const results = await Promise.all(cats.map(cat => fetch(`/api/map/features?category=${cat}`).then(r => r.json())));
      const categories: Record<string, number> = {};
      cats.forEach((cat, i) => { categories[cat] = Array.isArray(results[i]) ? results[i].length : 0; });
      setStats({ total: Object.values(categories).reduce((a, b) => a + b, 0), categories });
    } catch { setStats(null); }
    finally { setLoadingStats(false); }
  }, []);

  const fetchCountries = useCallback(async () => {
    setLoadingCountries(true);
    try {
      const res = await fetch('/api/map/features?category=economic');
      const data = await res.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch { setCountries([]); }
    finally { setLoadingCountries(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchCountries(); }, [fetchStats, fetchCountries]);

  const handleSeed = async () => {
    if (!confirm('Thao tác này sẽ XOÁ toàn bộ dữ liệu bản đồ cũ và nạp lại từ Databank. Tiếp tục?')) return;
    setSeeding(true);
    setSeedLog([{ type: 'info', msg: 'Đang kết nối tới World Bank API & mledoze...' }]);
    try {
      const res = await fetch('/api/map/features', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setSeedLog(prev => [
          ...prev,
          { type: 'error', msg: `Lỗi: ${data.error || 'Không rõ nguyên nhân'}` },
          ...(data.errors ?? []).map((e: string) => ({ type: 'error' as const, msg: `  - ${e}` })),
        ]);
        showToast('Seed thất bại', 'error');
      } else {
        setSeedLog(prev => [
          ...prev,
          { type: 'success', msg: `Hoàn thành! Đã nạp ${data.inserted ?? '?'} bản ghi.` },
          ...(data.errors ?? []).map((e: string) => ({ type: 'error' as const, msg: `  - ${e}` })),
        ]);
        showToast(`Đã nạp ${data.inserted ?? '?'} bản ghi!`);
        fetchStats(); fetchCountries();
      }
    } catch (err: any) {
      setSeedLog(prev => [...prev, { type: 'error', msg: `Lỗi kết nối: ${err.message}` }]);
      showToast('Lỗi kết nối server', 'error');
    } finally { setSeeding(false); }
  };

  /* ── Inline view routing (like QuizManager) ── */
  if (view === 'detail' && selectedCountry) {
    return (
      <CountryDetailView
        country={selectedCountry}
        onBack={() => { setView('overview'); setSelectedCountry(null); }}
        onDeleted={() => {
          setCountries(prev => prev.filter(c => c._id !== selectedCountry._id));
          setView('overview'); setSelectedCountry(null);
        }}
        onUpdated={updated => {
          setCountries(prev => prev.map(c => c._id === updated._id ? updated : c));
          setSelectedCountry(updated);
        }}
      />
    );
  }

  /* ── Overview ── */
  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[20px] text-sm font-bold
          shadow-[0_8px_24px_rgba(0,0,0,0.12)] border ${
            toast.type === 'success'
              ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
              : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#082F49]">Quản lý Dữ liệu Bản đồ</h2>
          <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">Dữ liệu từ World Bank · mledoze · mapData.json</p>
        </div>
        <button onClick={handleSeed} disabled={seeding}
          className="sm:ml-auto flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black text-white
            transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
          style={{ background: 'linear-gradient(135deg,#06B6D4,#0284c7)', boxShadow: '0 10px 25px rgba(6,182,212,0.35)' }}>
          {seeding ? <FaSpinner className="animate-spin" /> : <FaDownload />}
          {seeding ? 'Đang nạp...' : 'Nạp / Cập nhật Databank'}
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MAP_CATEGORIES.map(cat => (
          <div key={cat.key} className={`rounded-[24px] border p-4 flex flex-col gap-1.5 ${cat.bg} ${cat.border} backdrop-blur-sm`}>
            <span className="text-2xl">{cat.icon}</span>
            <p className={`text-[11px] font-extrabold uppercase tracking-wider ${cat.color}`}>{cat.label}</p>
            <p className="text-2xl font-black text-[#082F49]">
              {loadingStats ? '—' : (stats?.categories[cat.key] ?? 0).toLocaleString('vi-VN')}
            </p>
            <p className="text-[10px] text-[#94A3B8] font-semibold">bản ghi</p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] px-6 py-4 shadow-sm flex items-center gap-4">
        <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#06B6D4] to-blue-500 flex items-center justify-center text-white">
          <FaDatabase className="text-sm" />
        </div>
        <div>
          <p className="font-black text-[#082F49] text-base">
            {loadingStats ? 'Đang tải...' : `${(stats?.total ?? 0).toLocaleString('vi-VN')} bản ghi trong database`}
          </p>
          <p className="text-[#94A3B8] text-xs font-semibold">Đọc trực tiếp từ MongoDB — không gọi API ngoài khi dùng</p>
        </div>
        <button onClick={() => { fetchStats(); fetchCountries(); }} disabled={loadingStats || loadingCountries}
          className="ml-auto text-[#94A3B8] hover:text-[#06B6D4] transition-colors disabled:opacity-40">
          <FaSpinner className={(loadingStats || loadingCountries) ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Seed log */}
      {seedLog.length > 0 && (
        <div className="bg-[#082F49] rounded-[24px] p-5 space-y-1.5 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#94A3B8] font-bold uppercase tracking-widest text-[9px]">Nhật ký thực thi</p>
            {!seeding && <button onClick={() => setSeedLog([])} className="text-[#94A3B8] hover:text-white text-[10px]">Xoá log</button>}
          </div>
          {seedLog.map((log, i) => (
            <p key={i} className={`leading-relaxed ${
              log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-red-400' : 'text-slate-300'
            }`}>{log.msg}</p>
          ))}
          {seeding && <p className="text-cyan-400 animate-pulse">|</p>}
        </div>
      )}

      {/* Countries table */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-black text-[#082F49]">Danh sách Quốc gia</h3>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
            {loadingCountries ? '…' : `${filtered.length} / ${countries.length}`}
          </span>
        </div>

        {/* Toolbar */}
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-4 shadow-sm mb-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#94A3B8] mr-1">Thu nhập:</span>
            {(['all', 'HIC', 'UMC', 'LMC', 'LIC'] as const).map(k => (
              <button key={k} onClick={() => { setFilterIncome(k); setPage(1); }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  filterIncome === k
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-[0_4px_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-50 text-[#334155] border-slate-200 hover:border-cyan-300 hover:text-cyan-600'
                }`}>
                {k === 'all' ? 'Tất cả' : INCOME_MAP[k]?.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-[#94A3B8]">Sắp xếp:</span>
            {([
              ['name', 'Tên'], ['gdpPerCapita', 'GDP/người'], ['population', 'Dân số'],
              ['area', 'Diện tích'], ['lifeExpectancy', 'Tuổi thọ'],
            ] as [EcoSortField, string][]).map(([k, lbl]) => (
              <button key={k} onClick={() => toggleSort(k)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  sortField === k
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                    : 'bg-slate-50 border-slate-200 text-[#334155] hover:border-cyan-200'
                }`}>
                {lbl}{sortField === k && <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
              </button>
            ))}
            <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPage(1); }}
              className="ml-auto px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50
                text-xs text-[#334155] font-semibold focus:outline-none focus:border-cyan-300 cursor-pointer">
              <option value="all">Mọi khu vực</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-2
              focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
              <FaSearch className="text-[#94A3B8] text-xs shrink-0" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm tên, ISO, thủ đô..."
                className="bg-transparent text-xs font-semibold text-[#082F49] placeholder:text-[#94A3B8] outline-none w-36 sm:w-44" />
              {search && (
                <button onClick={() => { setSearch(''); setPage(1); }} className="text-[#94A3B8] hover:text-slate-600 transition-colors">
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loadingCountries ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
            <p className="text-[#94A3B8] font-semibold text-sm">Đang tải dữ liệu quốc gia...</p>
          </div>
        ) : (
          <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
            {paged.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-16 h-16 rounded-[24px] bg-slate-100 flex items-center justify-center text-3xl">🔍</div>
                <p className="text-[#082F49] font-bold">Không tìm thấy quốc gia nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white/40 backdrop-blur-md">
                      <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs w-10">#</th>
                      <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs">Quốc gia</th>
                      <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden sm:table-cell">Thủ đô</th>
                      <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden md:table-cell">Khu vực</th>
                      <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs">Thu nhập</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((c, idx) => {
                      const ca = c.attributes ?? {};
                      const inc = INCOME_MAP[ca.incomeLevelCode] ?? INCOME_MAP['INX'];
                      const cf = flagEmoji(ca.iso2);
                      return (
                        <tr key={c._id}
                          onClick={() => { setSelectedCountry(c); setView('detail'); }}
                          className="border-b border-white/50 hover:bg-cyan-50/50 transition-colors cursor-pointer group">
                          <td className="px-5 py-3 text-[#94A3B8] text-xs font-bold">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl leading-none flex-shrink-0">{cf}</span>
                              <div className="min-w-0">
                                <p className="font-bold text-[#082F49] group-hover:text-cyan-700 transition-colors leading-snug">{c.name}</p>
                                <p className="text-[#94A3B8] text-[10px] font-semibold">{ca.nameOfficial || `${ca.iso2 || ''}${ca.iso2 && ca.iso3 ? ' · ' : ''}${ca.iso3 || ''}`}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-[#334155] text-xs hidden sm:table-cell">{ca.capitalCity || '—'}</td>
                          <td className="px-5 py-3 text-[#334155] text-xs hidden md:table-cell max-w-[160px]">
                            <p className="truncate">{ca.region || '—'}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${inc.pill}`}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: inc.dot }} />
                              {inc.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-[#94A3B8] text-xs font-semibold">
                  {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} quốc gia
                </p>
                <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
function DataTab() {
  const [subTab, setSubTab] = useState<'flashcards' | 'quizzes'>('flashcards');

  return (
    <div className="space-y-6">
      {/* ── Sub-tabs navigation ── */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 backdrop-blur-sm border border-slate-200 rounded-full w-fit">
        <button
          onClick={() => setSubTab('flashcards')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
            subTab === 'flashcards'
              ? 'bg-white text-cyan-600 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <span>📝</span> Thẻ ghi nhớ
        </button>
        <button
          onClick={() => setSubTab('quizzes')}
          className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
            subTab === 'quizzes'
              ? 'bg-white text-emerald-600 shadow-[0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          <span>✅</span> Kiểm tra
        </button>
      </div>

      {/* ── Content ── */}
      <div className="bg-white/40 backdrop-blur-[12px] border border-white/60 rounded-[32px] p-6 shadow-sm">
        {subTab === 'flashcards' && <DataManager apiPrefix="/api/admin/flashcards" title="Thẻ ghi nhớ" />}
        {subTab === 'quizzes' && <QuizManager />}
      </div>
    </div>
  );
}

function UserFormModal({ mode, initialUser, onClose, onSaved }: {
  mode: 'add' | 'edit';
  initialUser?: UserRow;
  onClose: () => void;
  onSaved: (mode: 'add' | 'edit', form: any, userId?: string) => Promise<void>;
}) {
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '', role: 3, email: '', fullName: '',
    className: '', school: '', province: '', ward: '', address: '',
    exp: 0, streak: 0, petExp: 0, coins: 0
  });
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(mode === 'edit');
  const [error, setError] = useState('');

  const [provinces, setProvinces] = useState<{code: number, name: string}[]>([]);
  const [wards, setWards] = useState<{code: number, name: string}[]>([]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then((r) => r.json())
      .then((data) => setProvinces(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && initialUser) {
      // Fetch full user data
      fetch(`/api/admin/users/${initialUser._id}`)
        .then(r => r.json())
        .then(data => {
          if (data.user) {
            const u = data.user;
            setForm({
              username: u.username || '',
              password: '', confirmPassword: '',
              role: u.role || 3,
              email: u.email || '',
              fullName: u.fullName || '',
              className: u.className || '',
              school: u.school || '',
              province: u.province?.code ? String(u.province.code) : '',
              ward: u.ward?.code ? String(u.ward.code) : '',
              address: u.address || '',
              exp: u.exp || 0,
              streak: u.streak || 0,
              petExp: u.petExp || 0,
              coins: u.coins || 0
            });
          }
        })
        .catch(() => setError('Lỗi khi tải thông tin người dùng'))
        .finally(() => setLoadingInitial(false));
    } else {
      setLoadingInitial(false);
    }
  }, [mode, initialUser]);

  useEffect(() => {
    if (!form.province) {
      setWards([]);
      if (mode === 'add' || (!loadingInitial)) setForm(p => ({ ...p, ward: '' }));
      return;
    }
    fetch(`https://provinces.open-api.vn/api/v2/p/${form.province}?depth=2`)
      .then((r) => r.json())
      .then((data) => {
        setWards(data.wards ?? []);
        // Only reset ward if we just changed province manually, not during initial load
        if (!loadingInitial) {
          setForm(p => {
             // If current ward is in the new wards list, keep it, else reset
             const currentWardCode = Number(p.ward);
             if (currentWardCode && data.wards?.some((w: any) => w.code === currentWardCode)) {
                return p;
             }
             return { ...p, ward: '' };
          });
        }
      })
      .catch(() => {});
  }, [form.province, loadingInitial, mode]);

  const fldCls = 'w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all disabled:opacity-60';

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm(p => ({ ...p, [k]: ['role', 'exp', 'streak', 'petExp', 'coins'].includes(k) ? Number(e.target.value) : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'add' && (!form.username.trim() || !form.password.trim())) {
      setError('Tên đăng nhập và mật khẩu là bắt buộc');
      return;
    }
    if (form.password && form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    setSaving(true);
    setError('');
    
    const provinceObj = form.province ? provinces.find((p) => String(p.code) === form.province) : undefined;
    const wardObj = form.ward ? wards.find((w) => String(w.code) === form.ward) : undefined;

    const payload: any = {
      username: form.username,
      role: form.role,
      fullName: form.fullName,
      email: form.email,
      className: form.className,
      school: form.school,
      address: form.address,
      province: provinceObj,
      ward: wardObj,
      exp: form.exp,
      streak: form.streak,
      petExp: form.petExp,
      coins: form.coins
    };
    if (form.password) {
      payload.password = form.password;
    }

    try {
      await onSaved(mode, payload, initialUser?._id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-cyan-50 to-blue-50 shrink-0">
          <h3 className="font-black text-[#082F49] text-lg">
            {mode === 'add' ? '✨ Tạo người dùng mới' : '✏️ Chỉnh sửa người dùng'}
          </h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200
            flex items-center justify-center text-slate-500 transition-colors">
            <FaTimes className="text-xs" />
          </button>
        </div>
        
        {loadingInitial ? (
          <div className="p-10 flex flex-col items-center justify-center gap-3">
            <FaSpinner className="animate-spin text-3xl text-cyan-500" />
            <p className="text-sm font-semibold text-[#94A3B8]">Đang tải thông tin...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-red-50 border
                border-red-200 text-red-600 text-sm font-semibold">
                <FaExclamationTriangle className="shrink-0" /> {error}
              </div>
            )}
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-[#94A3B8] uppercase tracking-wide">1. Thông tin đăng nhập</h4>
              
              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Vai trò *</label>
                <select value={form.role} onChange={set('role')} className={fldCls}>
                  <option value={1}>Admin</option>
                  <option value={2}>Giáo viên</option>
                  <option value={3}>Học sinh</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Tên đăng nhập *</label>
                  <input value={form.username} onChange={set('username')} required className={fldCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Email <span className="text-slate-400 font-normal">(tuỳ chọn)</span></label>
                  <input value={form.email} onChange={set('email')} type="email" className={fldCls} placeholder="example@email.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Mật khẩu {mode === 'add' ? '*' : <span className="text-slate-400 font-normal">(để trống nếu không đổi)</span>}</label>
                  <input value={form.password} onChange={set('password')} required={mode === 'add'} type="password" className={fldCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Xác nhận mật khẩu {mode === 'add' ? '*' : ''}</label>
                  <input value={form.confirmPassword} onChange={set('confirmPassword')} required={mode === 'add' || !!form.password} type="password" className={fldCls} />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <h4 className="text-xs font-black text-[#94A3B8] uppercase tracking-wide">2. Nhận diện cá nhân</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#334155] mb-1">Họ và tên *</label>
                  <input value={form.fullName} onChange={set('fullName')} required className={fldCls} placeholder="Nguyễn Văn An" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Lớp *</label>
                  <input value={form.className} onChange={set('className')} required className={fldCls} placeholder="Ví dụ: 8A1" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Trường *</label>
                  <input value={form.school} onChange={set('school')} required className={fldCls} placeholder="Tên trường..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Tỉnh / Thành phố</label>
                  <select value={form.province} onChange={set('province')} className={fldCls}>
                    <option value="">-- Chọn tỉnh / thành phố --</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={String(p.code)}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#334155] mb-1">Xã / Phường</label>
                  <select value={form.ward} onChange={set('ward')} className={fldCls} disabled={!form.province || wards.length === 0}>
                    <option value="">-- Chọn xã / phường --</option>
                    {wards.map((w) => (
                      <option key={w.code} value={String(w.code)}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Địa chỉ hiện tại <span className="text-slate-400 font-normal">(tuỳ chọn)</span></label>
                <input value={form.address} onChange={set('address')} className={fldCls} placeholder="Số nhà, tên đường, khu vực..." />
              </div>
            </div>

            {mode === 'edit' && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-[#94A3B8] uppercase tracking-wide">3. Thông số học tập (Gamification)</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-cyan-600 mb-1">EXP</label>
                    <input type="number" value={form.exp} onChange={set('exp')} className={fldCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-orange-500 mb-1">Streak</label>
                    <input type="number" value={form.streak} onChange={set('streak')} className={fldCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-violet-600 mb-1">Pet EXP</label>
                    <input type="number" value={form.petExp} onChange={set('petExp')} className={fldCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-500 mb-1">Coins</label>
                    <input type="number" value={form.coins} onChange={set('coins')} className={fldCls} />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-full border border-slate-200 text-sm font-bold
                  text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
              <button type="submit" disabled={saving}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500
                  text-white text-sm font-bold hover:from-emerald-400 hover:to-cyan-400 transition-all
                  flex items-center justify-center gap-2 disabled:opacity-50">
                {saving && <FaSpinner className="animate-spin text-xs" />}
                {mode === 'add' ? 'Hoàn tất tạo mới' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════ USERS TAB ════════════════════════════════ */

function UsersTab() {
  const router = useRouter();
  const [users, setUsers]               = useState<UserRow[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState<number | 'all'>('all');
  const [sortKey, setSortKey]           = useState<'username' | 'email' | 'exp' | 'streak' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [formMode, setFormMode]         = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget]     = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const PAGE_SIZE = 14;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE),
        search, role: String(roleFilter), sort: sortKey, sortDir,
      });
      const res  = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, [page, search, roleFilter, sortKey, sortDir]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res  = await fetch(`/api/admin/users/${deleteTarget._id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Xoá thất bại', 'error'); setDeleteTarget(null); return; }
    showToast('🗑️ Đã xoá người dùng!', 'error');
    setDeleteTarget(null);
    if (users.length === 1 && page > 1) setPage(p => p - 1);
    else fetchUsers();
  };

  const handleUserSave = async (mode: 'add' | 'edit', form: any, userId?: string) => {
    const url = mode === 'add' ? '/api/admin/users' : `/api/admin/users/${userId}`;
    const method = mode === 'add' ? 'POST' : 'PATCH';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Lỗi lưu thông tin');
    showToast(mode === 'add' ? '✨ Đã tạo người dùng thành công!' : '✅ Đã cập nhật người dùng!');
    if (mode === 'add') setPage(1);
    fetchUsers();
  };

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[20px] text-sm font-bold
          shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all border
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
            : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-[#082F49]">👥 Người dùng</h2>
        <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">
          {loading ? '...' : `${total} tài khoản`}
        </p>
      </div>

      {/* Filter + Sort + Search */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
        p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)] space-y-3">
        {/* Role pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#94A3B8] mr-1">Vai trò:</span>
          {(['all', 1, 2, 3] as const).map(r => (
            <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`px-4 py-1.5 rounded-[9999px] text-sm font-bold border transition-all
                ${roleFilter === r
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-[0_8px_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-50 text-[#334155] border-slate-200 hover:border-cyan-300 hover:text-cyan-600'
                }`}>
              {r === 'all' ? 'Tất cả' : ROLE_LABEL[r]?.label}
            </button>
          ))}
        </div>
        {/* Sort + Search */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#94A3B8]">Sắp xếp:</span>
          {([
            ['username', 'Tên'], ['exp', 'EXP'], ['streak', 'Chuỗi'], ['createdAt', 'Ngày tạo']
          ] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => toggleSort(k)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold
                border transition-all
                ${sortKey === k
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : 'bg-slate-50 border-slate-200 text-[#334155] hover:border-cyan-200'
                }`}>
              {lbl} {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-200
            rounded-full px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2
            focus-within:ring-cyan-100 transition-all">
            <FaSearch className="text-[#94A3B8] text-xs shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm theo tên, email..."
              className="bg-transparent text-sm font-semibold text-[#082F49]
                placeholder:text-[#94A3B8] outline-none w-36 sm:w-44" />
            {search && (
              <button onClick={() => setSearch('')}
                className="text-[#94A3B8] hover:text-slate-600 transition-colors">
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
          <button onClick={() => { setEditTarget(null); setFormMode('add'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500
              text-white text-sm font-bold hover:from-emerald-400 hover:to-cyan-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
            <FaUserPlus className="text-xs" />
            Tạo người dùng
          </button>
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
          <p className="text-[#94A3B8] font-semibold text-sm">Đang tải...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center text-4xl">👤</div>
          <p className="text-[#082F49] font-bold text-base">Không tìm thấy người dùng</p>
        </div>
      ) : (
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
          shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white/40 backdrop-blur-md">
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs w-[5%]">#</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs">Tài khoản</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden sm:table-cell">Email</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs">Vai trò</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden md:table-cell">EXP</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden md:table-cell">Chuỗi 🔥</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden lg:table-cell">Ngày tạo</th>
                  <th className="px-5 py-3.5 text-[#94A3B8] font-bold text-xs text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const roleInfo = ROLE_LABEL[u.role] ?? { label: '?', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
                  return (
                    <tr key={u._id}
                      className="border-b border-white/50 hover:bg-cyan-50/50 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/admin/users/${u._id}`)}
                    >
                      <td className="px-5 py-3 text-[#94A3B8] text-xs font-bold">
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-cyan-400 to-blue-500
                            flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                            {u.avatar
                              ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                              : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#082F49] group-hover:text-cyan-700 transition-colors">{u.username}</p>
                            {u.fullName && <p className="text-[#94A3B8] text-xs truncate">{u.fullName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#334155] text-xs hidden sm:table-cell">{u.email ?? '—'}</td>
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setEditTarget(u)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all
                            hover:opacity-80 ${roleInfo.cls}`}>
                          {roleInfo.label}
                        </button>
                      </td>
                      <td className="px-5 py-3 font-bold text-cyan-600 tabular-nums hidden md:table-cell">
                        {(u.exp ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-bold text-orange-500 hidden md:table-cell">{u.streak ?? 0} ngày</td>
                      <td className="px-5 py-3 text-[#94A3B8] text-xs hidden lg:table-cell">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditTarget(u); setFormMode('edit'); }} title="Chỉnh sửa người dùng"
                            className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                              flex items-center justify-center text-cyan-600 hover:bg-cyan-50
                              hover:border-cyan-300 transition-all">
                            <FaEdit className="text-[10px]" />
                          </button>
                          <button onClick={() => setDeleteTarget(u)} title="Xoá tài khoản"
                            className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                              flex items-center justify-center text-red-400 hover:bg-red-50
                              hover:border-red-300 transition-all">
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-[#94A3B8] text-xs font-semibold">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} người dùng
              </p>
              <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* User Form modal */}
      {formMode && (
        <UserFormModal
          mode={formMode}
          initialUser={editTarget ?? undefined}
          onClose={() => { setFormMode(null); setEditTarget(null); }}
          onSaved={handleUserSave}
        />
      )}
      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Xoá tài khoản "${deleteTarget.username}"? Thao tác này không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════ CLASSROOMS TAB ══════════════════════════ */

// ── ClassFormModal (add / edit) ───────────────────────────────────────────────
function ClassFormModal({
  mode, initial, onClose, onSaved,
}: {
  mode: 'add' | 'edit';
  initial?: AdminClass;
  onClose: () => void;
  onSaved: (cls: AdminClass) => void;
}) {
  const [name, setName]               = useState(initial?.name ?? '');
  const [subject, setSubject]         = useState(initial?.subject ?? '');
  const [grade, setGrade]             = useState<string>(initial?.grade ? String(initial.grade) : '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [error, setError]             = useState('');
  const [saving, setSaving]           = useState(false);

  const fldCls = 'w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-[#082F49] focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Tên lớp không được để trống.'); return; }
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        subject: subject.trim() || undefined,
        grade:   grade ? Number(grade) : undefined,
        description: description.trim() || undefined,
      };
      const url    = mode === 'add' ? '/api/homeclass' : `/api/homeclass/${initial!._id}`;
      const method = mode === 'add' ? 'POST' : 'PATCH';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi lưu');
      onSaved(data.class);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-violet-50 to-purple-50">
          <h3 className="font-black text-[#082F49] text-lg">
            {mode === 'add' ? '🏡 Tạo lớp mới' : '✏️ Sửa lớp học'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200
            flex items-center justify-center text-slate-500 transition-colors">
            <FaTimes className="text-xs" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 rounded-full bg-red-50 border
              border-red-200 text-red-600 text-sm font-semibold">
              <FaExclamationTriangle className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">Tên lớp *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="VD: Lớp Địa 6A" className={fldCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Môn học</label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Địa lý" className={fldCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Khối lớp</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} className={fldCls}>
                <option value="">Chưa chọn</option>
                {[6, 7, 8, 9].map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Mô tả lớp học..." className={fldCls + ' resize-none'} />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500
                text-white text-sm font-bold hover:from-violet-400 hover:to-purple-400 transition-all
                flex items-center justify-center gap-2 disabled:opacity-50">
              {saving && <FaSpinner className="animate-spin text-xs" />}
              {mode === 'add' ? 'Tạo lớp học' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ClassDetailView (member CRUD) ─────────────────────────────────────────────
function ClassDetailView({ cls, onBack }: {
  cls: AdminClass;
  onBack: () => void;
}) {
  const [members, setMembers]             = useState<AdminMember[]>(cls.members);
  const [addUsername, setAddUsername]     = useState('');
  const [addLoading, setAddLoading]       = useState(false);
  const [addError, setAddError]           = useState('');
  const [removingId, setRemovingId]       = useState<string | null>(null);
  const [toast, setToast]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [suggestions, setSuggestions]     = useState<StudentSuggestion[]>([]);
  const [classNames, setClassNames]       = useState<string[]>([]);
  const [classFilter, setClassFilter]     = useState('');
  const [sortKey, setSortKey]             = useState<'username' | 'exp' | 'streak'>('username');
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('asc');
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingUsers, setPendingUsers]   = useState<StudentSuggestion[]>([]);
  const dropdownRef                       = useRef<HTMLDivElement>(null);
  const inputAdminRef                     = useRef<HTMLInputElement>(null);
  const portalDropdownRef                 = useRef<HTMLDivElement>(null);
  const [ddPos, setDdPos]                 = useState<{ top: number; left: number; width: number } | null>(null);
  const inputFldCls = 'w-full px-3 py-2.5 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all';

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Close dropdown on outside click — check BOTH the anchor div AND the portal div
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inAnchor = dropdownRef.current?.contains(target);
      const inPortal = portalDropdownRef.current?.contains(target);
      if (!inAnchor && !inPortal) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);


  const updateDdPos = () => {
    if (inputAdminRef.current) {
      const r = inputAdminRef.current.getBoundingClientRect();
      setDdPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
  };

  // Khi scroll, cập nhật lại tọa độ dropdown để nó bám sát input thay vì bị lệch
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => updateDdPos();
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdownOpen]);

  // Debounced search
  useEffect(() => {
    if (!dropdownOpen) return;
    const t = setTimeout(() => fetchSugg(addUsername, classFilter, sortKey, sortDir), 250);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addUsername, classFilter, sortKey, sortDir, dropdownOpen]);

  const fetchSugg = async (q: string, cf: string, sk: string, sd: string) => {
    setSearchLoading(true);
    const p = new URLSearchParams({ q, sort: sk, sortDir: sd, limit: '50' });
    if (cf) p.set('className', cf);
    const res  = await fetch(`/api/homeclass/search-students?${p}`);
    const data = await res.json();
    setSearchLoading(false);
    if (res.ok) {
      setSuggestions(data.students ?? []);
      if (data.classNames?.length) setClassNames(data.classNames);
    }
  };

  const toggleSuggSort = (key: 'username' | 'exp' | 'streak') => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const toAdd = pendingUsers.length > 0 ? pendingUsers : (addUsername.trim() ? [{ _id: '', username: addUsername.trim(), fullName: '' } as StudentSuggestion] : []);
    if (toAdd.length === 0) return;
    setAddLoading(true); setAddError(''); setDropdownOpen(false);
    let added = 0;
    for (const u of toAdd) {
      const res = await fetch(`/api/homeclass/${cls._id}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u.username }),
      });
      const data = await res.json();
      if (res.ok) { setMembers(prev => [...prev, data.member]); added++; }
      else setAddError(data.error || 'Thêm thất bại');
    }
    setAddLoading(false);
    setPendingUsers([]);
    setAddUsername('');
    if (added > 0) showToast(`✅ Đã thêm ${added} học sinh!`);
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingId(memberId);
    const res = await fetch(`/api/homeclass/${cls._id}/members?memberId=${memberId}`, { method: 'DELETE' });
    setRemovingId(null);
    if (!res.ok) { showToast('Xoá thất bại', 'error'); return; }
    setMembers(prev => prev.filter(m => m.userId !== memberId));
    showToast('🗑️ Đã xoá học sinh!');
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[20px] text-sm font-bold
          shadow-[0_8px_24px_rgba(0,0,0,0.12)] border
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
            : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold
            text-sm transition-colors group">
          <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200
            flex items-center justify-center transition-colors">
            <FaArrowLeft className="text-xs" />
          </span>
          <span className="hidden sm:inline">Danh sách lớp học</span>
        </button>
        <span className="text-slate-300 font-bold">/</span>
        <div>
          <p className="font-black text-[#082F49] text-sm leading-none">{cls.name}</p>
          <p className="text-[#94A3B8] text-xs font-semibold mt-0.5">
            {cls.subject && `${cls.subject} · `}{cls.grade && `Lớp ${cls.grade} · `}{members.length} học sinh
          </p>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-5
        shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex items-center gap-4">
        <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-violet-400 to-purple-500
          flex items-center justify-center text-2xl shadow-[0_8px_20px_rgba(6,182,212,0.4)] shrink-0">🏡</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-[#082F49] text-lg truncate">{cls.name}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {cls.subject && <span className="text-xs font-semibold text-[#94A3B8]">📚 {cls.subject}</span>}
            {cls.grade && (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${GRADE_COLORS[cls.grade] ?? ''}`}>
                Lớp {cls.grade}
              </span>
            )}
            <span className="text-xs font-semibold text-[#94A3B8]">👤 {cls.teacherName}</span>
          </div>
          {cls.description && <p className="text-[#94A3B8] text-xs mt-1">{cls.description}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black text-violet-600">{members.length}</p>
          <p className="text-[#94A3B8] text-xs font-semibold">học sinh</p>
        </div>
      </div>

      {/* Add member */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-5
        shadow-[0_10px_30px_rgba(14,165,233,0.08)]" style={{ position: 'relative', zIndex: 20 }}>
        <h3 className="font-black text-[#082F49] text-sm mb-3 flex items-center gap-2">
          <FaUserPlus className="text-cyan-500" /> Thêm học sinh
        </h3>
        {addError && (
          <p className="text-red-600 text-xs font-semibold mb-3 px-3 py-2 bg-red-50
            rounded-full border border-red-200">{addError}</p>
        )}
        <form onSubmit={handleAddMember}>
          <div ref={dropdownRef} className="relative">
            {/* Chips selected users */}
            {pendingUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pendingUsers.map(u => (
                  <span key={u._id || u.username} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold">
                    {u.fullName || u.username}
                    <button type="button" onClick={() => setPendingUsers(prev => prev.filter(x => x.username !== u.username))}
                      className="hover:text-red-500 transition-colors">×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs pointer-events-none" />
                <input
                  ref={inputAdminRef}
                  value={addUsername}
                  onChange={e => { setAddUsername(e.target.value); updateDdPos(); setDropdownOpen(true); }}
                  onFocus={() => { updateDdPos(); setDropdownOpen(true); fetchSugg(addUsername, classFilter, sortKey, sortDir); }}
                  className={inputFldCls + ' pl-9'}
                  placeholder="Tìm tên đăng nhập hoặc họ tên học sinh..."
                  autoComplete="off"
                />
              </div>
              <button type="submit" disabled={addLoading || (pendingUsers.length === 0 && !addUsername.trim())}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500
                  text-white text-sm font-bold hover:from-cyan-400 hover:to-blue-400 transition-all
                  flex items-center gap-2 disabled:opacity-50 shrink-0">
                {addLoading ? <FaSpinner className="animate-spin" /> : <FaUserPlus />}
                {pendingUsers.length > 1 ? `Thêm ${pendingUsers.length} HS` : 'Thêm'}
              </button>
            </div>

            {dropdownOpen && ddPos && createPortal(
              <div
                ref={portalDropdownRef}
                style={{
                  position: 'fixed',
                  top: ddPos.top,
                  left: ddPos.left,
                  width: ddPos.width,
                  zIndex: 9999,
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,1)',
                  boxShadow: '0 16px 40px rgba(14,165,233,0.14)',
                  maxHeight: '420px',
                  display: 'flex',
                  flexDirection: 'column',
                }}>

                {/* Filter & sort bar */}
                <div className="px-3 pt-3 pb-2 border-b border-slate-100 shrink-0">
                  {classNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['', ...classNames].map(cn => (
                        <button key={cn} type="button"
                          onMouseDown={e => { e.preventDefault(); setClassFilter(classFilter === cn ? '' : cn); }}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all
                            ${classFilter === cn ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-[#334155] hover:bg-slate-200'}`}>
                          {cn === '' ? 'Tất cả' : `Lớp ${cn}`}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#94A3B8] font-semibold mr-1">Sắp xếp:</span>
                    {(['username', 'exp', 'streak'] as const).map(k => (
                      <button key={k} type="button"
                        onMouseDown={e => { e.preventDefault(); toggleSuggSort(k); }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all
                          ${sortKey === k ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-[#94A3B8] hover:bg-slate-200'}`}>
                        {k === 'username' ? 'Tên' : k === 'exp' ? 'EXP' : 'Streak'}
                        {sortKey === k && (sortDir === 'asc' ? <FaSortAmountUp className="text-[9px]" /> : <FaSortAmountDown className="text-[9px]" />)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results */}
                {searchLoading ? (
                  <div className="flex items-center justify-center py-5">
                    <FaSpinner className="animate-spin text-cyan-400" />
                  </div>
                ) : suggestions.length === 0 ? (
                  <p className="text-center text-[#94A3B8] text-xs py-5">Không tìm thấy học sinh</p>
                ) : (
                  <ul style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                    {suggestions.map((s, i) => {
                      const isSelected = pendingUsers.some(u => u.username === s.username);
                      return (
                        <li key={s._id}>
                          <button type="button"
                            onMouseDown={e => {
                              e.preventDefault();
                              setPendingUsers(prev =>
                                isSelected ? prev.filter(u => u.username !== s.username) : [...prev, s]
                              );
                              setAddUsername('');
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all
                              ${i < suggestions.length - 1 ? 'border-b border-slate-50' : ''}
                              ${isSelected ? 'bg-cyan-50' : 'hover:bg-sky-50'}`}>
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                              ${isSelected ? 'bg-cyan-500 border-cyan-500' : 'border-slate-300'}`}>
                              {isSelected && <span className="text-white text-[10px] font-black">✓</span>}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500
                              flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                              {s.avatar
                                ? <img src={s.avatar} alt="" className="w-full h-full object-cover" />
                                : s.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#082F49] text-sm truncate">{s.username}</p>
                              {s.fullName && <p className="text-[#94A3B8] text-xs truncate">{s.fullName}</p>}
                            </div>
                            {s.className && (
                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-600">
                                Lớp {s.className}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>,
              document.body
            )}
          </div>
        </form>
      </div>

      {/* Members table */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3
          bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
          shadow-[0_10px_30px_rgba(14,165,233,0.08)]" style={{ position: 'relative', zIndex: 1 }}>
          <span className="text-4xl">👥</span>
          <p className="font-bold text-[#082F49]">Chưa có học sinh nào</p>
          <p className="text-[#94A3B8] text-sm">Thêm học sinh bằng ô tìm kiếm ở trên.</p>
        </div>
      ) : (
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
          shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden"
          style={{ position: 'relative', zIndex: 1 }}>
          <div className="px-5 py-3 border-b border-slate-100 bg-white/40 backdrop-blur-md">
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wide">
              {members.length} học sinh
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs w-[5%]">#</th>
                <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">Học sinh</th>
                <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs hidden sm:table-cell">Lớp chính</th>
                <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs hidden md:table-cell">Ngày tham gia</th>
                <th className="px-5 py-3 text-[#94A3B8] font-bold text-xs text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.userId} className="border-b border-slate-50 hover:bg-violet-50/20 transition-colors">
                  <td className="px-5 py-3 text-[#94A3B8] text-xs font-bold">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500
                        flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                        {m.avatar
                          ? <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                          : m.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[#082F49] text-sm">{m.username}</p>
                        {m.fullName && <p className="text-[#94A3B8] text-xs">{m.fullName}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#94A3B8] text-xs hidden sm:table-cell">học sinh</td>
                  <td className="px-5 py-3 text-[#94A3B8] text-xs hidden md:table-cell">
                    {new Date(m.joinedAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => handleRemoveMember(m.userId)}
                      disabled={removingId === m.userId}
                      className="w-7 h-7 rounded-full bg-red-50 border border-red-200
                        flex items-center justify-center text-red-400 hover:bg-red-100
                        transition-all disabled:opacity-50 ml-auto">
                      {removingId === m.userId
                        ? <FaSpinner className="animate-spin text-[10px]" />
                        : <FaTrash className="text-[10px]" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── ClassListView ─────────────────────────────────────────────────────────────
function ClassListView({ onSelectClass }: { onSelectClass: (cls: AdminClass) => void }) {
  const [classes, setClasses]           = useState<AdminClass[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [gradeFilter, setGradeFilter]   = useState<number | 'all'>('all');
  const [sortKey, setSortKey]           = useState<'name' | 'grade' | 'members' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');
  const [formMode, setFormMode]         = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget]     = useState<AdminClass | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminClass | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const PAGE_SIZE = 14;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: String(PAGE_SIZE), search, sort: sortKey, sortDir,
      });
      if (gradeFilter !== 'all') params.set('grade', String(gradeFilter));
      const res  = await fetch(`/api/admin/classrooms?${params}`);
      const data = await res.json();
      setClasses(data.classes ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, [page, search, gradeFilter, sortKey, sortDir]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/homeclass/${deleteTarget._id}`, { method: 'DELETE' });
    if (!res.ok) { showToast('Xoá thất bại', 'error'); setDeleteTarget(null); return; }
    showToast('🗑️ Đã xoá lớp học!', 'error');
    setDeleteTarget(null);
    if (classes.length === 1 && page > 1) setPage(p => p - 1);
    else fetchClasses();
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[20px] text-sm font-bold
          shadow-[0_8px_24px_rgba(0,0,0,0.12)] border transition-all
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
            : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#082F49]">🏡 Lớp học</h2>
          <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">
            {loading ? '...' : `${total} lớp học`}
          </p>
        </div>
        <button onClick={() => { setEditTarget(null); setFormMode('add'); }}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-full
            bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-bold
            hover:from-violet-400 hover:to-purple-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
          <FaPlus className="text-xs" /> Tạo lớp mới
        </button>
      </div>

      {/* Filter + sort + search */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
        p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)] space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#94A3B8] mr-1">Khối:</span>
          {(['all', 6, 7, 8, 9] as const).map(g => (
            <button key={g} onClick={() => { setGradeFilter(g); setPage(1); }}
              className={`px-4 py-1.5 rounded-[9999px] text-sm font-bold border transition-all
                ${gradeFilter === g
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white border-transparent shadow-[0_8px_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-50 text-[#334155] border-slate-200 hover:border-violet-300 hover:text-violet-600'
                }`}>
              {g === 'all' ? 'Tất cả' : `Lớp ${g}`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-bold text-[#94A3B8]">Sắp xếp:</span>
          {([['name', 'Tên lớp'], ['grade', 'Khối'], ['members', 'Học sinh'], ['createdAt', 'Ngày tạo']] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => toggleSort(k)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all
                ${sortKey === k
                  ? 'bg-violet-50 border-violet-300 text-violet-700'
                  : 'bg-slate-50 border-slate-200 text-[#334155] hover:border-violet-200'
                }`}>
              {lbl} {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-200
            rounded-full px-3 py-2 focus-within:border-violet-400 focus-within:ring-2
            focus-within:ring-violet-100 transition-all">
            <FaSearch className="text-[#94A3B8] text-xs shrink-0" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Tìm tên lớp, giáo viên..."
              className="bg-transparent text-sm font-semibold text-[#082F49]
                placeholder:text-[#94A3B8] outline-none w-36 sm:w-44" />
            {search && (
              <button onClick={() => setSearch('')}
                className="text-[#94A3B8] hover:text-slate-600 transition-colors">
                <FaTimes className="text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FaSpinner className="text-4xl text-violet-400 animate-spin" />
          <p className="text-[#94A3B8] font-semibold text-sm">Đang tải...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center text-4xl">🏡</div>
          <p className="text-[#082F49] font-bold text-base">Chưa có lớp học nào</p>
          <button onClick={() => setFormMode('add')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r
              from-violet-500 to-purple-500 text-white text-sm font-bold hover:from-violet-400
              hover:to-purple-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
            <FaPlus className="text-xs" /> Tạo lớp đầu tiên
          </button>
        </div>
      ) : (
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
          shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-white/40 backdrop-blur-md">
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs w-[4%]">#</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs">Lớp học</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden sm:table-cell">Giáo viên</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden md:table-cell">Khối</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden md:table-cell">Học sinh</th>
                  <th className="text-left px-5 py-3.5 text-[#94A3B8] font-bold text-xs hidden lg:table-cell">Ngày tạo</th>
                  <th className="px-5 py-3.5 text-[#94A3B8] font-bold text-xs text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, idx) => (
                  <tr key={cls._id}
                    className="border-b border-white/50 hover:bg-violet-50/50 transition-colors cursor-pointer group"
                    onClick={() => onSelectClass(cls)}>
                    <td className="px-5 py-3.5 text-[#94A3B8] text-xs font-bold">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-violet-400 to-purple-500
                          flex items-center justify-center text-white text-base font-black shrink-0">🏡</div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#082F49] group-hover:text-violet-700 transition-colors truncate">{cls.name}</p>
                          {cls.subject && <p className="text-[#94A3B8] text-xs truncate">{cls.subject}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500
                          flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                          {cls.teacherAvatar
                            ? <img src={cls.teacherAvatar} alt="" className="w-full h-full object-cover" />
                            : cls.teacherName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[#334155] text-xs font-semibold truncate max-w-[120px]">{cls.teacherName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {cls.grade
                        ? <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${GRADE_COLORS[cls.grade] ?? ''}`}>Lớp {cls.grade}</span>
                        : <span className="text-[#94A3B8] text-xs">—</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 font-bold text-violet-600 hidden md:table-cell">
                      {cls.members.length}
                    </td>
                    <td className="px-5 py-3.5 text-[#94A3B8] text-xs hidden lg:table-cell">
                      {new Date(cls.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditTarget(cls); setFormMode('edit'); }}
                          title="Sửa lớp"
                          className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                            flex items-center justify-center text-violet-600 hover:bg-violet-50
                            hover:border-violet-300 transition-all">
                          <FaEdit className="text-[10px]" />
                        </button>
                        <button onClick={() => setDeleteTarget(cls)}
                          title="Xoá lớp"
                          className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                            flex items-center justify-center text-red-400 hover:bg-red-50
                            hover:border-red-300 transition-all">
                          <FaTrash className="text-[10px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <p className="text-[#94A3B8] text-xs font-semibold">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} lớp
              </p>
              <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {formMode && (
        <ClassFormModal
          mode={formMode}
          initial={editTarget ?? undefined}
          onClose={() => { setFormMode(null); setEditTarget(null); }}
          onSaved={saved => {
            setFormMode(null); setEditTarget(null);
            if (formMode === 'add') { showToast('✅ Đã tạo lớp học!'); fetchClasses(); }
            else { setClasses(prev => prev.map(c => c._id === saved._id ? { ...c, ...saved } : c)); showToast('✅ Đã cập nhật lớp học!'); }
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          message={`Xoá lớp học "${deleteTarget.name}"? Toàn bộ bài tập sẽ bị xoá. Thao tác không thể hoàn tác.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── ClassroomsTab orchestrator ────────────────────────────────────────────────
function ClassroomsTab() {
  const [view, setView]                   = useState<'list' | 'detail'>('list');
  const [selectedClass, setSelectedClass] = useState<AdminClass | null>(null);
  return (
    <div>
      {view === 'list' && (
        <ClassListView onSelectClass={cls => { setSelectedClass(cls); setView('detail'); }} />
      )}
      {view === 'detail' && selectedClass && (
        <ClassDetailView cls={selectedClass} onBack={() => { setView('list'); setSelectedClass(null); }} />
      )}
    </div>
  );
}

/* ════════════════════════ OVERVIEW TAB ════════════════════════════  */

function OverviewTab() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  const roleColors  = ['#06B6D4','#22C55E','#F59E0B'];
  const gradeColors = ['#06B6D4','#22C55E','#8B5CF6','#F59E0B'];

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <FaSpinner className="text-5xl text-cyan-400 animate-spin" />
    </div>
  );

  const maxDaily = Math.max(1, ...(stats?.dailyUsers ?? []).map((d: any) => d.count));
  const maxGrade = Math.max(1, ...(stats?.gradeStats ?? []).map((g: any) => g.count));

  const DonutChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let offset = -0.25;
    const r = 38, cx = 60, cy = 60, sw = 16;
    const arcs = data.map(d => {
      const pct = d.value / total;
      const s = offset * 2 * Math.PI, e = (offset + pct) * 2 * Math.PI;
      offset += pct;
      return { path: `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`, color: d.color, pct };
    });
    return (
      <svg width={110} height={110} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
        {arcs.map((a, i) => a.pct > 0.001 && (
          <path key={i} d={a.path} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="round" />
        ))}
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="900" fill="#082F49">{total}</text>
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#082F49]">📊 Tổng quan hệ thống</h2>
        <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">Dữ liệu thống kê theo thời gian thực</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: '👥', label: 'Người dùng',  value: stats?.totalUsers ?? 0,      sub: `+${stats?.newUsersWeek ?? 0} tuần này`, grad: 'from-cyan-500 to-blue-500',     bg: 'from-cyan-50 to-blue-50' },
          { icon: '📇', label: 'Thẻ ghi nhớ', value: stats?.totalFlashcards ?? 0, sub: `${stats?.totalLessons ?? 0} bài học`,   grad: 'from-emerald-500 to-teal-500',  bg: 'from-emerald-50 to-teal-50' },
          { icon: '📝', label: 'Bộ quiz',      value: stats?.totalQuizSets ?? 0,   sub: 'Câu hỏi kiểm tra',                      grad: 'from-violet-500 to-purple-500', bg: 'from-violet-50 to-purple-50' },
          { icon: '🏫', label: 'Lớp học',      value: stats?.totalClasses ?? 0,    sub: 'Lớp đang hoạt động',                    grad: 'from-amber-500 to-orange-500',  bg: 'from-amber-50 to-orange-50' },
        ].map((c, i) => (
          <div key={i} className={`bg-gradient-to-br ${c.bg} border border-white/80 rounded-[24px] p-4 shadow-[0_8px_24px_rgba(14,165,233,0.07)]`}>
            <div className={`w-10 h-10 rounded-[14px] bg-gradient-to-br ${c.grad} flex items-center justify-center text-lg mb-3 shadow-sm`}>{c.icon}</div>
            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wide">{c.label}</p>
            <p className="text-[#082F49] text-3xl font-black leading-tight">{c.value.toLocaleString()}</p>
            <p className="text-[#94A3B8] text-xs font-semibold mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[24px] p-5 shadow-[0_8px_24px_rgba(14,165,233,0.07)]">
          <h3 className="font-black text-[#082F49] text-sm mb-4">📈 Người dùng mới 7 ngày qua</h3>
          <div className="flex items-end gap-2 h-36">
            {(stats?.dailyUsers ?? []).map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[10px] font-black text-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                <div className="w-full rounded-t-[8px] bg-gradient-to-t from-cyan-500 to-blue-400 shadow-sm transition-all"
                  style={{ height: `${Math.max(4, (d.count / maxDaily) * 112)}px` }} />
                <span className="text-[9px] text-[#94A3B8] font-semibold text-center leading-tight">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[24px] p-5 shadow-[0_8px_24px_rgba(14,165,233,0.07)]">
          <h3 className="font-black text-[#082F49] text-sm mb-3">🍩 Phân bổ vai trò</h3>
          <div className="flex flex-col items-center gap-3">
            <DonutChart data={stats?.roleDistribution ?? []} />
            <div className="w-full space-y-1.5">
              {(stats?.roleDistribution ?? []).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: roleColors[i] }} />
                    <span className="text-xs font-semibold text-[#334155]">{r.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#082F49]">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grade bars + top users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[24px] p-5 shadow-[0_8px_24px_rgba(14,165,233,0.07)]">
          <h3 className="font-black text-[#082F49] text-sm mb-4">📚 Thẻ ghi nhớ theo khối lớp</h3>
          <div className="space-y-3">
            {(stats?.gradeStats ?? []).map((g: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-black text-[#082F49] w-12 shrink-0">{g.grade}</span>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
                    style={{ width: `${Math.max(4, (g.count / maxGrade) * 100)}%`, background: gradeColors[i] }}>
                    <span className="text-[10px] font-black text-white">{g.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[24px] p-5 shadow-[0_8px_24px_rgba(14,165,233,0.07)]">
          <h3 className="font-black text-[#082F49] text-sm mb-4">🏆 Top người dùng (EXP)</h3>
          <div className="space-y-2.5">
            {(stats?.topUsers ?? []).map((u: any, i: number) => {
              const medals = ['🥇','🥈','🥉','4️⃣','5️⃣'];
              return (
                <div key={u._id ?? i} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center shrink-0">{medals[i]}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : u.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#082F49] truncate">{u.fullName || u.username}</p>
                    <p className="text-[10px] text-[#94A3B8] font-semibold">🔥 {u.streak} ngày streak</p>
                  </div>
                  <span className="text-xs font-black text-cyan-600 shrink-0">{(u.exp ?? 0).toLocaleString()} EXP</span>
                </div>
              );
            })}
            {!stats?.topUsers?.length && <p className="text-[#94A3B8] text-xs font-semibold text-center py-4">Chưa có dữ liệu</p>}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-black text-[#082F49] mb-3">🔗 Truy cập nhanh</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/',          icon: <Icon icon="material-symbols:home-rounded" width={22} />, label: 'Trang chủ', color: 'from-cyan-100 to-blue-100' },
            { href: '/classroom', icon: <Icon icon="material-symbols:school" width={22} />, label: 'Lớp học',   color: 'from-violet-100 to-purple-100' },
            { href: '/map',       icon: <Icon icon="material-symbols:map" width={22} />, label: 'Bản đồ',  color: 'from-emerald-100 to-green-100' },
            { href: '/books',     icon: <Icon icon="material-symbols:book" width={22} />, label: 'Sách học',  color: 'from-amber-100 to-orange-100' },
          ].map(lk => (
            <Link key={lk.href} href={lk.href}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-[24px] bg-gradient-to-br ${lk.color} border border-white/80 hover:scale-[1.03] transition-all shadow-sm group`}>
              <span className="text-2xl group-hover:scale-110 transition-transform">{lk.icon}</span>
              <p className="font-bold text-[#082F49] text-xs text-center">{lk.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════ MAIN ADMIN CLIENT ════════════════════════ */

type SidebarTab = 'overview' | 'users' | 'classrooms' | 'data' | 'map';

const SIDEBAR_ITEMS: { id: SidebarTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'overview',    label: 'Tổng quan',   icon: <FaChartBar /> },
  { id: 'users',       label: 'Người dùng',  icon: <FaUsers /> },
  { id: 'classrooms',  label: 'Lớp học',     icon: <FaSchool /> },
  { id: 'data',        label: 'Dữ liệu',     icon: <FaDatabase /> },
  { id: 'map',         label: 'Bản đồ',      icon: <FaGlobeAsia /> },
];

export function AdminClient({ currentUser }: {
  currentUser: { name: string; image: string | null };
}) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <style>{`
        body { background: linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%); }
      `}</style>

      <div className="min-h-screen flex flex-col">
        {/* ── Top header ── */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-[24px]
          border-b border-white shadow-[0_4px_24px_rgba(14,165,233,0.10)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
            {/* Back + Logo */}
            <Link href="/"
              className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155]
                transition-colors font-bold text-sm shrink-0">
              <FaArrowLeft className="text-xs" />
              <span className="hidden sm:inline">Về trang chủ</span>
            </Link>

            <div className="w-px h-5 bg-slate-200 shrink-0" />

            <div className="flex items-center gap-3 flex-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                flex items-center justify-center text-white shadow-[0_8px_20px_rgba(6,182,212,0.4)]">
                <FaShieldAlt className="text-sm" />
              </div>
              <div>
                <p className="font-black text-[#082F49] text-sm leading-none">Admin Panel</p>
                <p className="text-[#94A3B8] text-[10px] font-semibold leading-none mt-0.5">
                  Vui học Địa Lý
                </p>
              </div>
            </div>

            {/* Admin avatar */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500
                flex items-center justify-center text-white text-xs font-black overflow-hidden
                border-2 border-amber-200 shadow-sm">
                {currentUser.image
                  ? <img src={currentUser.image} alt="" className="w-full h-full object-cover" />
                  : (currentUser.name?.charAt(0) ?? 'A').toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="font-bold text-[#082F49] text-xs leading-none">
                  {currentUser.name || 'Admin'}
                </p>
                <p className="text-[#94A3B8] text-[10px] font-semibold">Quản trị viên</p>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              className="lg:hidden w-9 h-9 rounded-full bg-slate-100 flex items-center
                justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <div className="space-y-1">
                <span className={`block w-4 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <span className={`block w-4 h-0.5 bg-current transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-4 h-0.5 bg-current transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
              </div>
            </button>
          </div>

          {/* Mobile nav - dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/40 bg-white/65 backdrop-blur-[24px] px-4 py-3 flex gap-2 shadow-lg rounded-b-[24px]">
              {SIDEBAR_ITEMS.map(item => (
                <button key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-full text-xs
                    font-bold transition-all
                    ${activeTab === item.id
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-[0_8px_20px_rgba(6,182,212,0.4)]'
                      : 'text-[#334155] bg-white/50 hover:bg-white/80 border border-white/80'
                    }`}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        {/* ── Body: sidebar + content ── */}
        <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
            <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
              p-3 shadow-[0_10px_30px_rgba(14,165,233,0.08)] sticky top-24">
              {SIDEBAR_ITEMS.map(item => (
                <button key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[24px] text-sm
                    font-bold transition-all text-left mb-1
                    ${activeTab === item.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_8px_20px_rgba(6,182,212,0.4)]'
                      : 'text-[#334155] hover:bg-slate-50 hover:text-[#082F49]'
                    }`}>
                  <span className={activeTab === item.id ? 'text-white' : 'text-[#94A3B8]'}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && activeTab !== item.id && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                      bg-cyan-100 text-cyan-600 border border-cyan-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {activeTab === 'overview'   && <OverviewTab />}
            {activeTab === 'users'      && <UsersTab />}
            {activeTab === 'classrooms' && <ClassroomsTab />}
            {activeTab === 'data'       && <DataTab />}
            {activeTab === 'map'        && <MapTab />}
          </main>
        </div>
      </div>
    </>
  );
}
