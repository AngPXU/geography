'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import PdfReader để tránh lỗi SSR
const PdfReader = dynamic(() => import('@/components/ui/PdfReader'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Đang khởi tạo trình đọc...</p>
      </div>
    </div>
  ),
});

interface BookMeta {
  _id: string;
  grade: number;
  title: string;
  subtitle: string;
  publisher: string;
  pdfFilename: string;
  coverColor: string;
  uploadedAt: string;
}

const GRADE_INFO: Record<number, { emoji: string; label: string; gradient: string }> = {
  6: { emoji: '🌏', label: 'Lớp 6', gradient: 'from-cyan-400 to-blue-500' },
  7: { emoji: '🌍', label: 'Lớp 7', gradient: 'from-green-400 to-emerald-500' },
  8: { emoji: '🌐', label: 'Lớp 8', gradient: 'from-amber-400 to-orange-500' },
  9: { emoji: '🇻🇳', label: 'Lớp 9', gradient: 'from-pink-400 to-rose-500' },
};

/* ─ Upload Modal ─────────────────────────────────────────────── */
function UploadModal({ grade, onClose, onSuccess }: { grade: number; onClose: () => void; onSuccess: () => void }) {
  const [file, setFile]       = useState<File | null>(null);
  const [title, setTitle]     = useState(`Địa Lý ${grade}`);
  const [subtitle, setSubtitle] = useState('');
  const [publisher, setPublisher] = useState('Kết nối tri thức với cuộc sống');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Vui lòng chọn file PDF'); return; }
    setLoading(true); setError('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('grade', String(grade));
    fd.append('title', title);
    fd.append('subtitle', subtitle);
    fd.append('publisher', publisher);
    const res = await fetch('/api/books/upload', { method: 'POST', body: fd });
    if (res.ok) { onSuccess(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? 'Upload thất bại'); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden">
        <div className={`bg-gradient-to-r ${GRADE_INFO[grade].gradient} p-6 flex items-center gap-4`}>
          <span className="text-4xl">{GRADE_INFO[grade].emoji}</span>
          <div>
            <h3 className="text-white font-black text-xl">Upload Sách {GRADE_INFO[grade].label}</h3>
            <p className="text-white/80 text-sm mt-0.5">Chọn file PDF sách địa lý</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-black text-[#082F49] uppercase tracking-wider mb-2 block">Tiêu đề sách *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200 text-[#082F49] font-bold text-sm outline-none focus:border-cyan-400 transition" />
          </div>
          <div>
            <label className="text-xs font-black text-[#082F49] uppercase tracking-wider mb-2 block">Phụ đề</label>
            <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="VD: Lịch sử và Địa lý"
              className="w-full px-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200 text-[#082F49] font-medium text-sm outline-none focus:border-cyan-400 transition" />
          </div>
          <div>
            <label className="text-xs font-black text-[#082F49] uppercase tracking-wider mb-2 block">Nhà xuất bản</label>
            <input value={publisher} onChange={e => setPublisher(e.target.value)}
              className="w-full px-4 py-3 rounded-[14px] bg-slate-50 border border-slate-200 text-[#082F49] font-medium text-sm outline-none focus:border-cyan-400 transition" />
          </div>
          <div>
            <label className="text-xs font-black text-[#082F49] uppercase tracking-wider mb-2 block">File PDF *</label>
            <label className="cursor-pointer block">
              <input type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <div className={`border-2 border-dashed rounded-[16px] p-6 text-center transition-all ${file ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-cyan-400'}`}>
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">✅</span>
                    <p className="font-bold text-green-600 text-sm">{file.name}</p>
                    <p className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📄</span>
                    <p className="font-bold text-slate-500 text-sm">Nhấn để chọn file PDF</p>
                    <p className="text-slate-400 text-xs">Chấp nhận file .pdf</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {error && <p className="text-red-500 text-sm font-medium bg-red-50 px-4 py-3 rounded-[12px]">⚠️ {error}</p>}

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-[14px] bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition">Hủy</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-[14px] text-white font-bold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${GRADE_INFO[grade].gradient.includes('cyan') ? '#06B6D4' : GRADE_INFO[grade].gradient.includes('green') ? '#22C55E' : GRADE_INFO[grade].gradient.includes('amber') ? '#F59E0B' : '#EC4899'}, ${GRADE_INFO[grade].gradient.includes('blue') ? '#3B82F6' : GRADE_INFO[grade].gradient.includes('emerald') ? '#10B981' : GRADE_INFO[grade].gradient.includes('orange') ? '#F97316' : '#F43F5E'})` }}>
              {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tải...</> : <>📤 Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─ Grade Sidebar Item ───────────────────────────────────────── */
function GradeSidebarItem({ grade, active, book, onClick }: { grade: number; active: boolean; book: BookMeta | undefined; onClick: () => void }) {
  const info = GRADE_INFO[grade];
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-[16px] transition-all text-left group ${active ? 'bg-white shadow-md' : 'hover:bg-white/60'}`}>
      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center text-xl bg-gradient-to-br ${info.gradient} flex-shrink-0`}>
        {info.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-black text-sm ${active ? 'text-[#082F49]' : 'text-slate-500'}`}>{info.label}</p>
        {book ? (
          <p className="text-[10px] text-slate-400 font-medium truncate">{book.title}</p>
        ) : (
          <p className="text-[10px] text-slate-300 font-medium italic">Chưa có sách</p>
        )}
      </div>
      {book && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: book.coverColor }} />}
    </button>
  );
}

/* ─ Main Reader Client ───────────────────────────────────────── */
export default function BookReaderClient({ isAdmin }: { isAdmin?: boolean }) {
  const [books, setBooks]           = useState<BookMeta[]>([]);
  const [activeGrade, setActiveGrade] = useState<number>(6);
  const [uploadGrade, setUploadGrade] = useState<number | null>(null);
  const [loading, setLoading]       = useState(true);

  const fetchBooks = async () => {
    setLoading(true);
    const res = await fetch('/api/books');
    if (res.ok) { const d = await res.json(); setBooks(d.books); }
    setLoading(false);
  };

  useEffect(() => { fetchBooks(); }, []);

  const activeBook = books.find(b => b.grade === activeGrade);

  return (
    <div style={{
      position: 'fixed',
      top: '78px',   /* khớp với chiều cao thanh navbar */
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      overflow: 'hidden',
      zIndex: 10,
    }}>

      {/* ── Sidebar ── */}
      <div className="w-60 flex-shrink-0 flex flex-col gap-1 p-3 overflow-y-auto"
        style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.8)' }}>

        <div className="px-2 pb-3 pt-1">
          <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest">📚 Thư viện sách</p>
        </div>

        {[6, 7, 8, 9].map(g => (
          <GradeSidebarItem key={g} grade={g} active={activeGrade === g}
            book={books.find(b => b.grade === g)}
            onClick={() => setActiveGrade(g)} />
        ))}

        {/* Admin Upload buttons */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t border-white/60 flex flex-col gap-1.5">
            <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest px-2 mb-1">⚙️ Quản lý</p>
            {[6, 7, 8, 9].map(g => {
              const has = books.some(b => b.grade === g);
              return (
                <button key={g} onClick={() => setUploadGrade(g)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[12px] text-xs font-bold transition-all hover:bg-white/70"
                  style={{ color: has ? '#22C55E' : '#94A3B8' }}>
                  {has ? '🔄' : '📤'} {has ? 'Cập nhật' : 'Upload'} Lớp {g}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeBook ? (
          <PdfReader
            pdfUrl={`/books/${activeBook.pdfFilename}`}
            bookTitle={activeBook.title}
            coverColor={activeBook.coverColor}
          />
        ) : (
          /* No book state */
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
            <div className={`w-32 h-32 rounded-[32px] bg-gradient-to-br ${GRADE_INFO[activeGrade].gradient} flex items-center justify-center text-6xl shadow-lg`}>
              {GRADE_INFO[activeGrade].emoji}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-[#082F49]">Chưa có sách {GRADE_INFO[activeGrade].label}</h2>
              <p className="text-slate-500 text-sm mt-2 max-w-sm">
                {isAdmin
                  ? 'Nhấn vào "Upload" ở thanh bên trái để thêm file PDF sách địa lý.'
                  : 'Giáo viên hoặc quản trị viên chưa upload sách cho lớp này.'}
              </p>
            </div>
            {isAdmin && (
              <button onClick={() => setUploadGrade(activeGrade)}
                className="h-12 px-8 rounded-full text-white font-bold flex items-center gap-2 transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${GRADE_INFO[activeGrade].gradient.split(' ').find(v => v.startsWith('from-'))?.replace('from-', '')?.replace(/\[|\]/g, '') ?? '#06B6D4'}, transparent)` }}>
                📤 Upload ngay
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadGrade && (
        <UploadModal
          grade={uploadGrade}
          onClose={() => setUploadGrade(null)}
          onSuccess={() => { fetchBooks(); setActiveGrade(uploadGrade); }}
        />
      )}
    </div>
  );
}
