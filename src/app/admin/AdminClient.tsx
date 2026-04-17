'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FaArrowLeft, FaBell, FaChartBar, FaDatabase, FaEdit,
  FaGlobeAsia, FaPlus, FaSearch, FaShieldAlt, FaSpinner,
  FaTimes, FaTrash, FaUsers, FaDownload, FaExclamationTriangle,
} from 'react-icons/fa';

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
    <div className="bg-white/75 backdrop-blur-[20px] border border-white rounded-[24px] p-6
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
      <div className="relative w-full max-w-xl bg-white/90 backdrop-blur-[20px] border border-white
        rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-cyan-50 to-blue-50">
          <h3 className="font-black text-[#082F49] text-lg">
            {mode === 'add' ? '➕ Thêm thẻ mới' : '✏️ Sửa thẻ'}
          </h3>

          {/* Toggle */}
          <div className="flex items-center gap-2 mx-auto bg-white/80 border border-slate-200/80 rounded-[12px] p-1">
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
            <div className="flex items-start gap-2 px-4 py-3 rounded-[12px] bg-red-50 border
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
                    className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
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
                    className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
                      text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                      focus:ring-2 focus:ring-cyan-100 transition-all"
                    placeholder="📚" maxLength={8} />
                </div>
              </div>

              {/* Lesson context — readonly info bar */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] bg-slate-50
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
                  className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
                    text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                    focus:ring-2 focus:ring-cyan-100 transition-all"
                  placeholder="Nhập thuật ngữ..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">
                  Mặt sau (định nghĩa) *
                </label>
                <textarea value={form.back} onChange={set('back')} required rows={3}
                  className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
                    text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                    focus:ring-2 focus:ring-cyan-100 transition-all resize-none"
                  placeholder="Nhập định nghĩa / giải thích..." />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#334155] mb-1">Gợi ý (tuỳ chọn)</label>
                <input value={form.hint} onChange={set('hint')}
                  className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
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
              <div className="rounded-[14px] bg-[rgba(186,230,253,0.55)] border border-sky-200 px-4 py-3">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold
                    bg-slate-100 border border-slate-200 text-[#334155] hover:bg-slate-200
                    transition-all">
                  📄 Template 1 thẻ
                </button>
                {mode === 'add' && (
                  <button type="button"
                    onClick={() => setJsonText(JSON_TEMPLATE_ARRAY)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-bold
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
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs
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
                  className={`w-full px-4 py-3 rounded-[14px] border bg-slate-900 text-green-300
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
                <div className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-bold
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
              className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving || (inputMode === 'json' && !!jsonPreview.error)}
              className={`flex-1 py-2.5 rounded-[12px] text-white text-sm font-bold
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
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-[20px] border border-white
        rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] p-6 text-center">
        <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl mb-4
          ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
          <FaExclamationTriangle className={danger ? 'text-red-500' : 'text-amber-500'} />
        </div>
        <p className="text-[#082F49] font-bold text-base mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
              text-[#334155] hover:bg-slate-50 transition-all">
            Huỷ
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-[12px] text-white text-sm font-bold transition-all
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
  mode, initial, onClose, onSaved,
}: {
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
        res = await fetch('/api/admin/flashcards/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ grade, lessonId: lessonId.trim(), lessonTitle: lessonTitle.trim(), lessonIcon: lessonIcon.trim() || '📚' }),
        });
      } else {
        res = await fetch(`/api/admin/flashcards/lessons/${initial!._id}`, {
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-[20px] border border-white
        rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
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
            <div className="flex items-center gap-2 px-4 py-3 rounded-[12px] bg-red-50 border
              border-red-200 text-red-600 text-sm font-semibold">
              <FaExclamationTriangle className="shrink-0" /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Lớp *</label>
              <select value={grade} onChange={e => setGrade(Number(e.target.value))}
                disabled={mode === 'edit'}
                className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
                  text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                  focus:ring-2 focus:ring-cyan-100 transition-all disabled:opacity-60">
                {[6, 7, 8, 9].map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Icon</label>
              <input value={lessonIcon} onChange={e => setLessonIcon(e.target.value)}
                maxLength={8} placeholder="📚"
                className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
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
                  className="flex-1 px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-100
                    text-sm font-mono text-[#334155] cursor-default select-all" />
                <button type="button" onClick={() => setLessonId(genLessonId())}
                  title="Tạo ID mới"
                  className="px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
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
              className="w-full px-3 py-2.5 rounded-[12px] border border-slate-200 bg-slate-50
                text-sm font-semibold text-[#082F49] focus:outline-none focus:border-cyan-400
                focus:ring-2 focus:ring-cyan-100 transition-all" />
          </div>
          {mode === 'add' && (
            <div className="rounded-[14px] bg-[rgba(186,230,253,0.4)] border border-sky-200 px-4 py-3">
              <p className="text-[#0284C7] text-xs font-semibold">
                💡 Sau khi tạo, bạn sẽ được chuyển vào trang tạo thẻ ghi nhớ cho bài học này.
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-emerald-500 to-cyan-500
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
}

/* ── DeleteLessonConfirm ──────────────────────────────────────── */

function DeleteLessonConfirm({
  lesson, onClose, onDeleted,
}: {
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
      const res  = await fetch(`/api/admin/flashcards/lessons/${lesson._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xoá');
      onDeleted();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-[20px] border border-white
        rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <FaExclamationTriangle className="text-red-500 text-sm" />
          </div>
          <h3 className="font-black text-red-700 text-base">Xoá bài học</h3>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-[12px] bg-red-50 border border-red-200
              text-red-600 text-sm font-semibold">{error}</div>
          )}
          {/* Lesson info */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-[14px] border border-slate-200">
            <span className="text-2xl shrink-0">{lesson.lessonIcon}</span>
            <div className="min-w-0">
              <p className="font-black text-[#082F49] text-sm truncate">{lesson.lessonTitle}</p>
              <p className="text-[#94A3B8] text-xs font-semibold">Lớp {lesson.grade} · Mã: {lesson.lessonId}</p>
            </div>
          </div>
          {/* Warning */}
          <div className="rounded-[14px] bg-[rgba(254,226,226,0.6)] border border-red-200 px-4 py-3">
            <p className="text-red-600 text-xs font-bold">
              ⚠️ Xoá bài học này sẽ xoá toàn bộ{' '}
              <span className="font-black">{lesson.cardCount} thẻ ghi nhớ</span>{' '}
              bên trong. Thao tác không thể hoàn tác.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button onClick={handle} disabled={deleting}
              className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-red-500 to-rose-500
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
        className="px-3 py-1.5 rounded-[10px] text-xs font-bold border border-slate-200
          text-[#334155] disabled:opacity-40 hover:bg-slate-50 transition-all">
        ← Trước
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`d${i}`} className="px-1.5 text-[#94A3B8] text-xs">…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p as number)}
            className={`w-8 h-8 rounded-[8px] text-xs font-bold transition-all
              ${page === p
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm'
                : 'border border-slate-200 text-[#334155] hover:bg-slate-50'
              }`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-3 py-1.5 rounded-[10px] text-xs font-bold border border-slate-200
          text-[#334155] disabled:opacity-40 hover:bg-slate-50 transition-all">
        Sau →
      </button>
    </div>
  );
}

/* ── LessonsView ──────────────────────────────────────────────── */

function LessonsView({ onSelectLesson, onClearAll }: {
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
      const res  = await fetch('/api/admin/flashcards/lessons');
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
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[14px] text-sm font-bold
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
            className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-red-50 border
              border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-all">
            <FaTrash className="text-xs" /> Xoá tất cả
          </button>
          <button onClick={() => { setEditTarget(null); setFormMode('add'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-[12px]
              bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold
              hover:from-emerald-400 hover:to-cyan-400 shadow-md transition-all">
            <FaPlus className="text-xs" /> Thêm bài học
          </button>
        </div>
      </div>

      {/* Filter + Sort + Search */}
      <div className="bg-white/75 backdrop-blur-[20px] border border-white rounded-[20px]
        p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)] space-y-3">
        {/* Grade pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 6, 7, 8, 9] as const).map(g => (
            <button key={g} onClick={() => { setGradeFilter(g); setPage(1); }}
              className={`px-4 py-1.5 rounded-[9999px] text-sm font-bold border transition-all
                ${gradeFilter === g
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent shadow-md'
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
              className={`flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-bold
                border transition-all
                ${sortKey === k
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                  : 'bg-slate-50 border-slate-200 text-[#334155] hover:border-cyan-200'
                }`}>
              {lbl} {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-200
            rounded-[12px] px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2
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
          <div className="w-20 h-20 rounded-[24px] bg-slate-100 flex items-center justify-center text-4xl">📭</div>
          <p className="text-[#082F49] font-bold text-base">Chưa có bài học nào</p>
          <p className="text-[#94A3B8] text-sm font-semibold text-center px-4">
            Nhấn &quot;Thêm bài học&quot; để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {paginated.map(lesson => (
            <div key={`${lesson.grade}-${lesson.lessonId}`}
              className="flex items-center gap-3 bg-white/75 backdrop-blur-[20px] border border-white
                rounded-[16px] px-4 py-3 shadow-[0_4px_16px_rgba(14,165,233,0.07)]
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
                    className="w-7 h-7 rounded-[8px] bg-slate-50 border border-slate-200
                      flex items-center justify-center text-cyan-600 hover:bg-cyan-50
                      hover:border-cyan-300 transition-all">
                    <FaEdit className="text-[10px]" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(lesson)}
                    title="Xoá bài học"
                    className="w-7 h-7 rounded-[8px] bg-slate-50 border border-slate-200
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

function CardsView({ lesson, onBack, onRefreshLessons }: {
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
      const res  = await fetch(`/api/admin/flashcards?${params}`);
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
    const res = await fetch('/api/admin/flashcards', {
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
    const res = await fetch(`/api/admin/flashcards/${editingCard._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, grade: Number(form.grade) }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Lỗi'); }
    showToast('Đã cập nhật!');
    fetchCards();
  };

  const handleDelete = async (card: CardRow) => {
    const res = await fetch(`/api/admin/flashcards/${card._id}`, { method: 'DELETE' });
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
      const res = await fetch('/api/admin/flashcards/reorder', {
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
        <div className={`fixed top-6 right-6 z-[99999] px-5 py-3 rounded-[16px] text-sm font-bold
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
            <span className="w-8 h-8 rounded-[10px] bg-slate-100 group-hover:bg-slate-200
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
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-[12px]
            bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold
            hover:from-cyan-400 hover:to-blue-400 shadow-md transition-all">
          <FaPlus className="text-xs" /> Thêm thẻ
        </button>
      </div>

      {/* Sort + Search bar */}
      <div className="bg-white/75 backdrop-blur-[20px] border border-white rounded-[20px]
        p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex flex-wrap gap-3 items-center">
        <span className="text-xs font-bold text-[#94A3B8]">Sắp xếp:</span>
        {([['order', 'Thứ tự'], ['front', 'A-Z'], ['createdAt', 'Ngày tạo']] as const).map(([k, lbl]) => (
          <button key={k} onClick={() => toggleSort(k)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-bold
              border transition-all
              ${sortKey === k
                ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                : 'bg-slate-50 border-slate-200 text-[#334155] hover:border-cyan-200'
              }`}>
            {lbl} {sortKey === k && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 bg-slate-50 border border-slate-200
          rounded-[12px] px-3 py-2 focus-within:border-cyan-400 focus-within:ring-2
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
          <div className="w-20 h-20 rounded-[24px] bg-slate-100 flex items-center justify-center text-4xl">📭</div>
          <p className="text-[#082F49] font-bold">
            {cards.length === 0 ? 'Bài học chưa có thẻ nào' : 'Không tìm thấy thẻ phù hợp'}
          </p>
          {cards.length === 0 && (
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-[12px]
                bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold
                hover:from-cyan-400 hover:to-blue-400 shadow-md transition-all">
              <FaPlus className="text-xs" /> Thêm thẻ đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white/75 backdrop-blur-[20px] border border-white rounded-[20px]
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
                <tr className="border-b border-slate-100 bg-slate-50/60">
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
                          className="w-7 h-7 rounded-[8px] bg-cyan-50 border border-cyan-200
                            flex items-center justify-center text-cyan-600 hover:bg-cyan-100
                            transition-colors">
                          <FaEdit className="text-[10px]" />
                        </button>
                        <button onClick={() => setConfirmDelete(card)}
                          className="w-7 h-7 rounded-[8px] bg-red-50 border border-red-200
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

function DataTab() {
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
    const res = await fetch('/api/admin/flashcards', { method: 'DELETE' });
    if (!res.ok) { showToast('Xoá thất bại', 'error'); return; }
    showToast('Đã xoá toàn bộ thẻ!');
    if (view === 'cards') handleBack();
    setLessonsKey(k => k + 1);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res  = await fetch('/api/admin/flashcards/seed', { method: 'POST' });
      const data = await res.json();
      if (data.skipped) showToast(data.message, 'error');
      else { showToast(`Đã nhập ${data.count} thẻ từ dữ liệu gốc!`); setLessonsKey(k => k + 1); }
    } catch { showToast('Lỗi khi nhập dữ liệu', 'error'); }
    finally { setSeeding(false); }
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-[99999] px-5 py-3 rounded-[16px] text-sm font-bold
          shadow-lg border
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] text-[#16A34A] border-green-200'
            : 'bg-[rgba(254,226,226,0.95)] text-[#DC2626] border-red-200'
          }`}>
          {toast.msg}
        </div>
      )}

      {view === 'lessons' && (
        <LessonsView key={lessonsKey} onSelectLesson={handleSelectLesson} onClearAll={() => setConfirmClearAll(true)} />
      )}
      {view === 'cards' && selectedLesson && (
        <CardsView
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

/* ═══════════════════════ USERS TAB ════════════════════════════════ */

function UsersTab() {
  const [users, setUsers]   = useState<UserRow[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/users?page=${p}&limit=${LIMIT}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(page); }, [fetchUsers, page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-[#082F49]">👥 Người dùng</h2>
        <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">{total} tài khoản</p>
      </div>

      <div className="bg-white/75 backdrop-blur-[20px] border border-white rounded-[20px]
        shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FaSpinner className="text-3xl text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">Tài khoản</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">Email</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">Vai trò</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">EXP</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">Chuỗi 🔥</th>
                  <th className="text-left px-5 py-3 text-[#94A3B8] font-bold text-xs">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleInfo = ROLE_LABEL[u.role] ?? { label: '?', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
                  return (
                    <tr key={u._id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-cyan-400 to-blue-500
                            flex items-center justify-center text-white text-xs font-black shrink-0">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#082F49]">{u.username}</p>
                            {u.fullName && <p className="text-[#94A3B8] text-xs">{u.fullName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[#334155]">{u.email ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${roleInfo.cls}`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-cyan-600">{u.exp?.toLocaleString() ?? 0}</td>
                      <td className="px-5 py-3 font-bold text-orange-500">{u.streak ?? 0} ngày</td>
                      <td className="px-5 py-3 text-[#94A3B8] text-xs">
                        {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-[#94A3B8] text-xs font-semibold">
              Trang {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-[10px] text-xs font-bold border border-slate-200
                  text-[#334155] disabled:opacity-40 hover:bg-slate-50 transition-all">
                ← Trước
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-[10px] text-xs font-bold border border-slate-200
                  text-[#334155] disabled:opacity-40 hover:bg-slate-50 transition-all">
                Sau →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════ OVERVIEW TAB ════════════════════════════  */

function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .finally(() => setLoading(false));
  }, []);

  const QUICK_LINKS = [
    { href: '/',          icon: '🏠', label: 'Xem trang chủ',     color: 'from-cyan-100 to-blue-100' },
    { href: '/classroom', icon: '🏫', label: 'Xem lớp học',       color: 'from-violet-100 to-purple-100' },
    { href: '/map',       icon: '🗺️', label: 'Xem bản đồ',       color: 'from-emerald-100 to-green-100' },
    { href: '/books',     icon: '📚', label: 'Quản lý sách',      color: 'from-amber-100 to-orange-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-[#082F49]">📊 Tổng quan</h2>
        <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">Thống kê hệ thống</p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            icon={<FaUsers />}
            label="Tổng người dùng"
            value={stats?.totalUsers ?? 0}
            sub="Tất cả tài khoản"
            color="bg-blue-100 text-blue-600"
          />
          <StatCard
            icon={<FaBell />}
            label="Người dùng mới (7 ngày)"
            value={stats?.newUsers ?? 0}
            sub="Đăng ký tuần này"
            color="bg-cyan-100 text-cyan-600"
          />
          <StatCard
            icon={<FaDatabase />}
            label="Thẻ ghi nhớ (DB)"
            value={stats?.totalFlashcards ?? 0}
            sub="Đã lưu trong database"
            color="bg-emerald-100 text-emerald-600"
          />
        </div>
      )}

      {/* Quick links */}
      <div>
        <h3 className="text-base font-black text-[#082F49] mb-4">🔗 Truy cập nhanh</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map(lk => (
            <Link key={lk.href} href={lk.href}
              className={`flex flex-col items-center gap-3 p-5 rounded-[20px] bg-gradient-to-br
                ${lk.color} border border-white/80 hover:scale-[1.02] transition-all
                shadow-[0_4px_16px_rgba(14,165,233,0.08)] group`}>
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {lk.icon}
              </span>
              <p className="font-bold text-[#082F49] text-xs text-center">{lk.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-[rgba(186,230,253,0.6)] border border-sky-200 rounded-[20px] p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-bold text-[#0284C7] text-sm">Hướng dẫn sử dụng Admin Panel</p>
            <ul className="text-[#0284C7] text-xs font-semibold mt-2 space-y-1 list-disc list-inside opacity-80">
              <li>Tab <strong>Người dùng</strong>: Xem danh sách và thông tin tài khoản</li>
              <li>Tab <strong>Dữ liệu</strong>: Quản lý thẻ ghi nhớ (thêm, sửa, xoá)</li>
              <li>Nhấn <strong>Nhập dữ liệu mặc định</strong> để seed dữ liệu ban đầu vào DB</li>
              <li>Sau khi seed, học sinh sẽ dùng dữ liệu từ trang Thẻ Ghi Nhớ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ MAIN ADMIN CLIENT ════════════════════════ */

type SidebarTab = 'overview' | 'users' | 'data';

const SIDEBAR_ITEMS: { id: SidebarTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'overview', label: 'Tổng quan', icon: <FaChartBar /> },
  { id: 'users',    label: 'Người dùng', icon: <FaUsers /> },
  { id: 'data',     label: 'Dữ liệu', icon: <FaDatabase /> },
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
              <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-amber-400 to-orange-500
                flex items-center justify-center text-white shadow-md">
                <FaShieldAlt className="text-sm" />
              </div>
              <div>
                <p className="font-black text-[#082F49] text-sm leading-none">Admin Panel</p>
                <p className="text-[#94A3B8] text-[10px] font-semibold leading-none mt-0.5">
                  GeoExplore
                </p>
              </div>
            </div>

            {/* Admin avatar */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-amber-400 to-orange-500
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
              className="lg:hidden w-9 h-9 rounded-[10px] bg-slate-100 flex items-center
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
            <div className="lg:hidden border-t border-slate-100 bg-white/95 px-4 py-3 flex gap-2">
              {SIDEBAR_ITEMS.map(item => (
                <button key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-[12px] text-xs
                    font-bold transition-all
                    ${activeTab === item.id
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-md'
                      : 'text-[#334155] bg-slate-50 hover:bg-slate-100'
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
            <div className="bg-white/75 backdrop-blur-[20px] border border-white rounded-[24px]
              p-3 shadow-[0_10px_30px_rgba(14,165,233,0.08)] sticky top-24">
              {SIDEBAR_ITEMS.map(item => (
                <button key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm
                    font-bold transition-all text-left mb-1
                    ${activeTab === item.id
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
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
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'users'    && <UsersTab />}
            {activeTab === 'data'     && <DataTab />}
          </main>
        </div>
      </div>
    </>
  );
}
