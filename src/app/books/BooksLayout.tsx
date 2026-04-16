'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

/* ─── Dynamic Import (tránh SSR lỗi) ───────────────────────── */
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
      <p className="text-[#334155] font-bold text-sm">Khởi tạo trình đọc PDF...</p>
    </div>
  ),
});

/* ─── Types ─────────────────────────────────────────────────── */
interface BookMeta {
  _id: string;
  grade: number;
  title: string;
  subtitle: string;
  publisher: string;
  pdfFilename: string;
  coverColor: string;
}

const GRADES = [
  { grade: 6, emoji: '🌏', gradient: 'from-cyan-400 to-blue-500', color: '#06B6D4' },
  { grade: 7, emoji: '🌍', gradient: 'from-green-400 to-emerald-500', color: '#22C55E' },
  { grade: 8, emoji: '🌐', gradient: 'from-amber-400 to-orange-500', color: '#F59E0B' },
  { grade: 9, emoji: '🇻🇳', gradient: 'from-pink-400 to-rose-500', color: '#EC4899' },
];

/* ─── Upload Modal ──────────────────────────────────────────── */
function UploadModal({ grade, color, gradient, onClose, onDone }: {
  grade: number; color: string; gradient: string;
  onClose: () => void; onDone: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(`Địa Lý ${grade}`);
  const [publisher, setPub] = useState('Kết nối tri thức với cuộc sống');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setErr('Vui lòng chọn file PDF'); return; }
    setBusy(true); setErr('');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('grade', String(grade));
    fd.append('title', title);
    fd.append('publisher', publisher);
    const res = await fetch('/api/books/upload', { method: 'POST', body: fd });
    if (res.ok) { onDone(); onClose(); }
    else { const d = await res.json(); setErr(d.error ?? 'Upload thất bại'); }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,28,52,0.45)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-[28px] overflow-hidden shadow-[0_24px_64px_rgba(8,28,52,0.25)]"
        style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,1)' }}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${gradient} p-6 flex items-center gap-4`}>
          <div className="w-14 h-14 rounded-[20px] bg-white/20 flex items-center justify-center text-4xl">📤</div>
          <div>
            <h3 className="text-white font-black text-xl leading-tight">Upload Sách Lớp {grade}</h3>
            <p className="text-white/75 text-sm mt-0.5">Chọn file PDF sách địa lý</p>
          </div>
        </div>

        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-black text-[#082F49] uppercase tracking-[0.15em] mb-1.5 block">Tiêu đề sách *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full px-4 py-3 rounded-[14px] text-[#082F49] font-bold text-sm outline-none transition-all"
              style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)' }} />
          </div>
          <div>
            <label className="text-[10px] font-black text-[#082F49] uppercase tracking-[0.15em] mb-1.5 block">Nhà xuất bản</label>
            <input value={publisher} onChange={e => setPub(e.target.value)}
              className="w-full px-4 py-3 rounded-[14px] text-[#082F49] font-medium text-sm outline-none transition-all"
              style={{ background: 'rgba(248,250,252,0.8)', border: '1px solid rgba(226,232,240,0.8)' }} />
          </div>
          <div>
            <label className="text-[10px] font-black text-[#082F49] uppercase tracking-[0.15em] mb-1.5 block">File PDF *</label>
            <label className="cursor-pointer block">
              <input type="file" accept="application/pdf" className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <div className={`rounded-[16px] p-5 text-center transition-all border-2 border-dashed
                ${file ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/50'}`}>
                {file ? (
                  <><p className="text-2xl mb-1">✅</p>
                    <p className="font-bold text-green-600 text-sm">{file.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p></>
                ) : (
                  <><p className="text-2xl mb-1">📄</p>
                    <p className="font-bold text-slate-400 text-sm">Nhấn để chọn file PDF</p></>
                )}
              </div>
            </label>
          </div>

          {err && <p className="text-sm font-bold text-rose-600 bg-rose-50 px-4 py-3 rounded-[12px]">⚠️ {err}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-[14px] bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all">Hủy</button>
            <button type="submit" disabled={busy}
              className="flex-1 py-3 rounded-[14px] text-white font-bold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 8px 20px ${color}40` }}>
              {busy ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tải...</> : '📤 Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────── */
function EmptyState({ grade, emoji, gradient, color, isAdmin, onUpload }: {
  grade: number; emoji: string; gradient: string; color: string;
  isAdmin?: boolean; onUpload: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <div className={`w-28 h-28 rounded-[32px] bg-gradient-to-br ${gradient} flex items-center justify-center text-6xl shadow-[0_16px_40px_rgba(0,0,0,0.15)]`}>
        {emoji}
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-black text-[#082F49]">Chưa có sách Lớp {grade}</h2>
        <p className="text-[#94A3B8] text-sm mt-2 max-w-xs leading-relaxed">
          {isAdmin ? 'Upload file PDF để học sinh có thể đọc sách trực tuyến.' : 'Giáo viên chưa upload sách cho lớp này.'}
        </p>
      </div>
      {isAdmin && (
        <button onClick={onUpload}
          className="h-12 px-8 rounded-[9999px] text-white font-bold text-sm flex items-center gap-2 transition-all hover:-translate-y-1 duration-300"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 8px 24px ${color}40` }}>
          📤 Upload sách ngay
        </button>
      )}
    </div>
  );
}

/* ─── Main Layout ───────────────────────────────────────────── */
export default function BooksLayout({ isAdmin }: { isAdmin?: boolean }) {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [activeGrade, setGrade] = useState(6);
  const [uploadGrade, setUploadGrade] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);

  const loadBooks = useCallback(async () => {
    const res = await fetch('/api/books');
    if (res.ok) { const d = await res.json(); setBooks(d.books); }
    setFetched(true);
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const activeBook = books.find(b => b.grade === activeGrade);
  const activeGradeInfo = GRADES.find(g => g.grade === activeGrade)!;

  return (
    <>
      {/* ── Toàn bộ layout nằm trong CSS Grid cố định dưới navbar ── */}
      <div style={{
        position: 'fixed',
        top: 78,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: '248px 1fr',
        overflow: 'hidden',
      }}>

        {/* ══ SIDEBAR ══════════════════════════════════════════════ */}
        <aside style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '4px 0 20px rgba(14,165,233,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          padding: '20px 12px',
          gap: 4,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.15em',
            textTransform: 'uppercase', padding: '0 8px 12px'
          }}>📚 Thư Viện Sách</p>

          {GRADES.map(({ grade, emoji, gradient, color }) => {
            const book = books.find(b => b.grade === grade);
            const active = activeGrade === grade;
            return (
              <button key={grade} onClick={() => setGrade(grade)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 18,
                  background: active ? 'rgba(255,255,255,0.95)' : 'transparent',
                  boxShadow: active ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.25s ease',
                }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 14, flexShrink: 0,
                  background: `linear-gradient(135deg, ${color}, ${color}99)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, boxShadow: `0 4px 12px ${color}35`,
                }}>
                  {emoji}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontWeight: 900, fontSize: 14, color: active ? '#082F49' : '#64748B',
                    lineHeight: 1.2, marginBottom: 2
                  }}>Lớp {grade}</p>
                  <p style={{
                    fontSize: 11, color: book ? '#94A3B8' : '#CBD5E1',
                    fontStyle: book ? 'normal' : 'italic',
                    fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
                  }}>
                    {book ? book.title : 'Chưa có sách'}
                  </p>
                </div>
                {book && <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  background: color, marginLeft: 'auto'
                }} />}
              </button>
            );
          })}

          {/* Admin section */}
          {isAdmin && (
            <div style={{
              marginTop: 16, paddingTop: 16,
              borderTop: '1px solid rgba(148,163,184,0.15)'
            }}>
              <p style={{
                fontSize: 10, fontWeight: 900, color: '#94A3B8', letterSpacing: '0.15em',
                textTransform: 'uppercase', padding: '0 8px 8px'
              }}>⚙️ Quản lý</p>
              {GRADES.map(({ grade, color }) => {
                const has = books.some(b => b.grade === grade);
                return (
                  <button key={grade} onClick={() => setUploadGrade(grade)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 12px', borderRadius: 12,
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 700, color: has ? '#22C55E' : '#94A3B8',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {has ? '🔄' : '📤'} {has ? 'Cập nhật' : 'Upload'} Lớp {grade}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* ══ MAIN ═════════════════════════════════════════════════ */}
        <main style={{
          display: 'flex', flexDirection: 'column',
          background: 'rgba(241,245,249,0.7)',
          overflow: 'hidden',
        }}>
          {!fetched ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '4px solid #06B6D4', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite'
              }} />
            </div>
          ) : activeBook ? (
            <PdfViewer
              pdfUrl={`/books/${activeBook.pdfFilename}`}
              title={activeBook.title}
              color={activeBook.coverColor}
            />
          ) : (
            <EmptyState
              grade={activeGrade}
              emoji={activeGradeInfo.emoji}
              gradient={activeGradeInfo.gradient}
              color={activeGradeInfo.color}
              isAdmin={isAdmin}
              onUpload={() => setUploadGrade(activeGrade)}
            />
          )}
        </main>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Upload Modal */}
      {uploadGrade && (
        <UploadModal
          grade={uploadGrade}
          color={GRADES.find(g => g.grade === uploadGrade)!.color}
          gradient={GRADES.find(g => g.grade === uploadGrade)!.gradient}
          onClose={() => setUploadGrade(null)}
          onDone={() => { loadBooks(); setGrade(uploadGrade); setUploadGrade(null); }}
        />
      )}
    </>
  );
}
