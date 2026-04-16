'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';

/* ── Dynamic PDF Reader ─── */
const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center gap-3 flex-col">
      <div className="w-10 h-10 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
      <p className="text-[#334155] text-sm font-bold">Khởi tạo trình đọc...</p>
    </div>
  ),
});

/* ── Types ─── */
interface BookMeta { _id: string; grade: number; title: string; publisher: string; pdfFilename: string; coverColor: string; startPage?: number; uploadedAt: string; }

const GRADES = [
  { grade: 6, label: 'Lớp 6', emoji: '🌏', color: '#06B6D4', gFrom: '#22D3EE', gTo: '#3B82F6', bg: 'rgba(224,242,254,0.6)', desc: 'Trái Đất — Ngôi nhà của chúng ta' },
  { grade: 7, label: 'Lớp 7', emoji: '🌍', color: '#22C55E', gFrom: '#4ADE80', gTo: '#10B981', bg: 'rgba(220,252,231,0.6)', desc: 'Địa lý các châu lục & đại dương' },
  { grade: 8, label: 'Lớp 8', emoji: '🌐', color: '#F59E0B', gFrom: '#FCD34D', gTo: '#F97316', bg: 'rgba(254,243,199,0.6)', desc: 'Địa lý tự nhiên Việt Nam' },
  { grade: 9, label: 'Lớp 9', emoji: '🇻🇳', color: '#EC4899', gFrom: '#F472B6', gTo: '#F43F5E', bg: 'rgba(252,231,243,0.6)', desc: 'Địa lý kinh tế – xã hội Việt Nam' },
];

/* ── Upload Modal ─── */
function UploadModal({ g, onClose, onDone }: { g: typeof GRADES[number]; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(`Địa Lý ${g.grade}`);
  const [pub, setPub] = useState('Kết nối tri thức với cuộc sống');
  const [startPage, setStartPage] = useState('1');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setErr('Vui lòng chọn file PDF'); return; }
    setBusy(true); setErr('');
    const fd = new FormData();
    fd.append('file', file); fd.append('grade', String(g.grade));
    fd.append('title', title); fd.append('publisher', pub);
    fd.append('startPage', startPage);
    const res = await fetch('/api/books/upload', { method: 'POST', body: fd });
    if (res.ok) { onDone(); }
    else { const d = await res.json(); setErr(d.error ?? 'Upload thất bại'); setBusy(false); }
  };

  const inputCls = 'w-full px-4 py-3 rounded-2xl text-[#082F49] font-semibold text-sm outline-none transition-all focus:ring-2 focus:ring-cyan-400/40';
  const inputStyle = { background: 'rgba(248,250,252,0.9)', border: '1.5px solid rgba(226,232,240,0.8)' };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,28,52,0.5)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-[440px] rounded-[28px] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.97)', border: '1.5px solid white', boxShadow: '0 32px 80px rgba(8,28,52,0.22)' }}>
        <div className="p-6 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${g.gFrom}, ${g.gTo})` }}>
          <div className="w-14 h-14 rounded-[20px] bg-white/20 flex items-center justify-center text-3xl">{g.emoji}</div>
          <div>
            <p className="text-white font-black text-xl">Upload Sách {g.label}</p>
            <p className="text-white/75 text-sm mt-0.5">{g.desc}</p>
          </div>
        </div>
        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-black text-[#082F49] uppercase tracking-widest mb-1.5">Tiêu đề sách *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-black text-[#082F49] uppercase tracking-widest mb-1.5">Nhà xuất bản</label>
            <input value={pub} onChange={e => setPub(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-[11px] font-black text-[#082F49] uppercase tracking-widest mb-1.5">Trang bắt đầu mặc định</label>
            <input type="number" min="1" value={startPage} onChange={e => setStartPage(e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            <div className={`rounded-[18px] p-5 text-center border-2 border-dashed transition-all
              ${file ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-slate-50/80 hover:border-cyan-400 hover:bg-cyan-50/50'}`}>
              {file ? (
                <><p className="text-xl mb-1">✅</p>
                  <p className="font-bold text-green-700 text-sm">{file.name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p></>
              ) : (
                <><p className="text-2xl mb-1">📄</p>
                  <p className="font-semibold text-slate-400 text-sm">Nhấn để chọn file PDF</p></>
              )}
            </div>
          </label>
          {err && <p className="text-rose-600 text-sm font-bold bg-rose-50 px-4 py-3 rounded-2xl">⚠️ {err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-[#334155] font-bold text-sm hover:bg-slate-200 transition-all">Hủy</button>
            <button type="submit" disabled={busy}
              className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              style={{ background: `linear-gradient(135deg, ${g.gFrom}, ${g.gTo})`, boxShadow: `0 8px 20px ${g.color}40` }}>
              {busy ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tải...</> : '📤 Upload ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Book Cover Simulation ─── */
function BookCover({ book, g, page, numPages }: { book: BookMeta; g: typeof GRADES[number]; page: number; numPages: number }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Cover */}
      <div className="relative w-full aspect-[3/4] max-w-[180px] mx-auto rounded-[20px] overflow-hidden cursor-pointer select-none"
        style={{ boxShadow: `8px 12px 40px ${g.color}40, inset -3px 0 8px rgba(0,0,0,0.08)`, border: `3px solid ${g.color}` }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${g.gFrom}, ${g.gTo})` }} />
        <div className="absolute inset-0 flex flex-col items-center justify-between p-5 text-white">
          <div className="w-full"><div className="w-8 h-1 rounded-full bg-white/50 mb-2"/><p className="text-[10px] font-black uppercase tracking-widest opacity-70">Sách Giáo Khoa</p></div>
          <p className="text-5xl drop-shadow-lg">{g.emoji}</p>
          <div className="w-full">
            <p className="font-black text-xl leading-tight drop-shadow">{book.title}</p>
            <div className="mt-3 h-px bg-white/30"/>
            <p className="text-[10px] mt-2 opacity-60 font-semibold">{book.publisher}</p>
          </div>
        </div>
      </div>

      {/* Info chips */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Trang hiện tại', val: page || '—', icon: '📖' },
          { label: 'Tổng số trang', val: numPages || '—', icon: '📄' },
        ].map(({ label, val, icon }) => (
          <div key={label} className="rounded-[16px] p-3 flex flex-col gap-1"
            style={{ background: g.bg, border: '1px solid rgba(255,255,255,0.8)' }}>
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: g.color }}>{icon} {label}</p>
            <p className="text-lg font-black text-[#082F49]">{val}</p>
          </div>
        ))}
      </div>

      {/* Reading progress */}
      {numPages > 0 && (
        <div className="rounded-[16px] p-4" style={{ background: g.bg, border: '1px solid rgba(255,255,255,0.8)' }}>
          <div className="flex justify-between mb-2">
            <p className="text-[11px] font-black text-[#082F49] uppercase tracking-wider">Tiến độ đọc</p>
            <p className="text-[11px] font-bold" style={{ color: g.color }}>{Math.round((page / numPages) * 100)}%</p>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(page / numPages) * 100}%`, background: `linear-gradient(to right, ${g.gFrom}, ${g.gTo})` }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ─── */
export default function BooksPage({ isAdmin }: { isAdmin?: boolean }) {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [activeGrade, setGrade] = useState(6);
  const [uploadFor, setUploadFor] = useState<typeof GRADES[number] | null>(null);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  const loadBooks = useCallback(async () => {
    const res = await fetch('/api/books');
    if (res.ok) { const d = await res.json(); setBooks(d.books); }
    setReady(true);
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const g = GRADES.find(x => x.grade === activeGrade)!;
  const book = books.find(b => b.grade === activeGrade);

  return (
    <main className="pt-28 pb-16 px-4 md:px-8" style={{ maxWidth: '90%', margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 20px rgba(14,165,233,0.08)' }}>
          <span className="text-base">📚</span>
          <span className="text-xs font-black text-[#082F49] uppercase tracking-widest">Thư Viện Địa Lý</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#082F49] leading-tight">Sách Giáo Khoa</h1>
        <p className="text-[#334155] mt-2 text-base">Địa lý <span className="font-black" style={{ color: g.color }}>Lớp {activeGrade}</span> — Đọc trực tuyến, tương tác trực tiếp.</p>
      </div>

      {/* ── Grade Tabs ── */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        {GRADES.map(gr => {
          const b = books.find(x => x.grade === gr.grade);
          return (
            <button key={gr.grade} onClick={() => { setGrade(gr.grade); setPage(b?.startPage || 1); setNumPages(0); }}
            className="flex items-center gap-2.5 px-5 py-3 rounded-[18px] font-bold text-sm transition-all duration-300 border-2"
            style={activeGrade === gr.grade ? {
              background: `linear-gradient(135deg, ${gr.gFrom}22, ${gr.gTo}11)`,
              borderColor: gr.color, color: gr.color,
              boxShadow: `0 4px 20px ${gr.color}25`,
              transform: 'translateY(-1px)',
            } : {
              background: 'rgba(255,255,255,0.65)', borderColor: 'rgba(255,255,255,0.9)',
              color: '#94A3B8', backdropFilter: 'blur(12px)',
            }}>
            <span className="text-lg">{gr.emoji}</span>
            {gr.label}
          </button>
          );
        })}
      </div>

      {/* ── Main Content ── */}
      {!ready ? (
        <div className="flex justify-center py-24">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
        </div>
      ) : book ? (
        /* ── Reader Layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">

          {/* Left: Book info */}
          <div className="rounded-[28px] p-6"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)', position: 'sticky', top: 100 }}>
            <BookCover book={book} g={g} page={page} numPages={numPages} />
            {isAdmin && (
              <button onClick={() => setUploadFor(g)}
                className="mt-4 w-full py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-80"
                style={{ background: `${g.color}18`, color: g.color, border: `1.5px solid ${g.color}40` }}>
                🔄 Cập nhật PDF
              </button>
            )}
          </div>

          {/* Right: PDF Reader */}
          <div className="rounded-[28px] overflow-hidden flex flex-col"
            style={{
              background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
              height: 'calc(100vh - 210px)',
              minHeight: 520,
            }}>
            <PdfViewer
              key={`${book._id}-${book.startPage}-${book.uploadedAt}`}
              pdfUrl={`/books/${book.pdfFilename}?t=${new Date(book.uploadedAt).getTime()}`}
              title={book.title}
              color={book.coverColor}
              grade={activeGrade}
              startPage={book.startPage || 1}
              onPageChange={setPage}
              onLoad={setNumPages}
            />
          </div>
        </div>
      ) : (
        /* ── No Book ── */
        <div className="rounded-[32px] p-16 flex flex-col items-center gap-6 text-center"
          style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}>
          <div className="w-28 h-28 rounded-[32px] flex items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, ${g.gFrom}, ${g.gTo})`, boxShadow: `0 16px 40px ${g.color}35` }}>
            {g.emoji}
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#082F49]">Chưa có sách {g.label}</h2>
            <p className="text-[#94A3B8] text-sm mt-2 max-w-xs">
              {isAdmin ? 'Upload file PDF sách địa lý để học sinh đọc trực tuyến.' : 'Giáo viên chưa upload sách cho lớp này.'}
            </p>
          </div>
          {isAdmin && (
            <button onClick={() => setUploadFor(g)}
              className="h-12 px-8 rounded-[9999px] text-white font-black text-sm flex items-center gap-2 transition-all hover:-translate-y-1 duration-300"
              style={{ background: `linear-gradient(135deg, ${g.gFrom}, ${g.gTo})`, boxShadow: `0 8px 24px ${g.color}40` }}>
              📤 Upload sách ngay
            </button>
          )}
        </div>
      )}

      {uploadFor && (
        <UploadModal g={uploadFor} onClose={() => setUploadFor(null)} onDone={() => { loadBooks(); setUploadFor(null); }} />
      )}
    </main>
  );
}
