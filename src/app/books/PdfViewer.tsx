'use client';

import { useState, useCallback, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import dynamic from 'next/dynamic';

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const AiChatPanel = dynamic(() => import('./AiChatPanel'), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #06B6D4', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
    </div>
  ),
});

const QuizModal = dynamic(() => import('./QuizModal'), { ssr: false });

interface Props {
  pdfUrl: string;
  title: string;
  color: string;
  grade?: number;
  startPage?: number;
  onPageChange?: (p: number) => void;
  onLoad?: (total: number) => void;
}

export default function PdfViewer({ pdfUrl, title, color, grade = 6, startPage = 1, onPageChange, onLoad }: Props) {
  const [numPages, setNumPages]   = useState(0);
  const [page, setPage]           = useState(startPage);
  const [scale, setScale]         = useState(1.0);
  const [input, setInput]         = useState(String(startPage));
  const [errMsg, setErrMsg]       = useState('');
  const [showAi, setShowAi]       = useState(false);
  const [showQuiz, setShowQuiz]   = useState(false);
  // Lưu PDFDocumentProxy để trích xuất text
  const pdfDocRef = useRef<any>(null);

  const goTo = useCallback((p: number) => {
    const n = Math.min(Math.max(1, p), numPages || 1);
    setPage(n); setInput(String(n));
    onPageChange?.(n);
  }, [numPages, onPageChange]);

  /* ─── Trích xuất text trang hiện tại ① ─── */
  const getPageText = useCallback(async (): Promise<string> => {
    if (!pdfDocRef.current) return '';
    try {
      const pdfPage = await pdfDocRef.current.getPage(page);
      const content = await pdfPage.getTextContent();
      return content.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ')
        .trim();
    } catch { return ''; }
  }, [page]);

  /* ─── Trích xuất Sliding Window 9 Trang (Tạo Quiz) ─── */
  const getSurroundingPagesText = useCallback(async (span: number = 4): Promise<string> => {
    if (!pdfDocRef.current) return '';
    const start = Math.max(1, page - span);
    const end = Math.min(numPages || 1, page + span);
    let fullText = '';
    
    console.log('[getSurroundingPagesText] Starting. pdfDocRef =', !!pdfDocRef.current, 'start =', start, 'end =', end);

    // Fetch parallel to save time
    const promises = [];
    for (let i = start; i <= end; i++) {
      promises.push(
        pdfDocRef.current.getPage(i).then(async (pdfPage: any) => {
          const content = await pdfPage.getTextContent();
          const pText = content.items.filter((it: any) => 'str' in it).map((it: any) => it.str).join(' ').trim();
          console.log(`[getSurroundingPagesText] Page ${i} length: ${pText.length}`);
          return { pageNum: i, text: pText };
        }).catch((err: any) => {
          console.error(`[getSurroundingPagesText] Error at page ${i}`, err);
          return { pageNum: i, text: '' };
        })
      );
    }
    
    const results = await Promise.all(promises);
    results.sort((a, b) => a.pageNum - b.pageNum);
    for (const res of results) {
      if (res.text) {
        fullText += `[Trang ${res.pageNum}]\n${res.text}\n\n`;
      }
    }
    console.log('[getSurroundingPagesText] Done. Total length:', fullText.length);
    return fullText;
  }, [page, numPages]);

  /* ─── Chụp ảnh canvas trang hiện tại ② ─── */
  const getPageImage = useCallback((): string | null => {
    try {
      const canvas = document.querySelector('.react-pdf__Page canvas') as HTMLCanvasElement | null;
      if (!canvas) return null;
      return canvas.toDataURL('image/jpeg', 0.75);
    } catch { return null; }
  }, []);

  /* ─── Shared styles ─── */
  const toolbarStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
    padding: '10px 16px', flexShrink: 0,
    background: 'transparent',
    borderBottom: '1px solid rgba(255, 255, 255, 0.8)',
  };
  const groupStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 4,
    background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: 9999, padding: '3px 8px',
  };
  const btn = (disabled?: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 9999, border: 'none',
    background: 'transparent',
    color: disabled ? '#CBD5E1' : '#334155',
    cursor: disabled ? 'default' : 'pointer', fontWeight: 700, fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s', flexShrink: 0,
  });

  return (
    /* Outer: flex-row để reader + AI panel đứng cạnh nhau */
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ────────── PDF Reader column ────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0 }}>

        {/* Toolbar */}
        <div style={toolbarStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontWeight: 900, fontSize: 13, color: '#082F49',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          </div>

          {/* Page nav */}
          <div style={groupStyle}>
            <button style={btn(page <= 1)} onClick={() => goTo(page - 1)} disabled={page <= 1}>‹</button>
            <input type="number" value={input} min={1} max={numPages || 1}
              onChange={e => setInput(e.target.value)}
              onBlur={() => goTo(parseInt(input) || 1)}
              onKeyDown={e => e.key === 'Enter' && goTo(parseInt(input) || 1)}
              style={{ width: 36, textAlign: 'center', fontSize: 13, fontWeight: 700,
                color: '#082F49', background: 'transparent', border: 'none', outline: 'none' }} />
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>/ {numPages}</span>
            <button style={btn(page >= numPages)} onClick={() => goTo(page + 1)} disabled={page >= numPages}>›</button>
          </div>

          {/* Zoom */}
          <div style={groupStyle}>
            <button style={btn(scale <= 0.4)} onClick={() => setScale(s => +(Math.max(s - 0.15, 0.4)).toFixed(2))} disabled={scale <= 0.4}>−</button>
            <span style={{ width: 44, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#082F49' }}>{Math.round(scale * 100)}%</span>
            <button style={btn(scale >= 3)} onClick={() => setScale(s => +(Math.min(s + 0.15, 3.0)).toFixed(2))} disabled={scale >= 3}>+</button>
          </div>

          {/* Create Quiz Button */}
          <button onClick={() => setShowQuiz(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 9999, border: `1px solid ${color}40`,
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              color: color, fontSize: 12, fontWeight: 900, cursor: 'pointer',
              transition: 'all 0.25s', flexShrink: 0,
            }}>
            ⚡ Tạo Quiz
          </button>

          {/* AI toggle button */}
          <button onClick={() => setShowAi(a => !a)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 9999, border: showAi ? 'none' : '1px solid rgba(255,255,255,0.8)',
              background: showAi ? `linear-gradient(135deg, ${color}, ${color}bb)` : `rgba(255,255,255,0.5)`,
              color: showAi ? 'white' : color,
              fontSize: 12, fontWeight: 900, cursor: 'pointer',
              transition: 'all 0.25s',
              boxShadow: showAi ? `0 4px 14px ${color}45` : 'none',
              flexShrink: 0,
            }}>
            🤖 {showAi ? 'Ẩn AI' : 'Hỏi AI'}
          </button>
        </div>

        {/* PDF canvas area */}
        <div style={{
          flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '24px 16px', gap: 16,
          background: 'transparent',
        }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={(pdf: any) => {
              const n = pdf.numPages;
              setNumPages(n); setErrMsg(''); setPage(startPage); setInput(String(startPage));
              // Lưu PDFDocumentProxy để extract text sau
              pdfDocRef.current = pdf;
              onLoad?.(n);
              onPageChange?.(startPage);
            }}
            onLoadError={e => { console.error(e); setErrMsg(e.message); }}
            loading={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 64 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `4px solid ${color}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                <p style={{ color: '#334155', fontWeight: 600, fontSize: 14 }}>Đang tải tài liệu...</p>
              </div>
            }
            error={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 64, textAlign: 'center' }}>
                <span style={{ fontSize: 40 }}>📄</span>
                <p style={{ fontWeight: 900, color: '#082F49', fontSize: 16 }}>Không thể tải PDF</p>
                <p style={{ color: '#94A3B8', fontSize: 13 }}>{errMsg}</p>
                <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ color, fontWeight: 700, fontSize: 13 }}>Mở trực tiếp →</a>
              </div>
            }
          >
            <Page pageNumber={page} scale={scale} renderAnnotationLayer renderTextLayer
              className="shadow-[0_8px_32px_rgba(0,0,0,0.15)]" />
          </Document>
        </div>

        {/* Progress bar */}
        {numPages > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', flexShrink: 0,
            background: 'transparent', borderTop: '1px solid rgba(255, 255, 255, 0.8)',
          }}>
            <button onClick={() => goTo(1)}
              style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              ⏮ Đầu
            </button>
            <div style={{ flex: 1, height: 4, borderRadius: 999, background: '#E2E8F0', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999, background: color, width: `${(page / numPages) * 100}%`, transition: 'width 0.35s ease' }} />
            </div>
            <button onClick={() => goTo(numPages)}
              style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              Cuối ⏭
            </button>
          </div>
        )}
      </div>

      {/* ────────── AI Chat column (slide in) ────────── */}
      <div style={{
        width: showAi ? 340 : 0, flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        borderLeft: showAi ? '1px solid rgba(255, 255, 255, 0.8)' : '0px solid transparent',
        background: 'rgba(255, 255, 255, 0.3)',
      }}>
        {showAi && (
          <AiChatPanel
            pdfUrl={pdfUrl}
            pageNumber={page}
            bookTitle={title}
            grade={grade}
            getPageText={getPageText}
            getPageImage={getPageImage}
            onClose={() => setShowAi(false)}
          />
        )}
      </div>

      {/* ────────── Quiz Modal (Overlay Overlay) ────────── */}
      {showQuiz && (
        <QuizModal
          pdfUrl={pdfUrl}
          pageNumber={page}
          bookTitle={title}
          grade={grade}
          color={color}
          getSurroundingPagesText={getSurroundingPagesText}
          getPageImage={getPageImage}
          onClose={() => setShowQuiz(false)}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
