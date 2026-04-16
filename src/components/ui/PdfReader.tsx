'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Dùng unpkg với đúng version pdfjs-dist đang cài
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  pdfUrl: string;
  bookTitle: string;
  coverColor: string;
}

export default function PdfReader({ pdfUrl, bookTitle, coverColor }: Props) {
  const [numPages, setNumPages]     = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale]           = useState<number>(1.2);
  const [inputPage, setInputPage]   = useState<string>('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError]   = useState<string>('');

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoadError('');
    setInputPage('1');
  };

  const onLoadError = (err: Error) => {
    console.error('[PdfReader] Load error:', err);
    setLoadError(err.message);
  };

  const goTo = useCallback((p: number) => {
    const clamped = Math.min(Math.max(1, p), numPages || 1);
    setPageNumber(clamped);
    setInputPage(String(clamped));
  }, [numPages]);

  const zoomIn  = () => setScale(s => Math.min(+(s + 0.15).toFixed(2), 3));
  const zoomOut = () => setScale(s => Math.max(+(s - 0.15).toFixed(2), 0.4));

  return (
    <div className={`flex flex-col min-h-0 ${isFullscreen ? 'fixed inset-0 z-[9999]' : 'flex-1'}`}
      style={{ background: isFullscreen ? '#0f172a' : undefined }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 flex-wrap"
        style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>

        {/* Title */}
        <div className="flex items-center gap-2 mr-3">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: coverColor }} />
          <span className="font-black text-[#082F49] text-sm truncate max-w-[220px]">{bookTitle}</span>
        </div>

        <div className="flex-1" />

        {/* Page navigation */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-[12px] px-2 py-1.5 shadow-sm">
          <button onClick={() => goTo(pageNumber - 1)} disabled={pageNumber <= 1}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition font-bold text-lg leading-none">‹</button>
          <input
            type="number" value={inputPage} min={1} max={numPages || 1}
            onChange={e => setInputPage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && goTo(parseInt(inputPage) || 1)}
            onBlur={() => goTo(parseInt(inputPage) || 1)}
            className="w-10 text-center text-sm font-bold text-[#082F49] bg-transparent border-0 outline-none"
          />
          <span className="text-slate-400 text-sm font-medium">/ {numPages}</span>
          <button onClick={() => goTo(pageNumber + 1)} disabled={pageNumber >= numPages}
            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition font-bold text-lg leading-none">›</button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-[12px] px-2 py-1.5 shadow-sm">
          <button onClick={zoomOut} className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-xl leading-none">−</button>
          <span className="text-sm font-bold text-[#082F49] w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="w-7 h-7 rounded-[8px] flex items-center justify-center text-slate-600 hover:bg-slate-100 transition font-bold text-lg leading-none">+</button>
        </div>

        {/* Fullscreen */}
        <button onClick={() => setIsFullscreen(f => !f)}
          className="w-9 h-9 rounded-[12px] flex items-center justify-center text-slate-500 hover:bg-slate-100 border border-slate-200 bg-white transition text-sm shadow-sm"
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
          {isFullscreen ? '⊡' : '⛶'}
        </button>
      </div>

      {/* ── PDF Canvas ── */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-6 px-4"
        style={{ background: isFullscreen ? '#1e293b' : 'rgba(241,245,249,0.7)' }}>

        <Document
          file={pdfUrl}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={
            <div className="flex flex-col items-center justify-center h-80 gap-3">
              <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: `${coverColor}40`, borderTopColor: 'transparent' }} />
              <p className="text-slate-500 text-sm font-medium">Đang tải tài liệu...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-80 gap-3 text-center p-8">
              <span className="text-5xl">📄</span>
              <p className="text-[#082F49] font-bold text-lg">Không thể tải PDF</p>
              <p className="text-slate-400 text-sm font-medium">{loadError || 'Kiểm tra lại file đã upload.'}</p>
              <a href={pdfUrl} target="_blank" rel="noreferrer"
                className="text-sm font-bold underline text-cyan-600 hover:text-cyan-800 transition mt-1">
                Thử mở trực tiếp →
              </a>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderAnnotationLayer
            renderTextLayer
            className="shadow-[0_8px_40px_rgba(0,0,0,0.2)] rounded-sm overflow-hidden"
          />
        </Document>
      </div>

      {/* ── Bottom Progress Bar ── */}
      {numPages > 0 && (
        <div className="flex items-center gap-4 px-5 py-2 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <button onClick={() => goTo(1)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition flex-shrink-0">⏮ Đầu</button>
          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(pageNumber / numPages) * 100}%`, background: coverColor }} />
          </div>
          <button onClick={() => goTo(numPages)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition flex-shrink-0">Cuối ⏭</button>
        </div>
      )}
    </div>
  );
}
