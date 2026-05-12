'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaSpinner, FaExclamationTriangle, FaTrash, FaEdit, FaImage, FaVideo, FaVolumeUp, FaPlus, FaArrowLeft, FaSearch, FaUpload, FaGripVertical } from 'react-icons/fa';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Types ──

export interface QuizSetRow {
  _id: string;
  grade: number;
  quizId: string;
  title: string;
  icon: string;
  quizType: string;
  timeLimit: number;
  order: number;
  questionCount?: number;
}

export interface QuizQuestionRow {
  _id: string;
  quizSetId: string;
  questionType: 'mc' | 'tf' | 'essay';
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | '';
  options: string[];
  correctOption?: number;
  tfAnswers?: boolean[];
  essayAnswer?: string;
  explanation?: string;
  order: number;
}

// ── Quiz Type Config ──
const QUIZ_TYPE_CONFIG: Record<string, { label: string; color: string; timeLimit: number }> = {
  'kt15p':   { label: 'Kiểm tra 15p',    color: 'bg-[rgba(186,230,253,0.8)] text-[#0284C7] border-blue-200',    timeLimit: 15 },
  'kt1tiet': { label: 'Kiểm tra 1 tiết', color: 'bg-[rgba(233,213,255,0.8)] text-violet-700 border-violet-200',  timeLimit: 45 },
  'giuaky':  { label: 'Đề thi giữa kỳ', color: 'bg-[rgba(254,240,138,0.8)] text-[#D97706] border-amber-300',    timeLimit: 25 },
  'cuoiky':  { label: 'Đề thi cuối kỳ', color: 'bg-[rgba(254,215,170,0.8)] text-orange-600 border-orange-300', timeLimit: 25 },
};
function getQuizTypeLabel(quizType: string) {
  return QUIZ_TYPE_CONFIG[quizType]?.label ?? quizType;
}
function getQuizTypeColor(quizType: string) {
  return QUIZ_TYPE_CONFIG[quizType]?.color ?? 'bg-slate-100 text-slate-500 border-slate-200';
}

// ── Components ──

function ConfirmDialog({ message, onConfirm, onCancel, danger = true }: {
  message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 mx-auto
            ${danger ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-500'}`}>
            <FaExclamationTriangle className="text-xl" />
          </div>
          <p className="text-center font-bold text-[#082F49]">{message}</p>
          <div className="flex gap-3 pt-2">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-full text-white text-sm font-bold transition-all
                ${danger ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400'
                         : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'}`}>
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

function Paginator({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
        className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 text-[#334155] disabled:opacity-40 hover:bg-slate-50">
        ← Trước
      </button>
      <span className="text-xs font-bold text-[#94A3B8]">{page} / {totalPages}</span>
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 text-[#334155] disabled:opacity-40 hover:bg-slate-50">
        Sau →
      </button>
    </div>
  );
}

function SortableQuestionCard({ id, children }: {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined }}
    >
      {children(
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 shrink-0 mt-1 touch-none p-0.5">
          <FaGripVertical className="text-sm" />
        </button>
      )}
    </div>
  );
}

// ── Modals ──

function QuizSetFormModal({ mode, initial, onClose, onSaved }: {
  mode: 'add' | 'edit'; initial?: QuizSetRow; onClose: () => void; onSaved: (s: QuizSetRow) => void;
}) {
  const [form, setForm] = useState({
    grade: initial?.grade ?? 6,
    quizId: initial?.quizId ?? `q-${Date.now().toString(36)}`,
    title: initial?.title ?? '',
    icon: initial?.icon ?? '📝',
    quizType: initial?.quizType ?? 'kt15p',
    timeLimit: initial?.timeLimit ?? 15
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.quizId.trim()) return setError('Thiếu thông tin bắt buộc');
    setSaving(true); setError('');
    try {
      const url = mode === 'add' ? '/api/admin/quizzes/sets' : `/api/admin/quizzes/sets/${initial!._id}`;
      const method = mode === 'add' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');
      onSaved({ ...(initial ?? { _id: data.set._id, questionCount: 0, order: 0 }), ...data.set });
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] border border-white/80 rounded-[32px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-cyan-50">
          <h3 className="font-black text-[#082F49] text-lg">{mode === 'add' ? '➕ Tạo Đề kiểm tra' : '✏️ Sửa Đề kiểm tra'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <FaTimes className="text-xs" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-[16px]">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Lớp</label>
              <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-full border border-slate-200 bg-white font-bold text-[#082F49] outline-none">
                {[6,7,8,9].map(g => <option key={g} value={g}>Lớp {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Loại đề</label>
              <select value={form.quizType} onChange={e => {
                const qt = e.target.value;
                const cfg = QUIZ_TYPE_CONFIG[qt];
                setForm(p => ({ ...p, quizType: qt, timeLimit: cfg?.timeLimit ?? 15 }));
              }}
                className="w-full px-3 py-2 rounded-full border border-slate-200 bg-white font-bold text-[#082F49] outline-none">
                <option value="kt15p">Kiểm tra 15p</option>
                <option value="kt1tiet">Kiểm tra 1 tiết</option>
                <option value="giuaky">Đề thi giữa kỳ</option>
                <option value="cuoiky">Đề thi cuối kỳ</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">Tên Đề kiểm tra *</label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
              className="w-full px-3 py-2 rounded-full border border-slate-200 bg-white font-bold text-[#082F49] outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Mã định danh</label>
              <input value={form.quizId} onChange={e => setForm(p => ({ ...p, quizId: e.target.value }))} disabled={mode === 'add'}
                className="w-full px-3 py-2 rounded-full border border-slate-200 bg-slate-100 font-mono text-[#082F49] outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">Icon</label>
              <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                className="w-full px-3 py-2 rounded-full border border-slate-200 bg-white text-center font-bold outline-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full border border-slate-200 font-bold text-slate-500">Huỷ</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-full bg-cyan-500 font-bold text-white flex justify-center items-center gap-2">
              {saving ? <FaSpinner className="animate-spin" /> : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

function QuestionFormModal({ mode, setId, initial, onClose, onSaved }: {
  mode: 'add' | 'edit'; setId: string; initial?: QuizQuestionRow; onClose: () => void; onSaved: () => void;
}) {
  const [questionType, setQuestionType] = useState<'mc' | 'tf' | 'essay'>(initial?.questionType ?? 'mc');
  const [form, setForm] = useState({
    content: initial?.content ?? '',
    mediaUrl: initial?.mediaUrl ?? '',
    mediaType: initial?.mediaType ?? '',
    // MC
    options: initial?.options?.length === 4 ? initial.options : ['', '', '', ''],
    correctOption: initial?.correctOption ?? 0,
    // TF
    tfOptions: initial?.options?.length === 4 ? initial.options : ['', '', '', ''],
    tfAnswers: initial?.tfAnswers?.length === 4 ? initial.tfAnswers : [true, true, true, true],
    // Essay
    essayAnswer: initial?.essayAnswer ?? '',
    explanation: initial?.explanation ?? ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.content.trim()) return setError('Nhập nội dung câu hỏi');
    if (questionType === 'mc' && form.options.some(o => !o.trim())) return setError('Nhập đủ 4 đáp án');
    if (questionType === 'tf' && form.tfOptions.some(o => !o.trim())) return setError('Nhập đủ 4 ý đúng/sai');
    setSaving(true); setError('');
    try {
      const url = mode === 'add' ? '/api/admin/quizzes/questions' : `/api/admin/quizzes/questions/${initial!._id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      const body: Record<string, unknown> = {
        quizSetId: setId,
        questionType,
        content: form.content,
        mediaUrl: form.mediaUrl || undefined,
        mediaType: form.mediaType || undefined,
        explanation: form.explanation || undefined,
      };
      if (questionType === 'mc') {
        body.options = form.options;
        body.correctOption = form.correctOption;
      } else if (questionType === 'tf') {
        body.options = form.tfOptions;
        body.tfAnswers = form.tfAnswers;
      } else {
        body.options = [];
        body.essayAnswer = form.essayAnswer;
      }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi');
      onSaved();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const TYPE_TABS: { key: 'mc' | 'tf' | 'essay'; label: string; desc: string }[] = [
    { key: 'mc',    label: 'Nhiều phương án', desc: 'Chọn 1 đáp án đúng trong 4' },
    { key: 'tf',    label: 'Đúng / Sai',      desc: '4 ý, mỗi ý tích Đúng hoặc Sai' },
    { key: 'essay', label: 'Tự luận',          desc: 'Học sinh viết câu trả lời' },
  ];

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-[rgba(255,255,255,0.92)] backdrop-blur-[32px] border border-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h3 className="font-black text-[#082F49] text-lg">{mode === 'add' ? '➕ Thêm câu hỏi' : '✏️ Sửa câu hỏi'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><FaTimes /></button>
        </div>

        {/* Question type tabs */}
        <div className="px-6 pt-4 pb-0 bg-white shrink-0">
          <p className="text-xs font-bold text-[#94A3B8] uppercase mb-2">Loại câu hỏi</p>
          <div className="flex gap-2 flex-wrap">
            {TYPE_TABS.map(t => (
              <button key={t.key} type="button"
                onClick={() => { setQuestionType(t.key); setError(''); }}
                className={`flex flex-col px-4 py-2.5 rounded-[16px] border-2 text-left transition-all
                  ${questionType === t.key
                    ? 'border-cyan-400 bg-cyan-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <span className={`text-sm font-black ${questionType === t.key ? 'text-cyan-700' : 'text-[#334155]'}`}>{t.label}</span>
                <span className="text-[10px] font-semibold text-[#94A3B8] mt-0.5">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-[16px]">{error}</div>}

          {/* Content */}
          <div>
            <label className="block text-sm font-bold text-[#082F49] mb-2">
              {questionType === 'tf' ? 'Nội dung / Tình huống dẫn *' : 'Nội dung câu hỏi *'}
            </label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required rows={4}
              className="w-full px-4 py-3 rounded-[20px] border border-slate-200 bg-white font-semibold text-[#082F49] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none"
              placeholder={questionType === 'tf' ? 'VD: Dựa vào hình dưới, ngày 22-6 ở nửa cầu Nam có hiện tượng...' : 'VD: Thủ đô của Việt Nam là?'} />
          </div>

          {/* Media */}
          <div className="p-4 rounded-[20px] bg-slate-50 border border-slate-200">
            <label className="block text-xs font-bold text-[#94A3B8] mb-2 uppercase">Đính kèm Media (Tuỳ chọn)</label>
            <div className="flex gap-3">
              <select value={form.mediaType} onChange={e => setForm(p => ({ ...p, mediaType: e.target.value as any, mediaUrl: '' }))}
                className="px-3 py-2 rounded-full border border-slate-200 bg-white text-sm font-bold outline-none shrink-0">
                <option value="">Không có</option>
                <option value="image">Hình ảnh</option>
                <option value="video">Video (YouTube)</option>
                <option value="audio">Âm thanh</option>
              </select>
              <div className="flex-1 flex gap-2">
                <input value={form.mediaUrl} onChange={e => setForm(p => ({ ...p, mediaUrl: e.target.value }))}
                  placeholder="Nhập đường dẫn (URL)..." disabled={!form.mediaType}
                  className="flex-1 px-3 py-2 rounded-full border border-slate-200 bg-white text-sm font-semibold outline-none disabled:bg-slate-100 min-w-0" />
                {form.mediaType && (form.mediaType === 'image' || form.mediaType === 'audio') && (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="px-3 py-2 rounded-full bg-slate-200 text-[#082F49] hover:bg-slate-300 font-bold text-sm shrink-0 flex items-center gap-2">
                    {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />} Tải lên
                  </button>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept={form.mediaType === 'image' ? 'image/*' : 'audio/*'}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true); setError('');
                    try {
                      const fd = new FormData(); fd.append('file', file);
                      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error);
                      setForm(p => ({ ...p, mediaUrl: d.url }));
                    } catch (err: any) { setError(err.message); }
                    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
                  }} />
              </div>
            </div>
            {form.mediaType === 'image' && form.mediaUrl && <img src={form.mediaUrl} alt="" className="mt-3 max-h-32 rounded-[12px] object-cover" />}
            {form.mediaType === 'audio' && form.mediaUrl && <audio src={form.mediaUrl} controls className="mt-3 w-full" />}
          </div>

          {/* ── MC: 4 options, pick correct ── */}
          {questionType === 'mc' && (
            <div>
              <label className="block text-sm font-bold text-[#082F49] mb-2">Đáp án (nhấn chữ cái để chọn đáp án đúng) *</label>
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((lbl, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-2 rounded-[20px] border-2 transition-all ${form.correctOption === idx ? 'border-emerald-400 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                    <button type="button" onClick={() => setForm(p => ({ ...p, correctOption: idx }))}
                      className={`w-10 h-10 rounded-full flex justify-center items-center font-black text-sm shrink-0 transition-colors
                        ${form.correctOption === idx ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                      {lbl}
                    </button>
                    <input value={form.options[idx]} onChange={e => {
                        const o = [...form.options]; o[idx] = e.target.value;
                        setForm(p => ({ ...p, options: o }));
                      }} required
                      className="flex-1 px-3 py-2 rounded-full border-none bg-transparent font-semibold text-[#082F49] outline-none"
                      placeholder={`Nội dung đáp án ${lbl}...`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TF: 4 statements, each true or false ── */}
          {questionType === 'tf' && (
            <div>
              <label className="block text-sm font-bold text-[#082F49] mb-2">4 ý a, b, c, d — nhập nội dung và chọn Đúng/Sai *</label>
              <div className="space-y-3">
                {['a', 'b', 'c', 'd'].map((lbl, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-[20px] border border-slate-200 bg-white">
                    <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500 shrink-0">{lbl}</span>
                    <input value={form.tfOptions[idx]} onChange={e => {
                        const o = [...form.tfOptions]; o[idx] = e.target.value;
                        setForm(p => ({ ...p, tfOptions: o }));
                      }} required
                      className="flex-1 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 font-semibold text-[#082F49] outline-none text-sm"
                      placeholder={`Nội dung ý ${lbl}...`} />
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => {
                          const a = [...form.tfAnswers]; a[idx] = true;
                          setForm(p => ({ ...p, tfAnswers: a }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all
                          ${form.tfAnswers[idx] ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-emerald-300'}`}>
                        Đúng
                      </button>
                      <button type="button" onClick={() => {
                          const a = [...form.tfAnswers]; a[idx] = false;
                          setForm(p => ({ ...p, tfAnswers: a }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-black border transition-all
                          ${!form.tfAnswers[idx] ? 'bg-red-400 text-white border-red-400 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:border-red-300'}`}>
                        Sai
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Essay: expected answer ── */}
          {questionType === 'essay' && (
            <div>
              <label className="block text-sm font-bold text-[#082F49] mb-2">Đáp án mẫu (để giáo viên tham khảo)</label>
              <textarea value={form.essayAnswer} onChange={e => setForm(p => ({ ...p, essayAnswer: e.target.value }))} rows={4}
                className="w-full px-4 py-3 rounded-[20px] border border-slate-200 bg-white font-semibold text-[#082F49] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none"
                placeholder="Nhập đáp án mẫu hoặc gợi ý chấm điểm..." />
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-bold text-[#082F49] mb-2">Giải thích (Tuỳ chọn)</label>
            <textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} rows={4}
              className="w-full px-4 py-3 rounded-[20px] border border-slate-200 bg-white font-semibold text-[#082F49] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 resize-none"
              placeholder="Giải thích thêm sau khi học sinh trả lời..." />
          </div>
        </form>

        <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full border border-slate-200 font-bold text-slate-500 hover:bg-slate-50">Huỷ</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-3 rounded-full bg-cyan-500 font-bold text-white flex justify-center items-center gap-2 hover:bg-cyan-400 shadow-md">
            {saving ? <FaSpinner className="animate-spin" /> : 'Lưu Câu Hỏi'}
          </button>
        </div>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}

// ── Views ──

function QuizSetsView({ onSelect, onViewResults }: { onSelect: (set: QuizSetRow) => void; onViewResults: (set: QuizSetRow) => void }) {
  const [sets, setSets] = useState<QuizSetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<QuizSetRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizSetRow | null>(null);

  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'grade' | 'title' | 'count'>('grade');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 14;

  const fetchSets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/quizzes/sets');
      const data = await res.json();
      setSets(data.sets ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget._id === 'ALL') {
        await fetch('/api/admin/quizzes/sets', { method: 'DELETE' });
        setSets([]);
      } else {
        await fetch(`/api/admin/quizzes/sets/${deleteTarget._id}`, { method: 'DELETE' });
        setSets(p => p.filter(s => s._id !== deleteTarget._id));
      }
    } finally { setDeleteTarget(null); }
  };

  const filtered = useMemo(() => {
    let list = sets;
    if (gradeFilter !== 'all') list = list.filter(l => l.grade === gradeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.title.toLowerCase().includes(q) || l.quizId.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'grade') cmp = a.grade - b.grade || a.quizId.localeCompare(b.quizId);
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      if (sortKey === 'count') cmp = (a.questionCount ?? 0) - (b.questionCount ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [sets, gradeFilter, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const GRADE_COLORS: Record<number, string> = {
    6: 'border-cyan-200 text-cyan-600 bg-cyan-50',
    7: 'border-emerald-200 text-emerald-600 bg-emerald-50',
    8: 'border-amber-200 text-amber-600 bg-amber-50',
    9: 'border-rose-200 text-rose-600 bg-rose-50',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#082F49]">📝 Đề kiểm tra</h2>
          <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">
            {loading ? '...' : `${filtered.length} đề kiểm tra`}
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <button onClick={() => setDeleteTarget({ _id: 'ALL', title: 'TẤT CẢ ĐỀ KIỂM TRA', grade: 0, quizId: '', icon: '', quizType: '', timeLimit: 0, order: 0 })}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border
              border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-all">
            <FaTrash className="text-xs" /> Xoá tất cả
          </button>
          <button onClick={() => { setEditTarget(null); setModalMode('add'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full
              bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-bold
              hover:from-emerald-400 hover:to-cyan-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
            <FaPlus className="text-xs" /> Tạo Đề Mới
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
          {([['grade', 'Lớp'], ['title', 'Tên đề'], ['count', 'Số câu']] as const).map(([k, lbl]) => (
            <button key={k} onClick={() => toggleSort(k as any)}
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
              placeholder="Tìm đề kiểm tra..."
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

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
          <p className="text-[#94A3B8] font-semibold text-sm">Đang tải...</p>
        </div>
      ) : paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center text-4xl">📭</div>
          <p className="text-[#082F49] font-bold text-base">Chưa có đề kiểm tra nào</p>
          <p className="text-[#94A3B8] text-sm font-semibold text-center px-4">
            Nhấn "Tạo Đề Mới" để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {paginated.map(s => (
            <div key={s._id}
              className="flex items-center gap-3 bg-white/65 backdrop-blur-[24px] border border-white/80
                rounded-[24px] px-4 py-3 shadow-[0_4px_16px_rgba(14,165,233,0.07)]
                hover:shadow-[0_6px_20px_rgba(6,182,212,0.12)] hover:border-cyan-200
                hover:bg-white/90 transition-all duration-200">
              <button onClick={() => onSelect(s)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <span className="text-xl shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#082F49] text-sm truncate leading-tight">{s.title}</p>
                  <p className="text-[#94A3B8] text-[11px] font-semibold mt-0.5">Mã: {s.quizId} · 🕒 {s.timeLimit} phút</p>
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getQuizTypeColor(s.quizType || 'kt15p')}`}>
                  {getQuizTypeLabel(s.quizType || 'kt15p')}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${GRADE_COLORS[s.grade] ?? ''}`}>
                  Lớp {s.grade}
                </span>
                <span className="text-[#94A3B8] text-xs font-bold w-14 text-right">
                  {s.questionCount ?? 0} câu
                </span>
                <div className="flex gap-1 ml-1 pl-2 border-l border-slate-100">
                  <button onClick={() => onViewResults(s)}
                    title="Xem bài làm của học sinh"
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 border border-violet-200
                      text-violet-600 hover:bg-violet-100 hover:border-violet-300 transition-all text-[10px] font-black">
                    📊 Bài làm
                  </button>
                  <button onClick={() => { setEditTarget(s); setModalMode('edit'); }}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                      flex items-center justify-center text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all">
                    <FaEdit className="text-[10px]" />
                  </button>
                  <button onClick={() => setDeleteTarget(s)}
                    className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200
                      flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-300 transition-all">
                    <FaTrash className="text-[10px]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[#94A3B8] text-xs font-semibold">
            Trang {page}/{totalPages} · {filtered.length} đề kiểm tra
          </p>
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {modalMode && <QuizSetFormModal mode={modalMode} initial={editTarget ?? undefined} onClose={() => { setModalMode(null); setEditTarget(null); }} onSaved={() => { setModalMode(null); setEditTarget(null); fetchSets(); }} />}
      {deleteTarget && <ConfirmDialog message={`Xoá đề "${deleteTarget.title}"? Các câu hỏi bên trong cũng sẽ bị xoá.`} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

function QuestionsView({ set, onBack }: { set: QuizSetRow; onBack: () => void }) {
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<QuizQuestionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QuizQuestionRow | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'order' | 'content'>('order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/questions?setId=${set._id}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } finally { setLoading(false); }
  }, [set]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/quizzes/questions/${deleteTarget._id}`, { method: 'DELETE' });
      fetchQuestions();
    } finally { setDeleteTarget(null); }
  };

  const filtered = useMemo(() => {
    let list = questions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.content.toLowerCase().includes(q) ||
        c.options.some(o => o.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'order') cmp = a.order - b.order;
      if (sortKey === 'content') cmp = a.content.localeCompare(b.content);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [questions, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(1);
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback((event: DragEndEvent, sectionType: 'mc' | 'tf' | 'essay') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSortKey('order');
    setSortDir('asc');
    setQuestions(prev => {
      const isIn = (q: QuizQuestionRow) =>
        sectionType === 'mc' ? (q.questionType ?? 'mc') === 'mc' : q.questionType === sectionType;
      const sectionItems = prev.filter(isIn);
      const oldIdx = sectionItems.findIndex(q => q._id === String(active.id));
      const newIdx = sectionItems.findIndex(q => q._id === String(over.id));
      if (oldIdx === -1 || newIdx === -1) return prev;
      const reordered = arrayMove(sectionItems, oldIdx, newIdx);
      let si = 0;
      const next = prev.map(q => isIn(q) ? reordered[si++] : q);
      const withOrders = next.map((q, idx) => ({ ...q, order: idx }));
      fetch('/api/admin/quizzes/questions/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: withOrders.map(q => q._id) }),
      }).catch(console.error);
      return withOrders;
    });
  }, [setSortKey, setSortDir]);

  return (
    <div className="space-y-5">
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
            <span className="hidden sm:inline">Danh sách đề kiểm tra</span>
          </button>
          <span className="text-slate-300 font-bold">/</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">{set.icon}</span>
            <div>
              <p className="font-black text-[#082F49] text-sm leading-none">{set.title}</p>
              <p className="text-[#94A3B8] text-xs font-semibold mt-0.5">
                Lớp {set.grade} · {questions.length} câu hỏi
              </p>
            </div>
          </div>
        </div>
        <button onClick={() => { setEditTarget(null); setModalMode('add'); }}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-full
            bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold
            hover:from-cyan-400 hover:to-blue-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
          <FaPlus className="text-xs" /> Thêm câu hỏi
        </button>
      </div>

      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px]
        p-4 shadow-[0_10px_30px_rgba(14,165,233,0.08)] flex flex-wrap gap-3 items-center">
        <span className="text-xs font-bold text-[#94A3B8]">Sắp xếp:</span>
        {([['order', 'Thứ tự'], ['content', 'Nội dung']] as const).map(([k, lbl]) => (
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
            placeholder="Tìm câu hỏi..."
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

      {/* Question list grouped by type */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
          <p className="text-[#94A3B8] font-semibold text-sm">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-[32px] bg-slate-100 flex items-center justify-center text-4xl">📭</div>
          <p className="text-[#082F49] font-bold">
            {questions.length === 0 ? 'Đề này chưa có câu hỏi nào' : 'Không tìm thấy câu hỏi phù hợp'}
          </p>
          {questions.length === 0 && (
            <button onClick={() => { setEditTarget(null); setModalMode('add'); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full
                bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold
                hover:from-cyan-400 hover:to-blue-400 shadow-[0_8px_20px_rgba(6,182,212,0.4)] transition-all">
              <FaPlus className="text-xs" /> Thêm câu đầu tiên
            </button>
          )}
        </div>
      ) : (() => {
        const mcList   = filtered.filter(q => (q.questionType ?? 'mc') === 'mc');
        const tfList   = filtered.filter(q => q.questionType === 'tf');
        const essayList= filtered.filter(q => q.questionType === 'essay');

        let mcCounter = 0;
        let tfCounter = 0;
        let essayCounter = 0;

        const ActionBtns = ({ q }: { q: QuizQuestionRow }) => (
          <div className="flex gap-1 shrink-0 ml-4">
            <button onClick={() => { setEditTarget(q); setModalMode('edit'); }}
              className="w-7 h-7 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 hover:bg-cyan-100 transition-colors">
              <FaEdit className="text-[10px]" />
            </button>
            <button onClick={() => setDeleteTarget(q)}
              className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors">
              <FaTrash className="text-[10px]" />
            </button>
          </div>
        );

        const MediaBadge = ({ q }: { q: QuizQuestionRow }) => q.mediaType ? (
          <div className="flex items-center gap-1.5 mt-1.5 px-2.5 py-1 w-fit rounded-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-500">
            {q.mediaType === 'image' && <><FaImage className="text-cyan-500" /> Ảnh</>}
            {q.mediaType === 'video' && <><FaVideo className="text-rose-500" /> Video</>}
            {q.mediaType === 'audio' && <><FaVolumeUp className="text-violet-500" /> Âm thanh</>}
          </div>
        ) : null;

        return (
          <div className="space-y-6">
            {/* ── Phần I: Trắc nghiệm khách quan ── */}
            {(mcList.length > 0 || tfList.length > 0) && (
              <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                  <p className="font-black text-[#082F49] text-base">Phần I. Trắc nghiệm khách quan</p>
                  <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">{mcList.length + tfList.length} câu</p>
                </div>

                <div className="p-3 space-y-5">
                  {/* 1.1 MC */}
                  {mcList.length > 0 && (
                    <div>
                      <p className="px-3 pb-2 text-sm font-black text-[#334155]">
                        I.1. Trắc nghiệm nhiều phương án lựa chọn
                        <span className="ml-2 text-xs font-semibold text-[#94A3B8]">({mcList.length} câu)</span>
                      </p>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'mc')}>
                        <SortableContext items={mcList.map(q => q._id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {mcList.map(q => {
                              mcCounter++;
                              const num = mcCounter;
                              return (
                                <SortableQuestionCard key={q._id} id={q._id}>
                                  {(dragHandle) => (
                                    <div className="p-4 rounded-[20px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex justify-between items-start gap-3">
                                        <div className="flex gap-2 items-start flex-1 min-w-0">
                                          {dragHandle}
                                          <span className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{num}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[#082F49] text-sm leading-relaxed whitespace-pre-wrap">{q.content}</p>
                                            <MediaBadge q={q} />
                                          </div>
                                        </div>
                                        <ActionBtns q={q} />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 mt-3 ml-10">
                                        {q.options.map((opt, idx) => {
                                          const isCorrect = idx === q.correctOption;
                                          return (
                                            <div key={idx} className={`p-2.5 rounded-[14px] border text-sm font-semibold flex items-start gap-2
                                              ${isCorrect ? 'border-emerald-300 bg-emerald-50 text-[#082F49]' : 'border-slate-100 bg-white text-slate-500'}`}>
                                              <span className={`w-5 h-5 rounded-full flex justify-center items-center text-[10px] font-black shrink-0
                                                ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {['A','B','C','D'][idx]}
                                              </span>
                                              <span className="pt-0.5 text-xs">{opt}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </SortableQuestionCard>
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}

                  {/* 1.2 TF */}
                  {tfList.length > 0 && (
                    <div>
                      <p className="px-3 pb-2 text-sm font-black text-[#334155]">
                        I.2. Câu trắc nghiệm đúng sai
                        <span className="ml-2 text-xs font-semibold text-[#94A3B8]">({tfList.length} câu)</span>
                      </p>
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'tf')}>
                        <SortableContext items={tfList.map(q => q._id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {tfList.map(q => {
                              tfCounter++;
                              const num = tfCounter;
                              return (
                                <SortableQuestionCard key={q._id} id={q._id}>
                                  {(dragHandle) => (
                                    <div className="p-4 rounded-[20px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                      <div className="flex justify-between items-start gap-3">
                                        <div className="flex gap-2 items-start flex-1 min-w-0">
                                          {dragHandle}
                                          <span className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{num}</span>
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-[#082F49] text-sm leading-relaxed whitespace-pre-wrap">{q.content}</p>
                                            <MediaBadge q={q} />
                                          </div>
                                        </div>
                                        <ActionBtns q={q} />
                                      </div>
                                      <div className="mt-3 ml-10 space-y-2">
                                        {q.options.map((opt, idx) => {
                                          const isTrue = q.tfAnswers?.[idx] ?? false;
                                          return (
                                            <div key={idx} className="flex items-center gap-3 p-2.5 rounded-[14px] border border-slate-100 bg-white">
                                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black shrink-0">
                                                {['a','b','c','d'][idx]}
                                              </span>
                                              <span className="flex-1 text-sm font-semibold text-[#082F49]">{opt}</span>
                                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0
                                                ${isTrue ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-red-100 text-red-600 border-red-300'}`}>
                                                {isTrue ? 'Đúng' : 'Sai'}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </SortableQuestionCard>
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Phần II: Tự luận ── */}
            {essayList.length > 0 && (
              <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
                  <p className="font-black text-[#082F49] text-base">Phần II. Tự luận</p>
                  <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">{essayList.length} câu</p>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={e => handleDragEnd(e, 'essay')}>
                  <SortableContext items={essayList.map(q => q._id)} strategy={verticalListSortingStrategy}>
                    <div className="p-3 space-y-2">
                      {essayList.map(q => {
                        essayCounter++;
                        const num = essayCounter;
                        return (
                          <SortableQuestionCard key={q._id} id={q._id}>
                            {(dragHandle) => (
                              <div className="p-4 rounded-[20px] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex gap-2 items-start flex-1 min-w-0">
                                    {dragHandle}
                                    <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">{num}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-[#082F49] text-sm leading-relaxed whitespace-pre-wrap">Câu {num}: {q.content}</p>
                                      <MediaBadge q={q} />
                                      {q.essayAnswer && (
                                        <div className="mt-2 p-3 rounded-[14px] bg-amber-50 border border-amber-200">
                                          <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Đáp án mẫu</p>
                                          <p className="text-xs font-semibold text-[#334155] leading-relaxed whitespace-pre-wrap">{q.essayAnswer}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <ActionBtns q={q} />
                                </div>
                              </div>
                            )}
                          </SortableQuestionCard>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        );
      })()}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[#94A3B8] text-xs font-semibold">
            Trang {page}/{totalPages} · {filtered.length} câu hỏi
          </p>
          <Paginator page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {modalMode && <QuestionFormModal mode={modalMode} setId={set._id} initial={editTarget ?? undefined} onClose={() => { setModalMode(null); setEditTarget(null); }} onSaved={() => { setModalMode(null); setEditTarget(null); fetchQuestions(); }} />}
      {deleteTarget && <ConfirmDialog message="Xoá câu hỏi này?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}

// ── Types for results ──
interface QuizResultRow {
  _id: string;
  userId: string;
  username: string;
  mcCorrect: number;
  mcTotal: number;
  tfCorrect: number;
  tfTotal: number;
  essayAnswered: number;
  essayTotal: number;
  timeSpentSeconds: number;
  timeLimitSeconds: number;
  exitCount: number;
  submittedAt: string;
}

interface QuizResultDetail extends QuizResultRow {
  grade: number;
  quizTitle: string;
  quizType: string;
  mcAnswers: Record<string, number | null>;
  tfAnswers: Record<string, (boolean | null)[]>;
  essayAnswers: Record<string, string>;
  exitLog: { id: number; time: string; reason: 'tab' | 'app' }[];
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── QuizResultsView — list submissions for one quiz set ──
function QuizResultsView({ set, onBack, onViewDetail }: {
  set: QuizSetRow;
  onBack: () => void;
  onViewDetail: (r: QuizResultRow) => void;
}) {
  const [results, setResults] = useState<QuizResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quizzes/results?setId=${set._id}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally { setLoading(false); }
  }, [set._id]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/quizzes/results?resultId=${deleteTarget}`, { method: 'DELETE' });
    setResults(p => p.filter(r => r._id !== deleteTarget));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold text-sm transition-colors group">
          <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
            <FaArrowLeft className="text-xs" />
          </span>
          Danh sách đề
        </button>
        <span className="text-slate-300 font-bold">/</span>
        <div>
          <p className="font-black text-[#082F49] text-sm">{set.icon} {set.title}</p>
          <p className="text-[#94A3B8] text-xs font-semibold">📊 Bài làm của học sinh</p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[20px] p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-[#082F49]">{results.length}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Bài nộp</p>
        </div>
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[20px] p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-emerald-600">
            {results.length ? Math.round(results.reduce((s, r) => s + (r.mcTotal ? r.mcCorrect / r.mcTotal : 0), 0) / results.length * 100) : 0}%
          </p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">TB đúng MC</p>
        </div>
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[20px] p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-rose-500">
            {results.filter(r => r.exitCount > 0).length}
          </p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Vi phạm</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-violet-300 border-t-violet-500 animate-spin" />
            <p className="text-[#94A3B8] font-semibold text-sm">Đang tải...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <span className="text-5xl">📭</span>
            <p className="font-black text-[#082F49] text-base">Chưa có học sinh nào nộp bài</p>
            <p className="text-[#94A3B8] text-sm font-semibold">Khi học sinh làm xong, bài làm sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] items-center px-5 py-2.5 border-b border-slate-100 bg-slate-50/60">
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wide">Học sinh</span>
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wide text-center">MC đúng</span>
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wide text-center">Đ/S đúng</span>
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wide text-center">Tự luận</span>
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wide text-center">Thời gian</span>
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-wide text-center">Vi phạm</span>
            </div>
            <div className="divide-y divide-slate-100">
              {results.map(r => (
                <div key={r._id}
                  className="grid grid-cols-[1fr_80px_80px_80px_80px_80px] items-center px-5 py-3
                    hover:bg-cyan-50/40 transition-colors group">
                  {/* Student info */}
                  <button onClick={() => onViewDetail(r)} className="flex items-center gap-2.5 text-left min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                      {(r.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-[#082F49] text-sm truncate group-hover:text-violet-700 transition-colors">
                        {r.username || r.userId}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] font-semibold">
                        {new Date(r.submittedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>

                  {/* MC score */}
                  <div className="text-center">
                    <span className="font-black text-sm text-emerald-600">{r.mcCorrect}</span>
                    <span className="text-xs text-[#94A3B8] font-semibold">/{r.mcTotal}</span>
                  </div>

                  {/* TF score */}
                  <div className="text-center">
                    {r.tfTotal > 0 ? (
                      <><span className="font-black text-sm text-cyan-600">{r.tfCorrect}</span>
                      <span className="text-xs text-[#94A3B8] font-semibold">/{r.tfTotal}</span></>
                    ) : <span className="text-xs text-[#94A3B8]">—</span>}
                  </div>

                  {/* Essay */}
                  <div className="text-center">
                    {r.essayTotal > 0 ? (
                      <><span className="font-black text-sm text-amber-600">{r.essayAnswered}</span>
                      <span className="text-xs text-[#94A3B8] font-semibold">/{r.essayTotal}</span></>
                    ) : <span className="text-xs text-[#94A3B8]">—</span>}
                  </div>

                  {/* Time */}
                  <div className="text-center">
                    <span className="font-black text-sm text-slate-600">{fmtTime(r.timeSpentSeconds)}</span>
                    <span className="text-[10px] text-[#94A3B8] block">/{fmtTime(r.timeLimitSeconds)}</span>
                  </div>

                  {/* Exit violations */}
                  <div className="text-center flex items-center justify-center gap-1">
                    {r.exitCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-black text-xs">
                        🚨 {r.exitCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-xs">
                        ✅ 0
                      </span>
                    )}
                    <button
                      onClick={() => setDeleteTarget(r._id)}
                      className="ml-1 w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-300 transition-all opacity-0 group-hover:opacity-100">
                      <FaTrash className="text-[9px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message="Xoá bài làm này? Thao tác không thể hoàn tác."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

// ── QuizResultDetailView — full detail of one submission ──
function QuizResultDetailView({ resultId, quizSet, onBack }: {
  resultId: string;
  quizSet: QuizSetRow;
  onBack: () => void;
}) {
  const [result, setResult] = useState<QuizResultDetail | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [rRes, qRes] = await Promise.all([
          fetch(`/api/admin/quizzes/results?resultId=${resultId}`),
          fetch(`/api/admin/quizzes/questions?setId=${quizSet._id}`),
        ]);
        const rData = await rRes.json();
        const qData = await qRes.json();
        setResult(rData.result ?? null);
        setQuestions(qData.questions ?? []);
      } finally { setLoading(false); }
    })();
  }, [resultId, quizSet._id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-violet-300 border-t-violet-500 animate-spin" />
      <p className="text-[#94A3B8] font-semibold text-sm">Đang tải chi tiết...</p>
    </div>
  );

  if (!result) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <span className="text-5xl">😕</span>
      <p className="font-black text-[#082F49]">Không tìm thấy bài làm</p>
      <button onClick={onBack} className="px-4 py-2 rounded-full bg-slate-100 text-sm font-bold text-[#334155] hover:bg-slate-200 transition-all">← Quay lại</button>
    </div>
  );

  const mcList    = questions.filter(q => !q.questionType || q.questionType === 'mc');
  const tfList    = questions.filter(q => q.questionType === 'tf');
  const essayList = questions.filter(q => q.questionType === 'essay');

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={onBack}
          className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold text-sm transition-colors group">
          <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
            <FaArrowLeft className="text-xs" />
          </span>
          Bài làm
        </button>
        <span className="text-slate-300">/</span>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-black text-xs">
          {(result.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-black text-[#082F49] text-sm">{result.username || result.userId}</p>
          <p className="text-[#94A3B8] text-xs font-semibold">
            Nộp lúc {new Date(result.submittedAt).toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[20px] p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{result.mcCorrect}<span className="text-sm text-[#94A3B8] font-semibold">/{result.mcTotal}</span></p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">MC đúng</p>
        </div>
        {result.tfTotal > 0 && (
          <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[20px] p-4 text-center shadow-sm">
            <p className="text-2xl font-black text-cyan-600">{result.tfCorrect}<span className="text-sm text-[#94A3B8] font-semibold">/{result.tfTotal}</span></p>
            <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Đ/S đúng</p>
          </div>
        )}
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[20px] p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-slate-700">{fmtTime(result.timeSpentSeconds)}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Thời gian làm / {fmtTime(result.timeLimitSeconds)}</p>
        </div>
        <div className={`backdrop-blur-[24px] border rounded-[20px] p-4 text-center shadow-sm ${result.exitCount > 0 ? 'bg-red-50/80 border-red-200' : 'bg-white/65 border-white/80'}`}>
          <p className={`text-2xl font-black ${result.exitCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{result.exitCount}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-0.5">Lần thoát vi phạm</p>
        </div>
      </div>

      {/* Anti-cheat log */}
      {result.exitLog.length > 0 && (
        <div className="bg-red-50/70 backdrop-blur-[24px] border border-red-200 rounded-[24px] p-5 space-y-3">
          <p className="font-black text-red-700 text-sm flex items-center gap-2">🚨 Lịch sử vi phạm</p>
          <div className="space-y-2">
            {result.exitLog.map(e => (
              <div key={e.id} className="flex items-center gap-3 bg-white/70 rounded-[12px] px-4 py-2.5 border border-red-100">
                <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-black text-[10px] shrink-0">{e.id}</span>
                <span className="font-bold text-xs text-[#334155]">{e.time}</span>
                <span className="text-xs text-[#94A3B8] font-semibold">
                  {e.reason === 'tab' ? '📱 Chuyển tab / thu nhỏ trình duyệt' : '📱 Chuyển sang ứng dụng khác'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MC questions review */}
      {mcList.length > 0 && (
        <div className="space-y-3">
          <p className="font-black text-[#082F49] text-sm border-b-2 border-cyan-100 pb-2">Trắc nghiệm MC</p>
          {mcList.map((q, i) => {
            const selected = result.mcAnswers?.[q._id] ?? null;
            const correct  = q.correctOption ?? -1;
            const isRight  = selected === correct;
            return (
              <div key={q._id} className={`rounded-[16px] border p-4 ${isRight ? 'bg-emerald-50/60 border-emerald-200' : selected === null ? 'bg-slate-50 border-slate-200' : 'bg-red-50/60 border-red-200'}`}>
                <div className="flex gap-2 items-start mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isRight ? 'bg-emerald-400 text-white' : selected === null ? 'bg-slate-200 text-slate-500' : 'bg-red-400 text-white'}`}>{i + 1}</span>
                  <p className="text-sm font-semibold text-[#082F49] leading-snug">{q.content}</p>
                </div>
                <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {q.options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect  = idx === correct;
                    return (
                      <div key={idx} className={`flex items-start gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold border
                        ${isCorrect ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : isSelected && !isCorrect ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white border-slate-100 text-[#334155]'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${isCorrect ? 'bg-emerald-500 text-white' : isSelected && !isCorrect ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {['A','B','C','D'][idx]}
                        </span>
                        {opt}
                        {isCorrect && <span className="ml-auto text-emerald-600 shrink-0">✓</span>}
                        {isSelected && !isCorrect && <span className="ml-auto text-red-500 shrink-0">✗</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TF questions review */}
      {tfList.length > 0 && (
        <div className="space-y-3">
          <p className="font-black text-[#082F49] text-sm border-b-2 border-violet-100 pb-2">Đúng / Sai</p>
          {tfList.map((q, i) => {
            const studentAnswers = result.tfAnswers?.[q._id] ?? [];
            const correctAnswers = q.tfAnswers ?? [];
            const allRight = studentAnswers.length > 0 && studentAnswers.every((a, j) => a === correctAnswers[j]);
            return (
              <div key={q._id} className={`rounded-[16px] border p-4 ${allRight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="flex gap-2 items-start mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${allRight ? 'bg-emerald-400 text-white' : 'bg-violet-100 text-violet-700'}`}>{i + 1}</span>
                  <p className="text-sm font-semibold text-[#082F49] leading-snug">{q.content}</p>
                </div>
                <div className="ml-8 space-y-1.5">
                  {q.options.map((opt, j) => {
                    const studentAns = studentAnswers[j];
                    const correctAns = correctAnswers[j];
                    const match = studentAns === correctAns;
                    return (
                      <div key={j} className={`flex items-center gap-3 px-3 py-2 rounded-[10px] border text-xs font-semibold ${match ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-black shrink-0">{['a','b','c','d'][j]}</span>
                        <span className="flex-1 text-[#334155]">{opt}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${studentAns === true ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : studentAns === false ? 'bg-red-100 border-red-300 text-red-700' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                          {studentAns === true ? 'Đúng' : studentAns === false ? 'Sai' : '?'}
                        </span>
                        <span className="text-slate-400 text-[10px]">→</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${correctAns ? 'bg-emerald-200 border-emerald-400 text-emerald-800' : 'bg-red-200 border-red-400 text-red-800'}`}>
                          {correctAns ? 'Đúng ✓' : 'Sai ✓'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Essay review */}
      {essayList.length > 0 && (
        <div className="space-y-3">
          <p className="font-black text-[#082F49] text-sm border-b-2 border-amber-100 pb-2">Tự luận</p>
          {essayList.map((q, i) => {
            const text = result.essayAnswers?.[q._id] ?? '';
            return (
              <div key={q._id} className="rounded-[16px] border border-amber-200 bg-amber-50/40 p-4">
                <div className="flex gap-2 items-start mb-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                  <p className="text-sm font-semibold text-[#082F49] leading-snug">{q.content}</p>
                </div>
                <div className="ml-8">
                  {text ? (
                    <p className="bg-white rounded-[12px] border border-amber-200 px-4 py-3 text-sm text-[#334155] font-semibold whitespace-pre-wrap">{text}</p>
                  ) : (
                    <p className="text-xs text-[#94A3B8] italic font-semibold">(Học sinh chưa trả lời)</p>
                  )}
                  {q.essayAnswer && (
                    <div className="mt-2">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-wide mb-1">Gợi ý đáp án</p>
                      <p className="bg-amber-100/80 rounded-[12px] border border-amber-200 px-4 py-3 text-sm text-amber-900 font-semibold whitespace-pre-wrap">{q.essayAnswer}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Orchestrator ──

export default function QuizManager() {
  const [view, setView] = useState<'sets' | 'questions' | 'results' | 'result-detail'>('sets');
  const [selectedSet, setSelectedSet] = useState<QuizSetRow | null>(null);
  const [selectedResult, setSelectedResult] = useState<QuizResultRow | null>(null);

  return (
    <div className="w-full">
      {view === 'sets' && (
        <QuizSetsView
          onSelect={s => { setSelectedSet(s); setView('questions'); }}
          onViewResults={s => { setSelectedSet(s); setView('results'); }}
        />
      )}
      {view === 'questions' && selectedSet && (
        <QuestionsView set={selectedSet} onBack={() => { setView('sets'); setSelectedSet(null); }} />
      )}
      {view === 'results' && selectedSet && (
        <QuizResultsView
          set={selectedSet}
          onBack={() => { setView('sets'); setSelectedSet(null); }}
          onViewDetail={r => { setSelectedResult(r); setView('result-detail'); }}
        />
      )}
      {view === 'result-detail' && selectedSet && selectedResult && (
        <QuizResultDetailView
          resultId={selectedResult._id}
          quizSet={selectedSet}
          onBack={() => { setView('results'); setSelectedResult(null); }}
        />
      )}
    </div>
  );
}
