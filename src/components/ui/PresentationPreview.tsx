'use client';

import React, { JSX, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { renderMathText } from './MathContentEditor';
import { Icon } from '@iconify/react';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });

import type { StoryBlock, QuizQuestion, FunFactFormula } from '@/types/presentation';

function DataTablePreview({ block }: { block: StoryBlock }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const headers = block.tableHeaders || [];
  const rawRows = block.tableRows || [];
  const highlightCol = block.tableHighlightCol ?? -1;
  const hasSplit = block.tableSplitHeader;

  const rows = sortCol !== null
    ? [...rawRows].sort((a, b) => {
        const va = parseFloat(a[sortCol]?.replace(/[^0-9.-]/g, '')) || 0;
        const vb = parseFloat(b[sortCol]?.replace(/[^0-9.-]/g, '')) || 0;
        const sv = va === 0 && vb === 0 ? (a[sortCol] || '').localeCompare(b[sortCol] || '') : va - vb;
        return sortAsc ? sv : -sv;
      })
    : rawRows;

  const handleSort = (ci: number) => {
    if (sortCol === ci) setSortAsc(!sortAsc);
    else { setSortCol(ci); setSortAsc(false); }
  };

  const HEADER_BG = block.tableHeaderBg || '#1e3a8a';
  const HEADER_TEXT = block.tableHeaderTextColor || '#ffffff';
  const HEADER_BORDER = 'rgba(255,255,255,0.2)';
  const CELL_BORDER = '#cbd5e1';

  return (
    <div className="relative z-10 mx-4 my-8">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(30,58,138,0.10)] overflow-hidden">
        {/* Title bar */}
        {(block.tableTitle || block.tableUnit) && (
          <div className="px-5 py-3 flex items-center justify-between gap-3" style={{background: HEADER_BG}}>
            <h3 className="font-black text-base" style={{color: HEADER_TEXT}}>{block.tableTitle || 'Bảng số liệu'}</h3>
            {block.tableUnit && <p className="text-xs font-medium" style={{color: HEADER_TEXT, opacity: 0.75}}>(Đơn vị: {block.tableUnit})</p>}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {headers.map((h, ci) => {
                  if (hasSplit && ci === 0) {
                    return (
                      <th
                        key={ci}
                        className="relative p-0"
                        style={{
                          background: HEADER_BG,
                          minWidth: '130px',
                          height: '72px',
                          border: `1px solid ${HEADER_BORDER}`,
                        }}
                      >
                        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="0" x2="100%" y2="100%" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                        </svg>
                        <span className="absolute top-2.5 right-3 text-xs font-bold" style={{color: HEADER_TEXT, opacity:0.85}}>{block.tableColHeader || ''}</span>
                        <span className="absolute bottom-2.5 left-3 text-xs font-bold" style={{color: HEADER_TEXT, opacity:0.85}}>{block.tableRowHeader || ''}</span>
                      </th>
                    );
                  }
                  return (
                    <th
                      key={ci}
                      onClick={() => handleSort(ci)}
                      className="px-4 py-3 text-center cursor-pointer select-none group"
                      style={{
                        background: HEADER_BG,
                        border: `1px solid ${HEADER_BORDER}`,
                        color: HEADER_TEXT,
                        fontWeight: 700,
                        fontSize: '13px',
                        transition: 'background 0.15s',
                        opacity: ci === highlightCol ? 1 : 0.88,
                      }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{h}</span>
                        <span className="text-xs opacity-0 group-hover:opacity-60 transition-opacity" style={{color: HEADER_TEXT}}>
                          {sortCol === ci ? (sortAsc ? '↑' : '↓') : '↕'}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const isHighlightedRow = block.tableHighlightRow === ri;
                return (
                  <tr key={ri} className="transition-colors duration-150 hover:brightness-95">
                    {row.map((cell, ci) => {
                      const isFirstCol = ci === 0;
                      const isHiCol = ci === highlightCol;
                      let bg = ri % 2 === 0 ? '#ffffff' : '#f8f9ff';
                      if (isFirstCol) bg = ri % 2 === 0 ? '#eff6ff' : '#dbeafe';
                      if (isHighlightedRow) bg = '#fefce8';
                      if (isFirstCol && isHighlightedRow) bg = '#fef9c3';
                      return (
                        <td
                          key={ci}
                          className="px-4 py-2.5 text-sm"
                          style={{
                            border: `1px solid ${CELL_BORDER}`,
                            background: bg,
                            textAlign: isFirstCol ? 'left' : 'center',
                            fontWeight: isFirstCol ? 600 : isHiCol ? 700 : 400,
                            color: isFirstCol ? '#1e3a8a' : isHiCol ? '#4c1d95' : isHighlightedRow ? '#92400e' : '#334155',
                          }}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Source footer */}
        {block.tableSource && (
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-right">
            <span className="text-xs italic text-slate-500">(Nguồn: {block.tableSource})</span>
          </div>
        )}
      </div>
    </div>
  );
}


function ImageSlider({ urls }: { urls: string[] }) {
  const [displayUrls, setDisplayUrls] = useState<string[]>(urls);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // phase: idle | exit | snap | enter
  const [phase, setPhase] = useState<'idle' | 'exit' | 'snap' | 'enter'>('idle');
  const prevUrlKeyRef = useRef(urls.join(','));

  useEffect(() => { setMounted(true); }, []);

  const urlKey = urls.join(',');
  useEffect(() => {
    if (urlKey === prevUrlKeyRef.current) return;
    prevUrlKeyRef.current = urlKey;

    // Step 1: slide old content out to the left
    setPhase('exit');

    const t1 = setTimeout(() => {
      // Step 2: snap new content to off-screen right (no transition)
      setDisplayUrls(urls);
      setCurrentIndex(0);
      setPhase('snap');

      // Step 3: next 2 frames → slide in from right
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase('enter');
          setTimeout(() => setPhase('idle'), 460);
        });
      });
    }, 370);

    return () => clearTimeout(t1);
  }, [urlKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const slideStyle: React.CSSProperties = (() => {
    if (phase === 'exit')  return { transform: 'translateX(-110%)', opacity: 0,   transition: 'transform 350ms ease-in-out, opacity 300ms ease-in-out' };
    if (phase === 'snap')  return { transform: 'translateX(110%)',  opacity: 0,   transition: 'none' };
    if (phase === 'enter') return { transform: 'translateX(0%)',    opacity: 1,   transition: 'transform 430ms cubic-bezier(0.22,1,0.36,1), opacity 350ms ease-out' };
    return                        { transform: 'translateX(0%)',    opacity: 1,   transition: 'transform 350ms ease-in-out, opacity 350ms ease-in-out' };
  })();

  if (!displayUrls || displayUrls.length === 0) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-[#0a1628]">
      <span className="text-6xl mb-4"><Icon icon="mingcute:photo-album-fill" width={50} /></span>
      <span className="text-xl font-bold">Chưa có hình ảnh minh họa</span>
    </div>
  );

  const currentUrl = displayUrls[currentIndex];

  return (
    <>
      <div className="w-full h-full relative overflow-hidden group">
        {/* Slide-transition wrapper */}
        <div className="absolute inset-0" style={slideStyle}>
        {/* Blurred full-bleed background */}
        <div
          key={`bg-${currentIndex}`}
          className="absolute inset-0 z-0 scale-110"
          style={{
            backgroundImage: `url(${currentUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(28px) brightness(0.4) saturate(1.2)',
          }}
        />
        {/* Vignette */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Main image — no zoom, just fade in */}
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 lg:p-10 pointer-events-none">
          <img
            key={currentIndex}
            src={currentUrl}
            alt="Minh họa tình huống"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in fade-in duration-500"
          />
        </div>

        {/* Hover zoom button — bottom right */}
        <button
          className="absolute bottom-4 right-4 z-30 w-11 h-11 bg-black/55 hover:bg-black/80 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 border border-white/25 pointer-events-auto shadow-lg"
          onClick={() => setLightboxOpen(true)}
          title="Phóng to ảnh"
        >
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>

        {/* Nav buttons for multiple images */}
        {displayUrls.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(prev => prev === 0 ? displayUrls.length - 1 : prev - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 hover:bg-white/30 backdrop-blur-md text-white text-lg font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20 pointer-events-auto"
            >←</button>
            <button
              onClick={() => setCurrentIndex(prev => prev === displayUrls.length - 1 ? 0 : prev + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/15 hover:bg-white/30 backdrop-blur-md text-white text-lg font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-white/20 pointer-events-auto"
            >→</button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full pointer-events-auto">
              {displayUrls.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/40 w-2 hover:bg-white/70'}`}
                />
              ))}
            </div>
          </>
        )}
        </div>{/* end slide-transition wrapper */}
      </div>

      {/* LIGHTBOX PORTAL */}
      {mounted && lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-black/92 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-150"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-5 right-5 z-10 w-12 h-12 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center text-xl font-bold transition-all border border-white/20"
            onClick={() => setLightboxOpen(false)}
          >✕</button>

          <div
            className="relative flex items-center justify-center max-w-[88vw] max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={`lb-${currentIndex}`}
              src={currentUrl}
              alt="Phóng to"
              className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>

          {displayUrls.length > 1 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-bold">
              {currentIndex + 1} / {displayUrls.length}
            </div>
          )}

          {displayUrls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev === 0 ? displayUrls.length - 1 : prev - 1); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/25 text-white text-2xl font-bold rounded-full flex items-center justify-center transition-all border border-white/20"
              >←</button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(prev => prev === displayUrls.length - 1 ? 0 : prev + 1); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/25 text-white text-2xl font-bold rounded-full flex items-center justify-center transition-all border border-white/20"
              >←</button>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function parseDurationToSeconds(str: string): number {
  if (!str) return 0;
  const s = str.toLowerCase().trim();
  const minSecMatch = s.match(/(\d+)\s*ph[uú]t\s*(\d+)\s*gi[aâ]y/);
  if (minSecMatch) return parseInt(minSecMatch[1]) * 60 + parseInt(minSecMatch[2]);
  const hourMatch = s.match(/(\d+)\s*gi[o\u1901]/);
  if (hourMatch) return parseInt(hourMatch[1]) * 3600;
  const minMatch = s.match(/(\d+)\s*ph[uú]t/);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const secMatch = s.match(/(\d+)\s*gi[aâ]y/);
  if (secMatch) return parseInt(secMatch[1]);
  const numMatch = s.match(/^(\d+)$/);
  if (numMatch) return parseInt(numMatch[1]) * 60;
  return 0;
}

function GroupActivityTimer({ duration }: { duration: string }) {
  const totalSeconds = parseDurationToSeconds(duration);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(totalSeconds);
    setRunning(false);
    setDone(false);
  }, [totalSeconds]);

  if (totalSeconds === 0) return null;

  const start = () => {
    if (done || remaining <= 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setRunning(false);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setDone(false);
    setRemaining(totalSeconds);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const ringColor = done ? '#22c55e' : pct > 0.35 ? '#84cc16' : pct > 0.15 ? '#f59e0b' : '#ef4444';
  const timeColor = done ? 'text-emerald-500' : pct > 0.35 ? 'text-lime-700' : pct > 0.15 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className={`flex flex-col items-center gap-3 py-4 px-5 rounded-2xl border-2 transition-all duration-500 ${
      done ? 'bg-emerald-50 border-emerald-400 shadow-[0_0_24px_rgba(34,197,94,0.25)]' :
      running ? 'bg-white/80 border-lime-400 shadow-[0_0_24px_rgba(132,204,22,0.25)]' :
      'bg-white/60 border-lime-200'
    }`}>
      {/* Ring timer */}
      <div className="relative">
        <svg width={120} height={120}>
          <circle cx={60} cy={60} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={7} />
          <circle
            cx={60} cy={60} r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {done ? (
            <span className="text-3xl animate-bounce"><Icon icon="ic:round-share-arrival-time" width={30} color="#009966" /></span>
          ) : (
            <span className={`font-black text-2xl tabular-nums leading-none ${timeColor} ${running ? 'opacity-100' : 'opacity-80'}`}>
              {mm}:{ss}
            </span>
          )}
        </div>
      </div>

      {done && <p className="text-emerald-600 font-black text-sm -mt-1">Hết giờ rồi!</p>}

      {/* Controls */}
      <div className="flex gap-2">
        {!running && !done && (
          <button
            onClick={start}
            className="px-4 py-1.5 bg-lime-500 hover:bg-lime-600 active:scale-95 text-white font-black rounded-xl text-sm transition-all shadow-md"
          >
            {remaining === totalSeconds ? '▶ Bắt đầu' : '▶ Tiếp tục'}
          </button>
        )}
        {running && (
          <button
            onClick={pause}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black rounded-xl text-sm transition-all shadow-md"
          >
            ⏸ Dừng
          </button>
        )}
        {(running || remaining < totalSeconds) && (
          <button
            onClick={reset}
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-700 font-black rounded-xl text-sm transition-all"
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  blocks: StoryBlock[];
  onClose: () => void;
}

const ANNOTATION_PRESETS: Record<string, any[]> = {
  'none': [],
  'latlng': [
    { lat: 0, lng: 90, label: 'Xích đạo (Vĩ tuyến gốc)', isAnnotation: true, color: 'text-red-500' },
    { lat: 45, lng: 0, label: 'Kinh tuyến gốc', isAnnotation: true, color: 'text-blue-600' },
    { lat: 30, lng: 45, label: 'Vĩ tuyến Bắc', isAnnotation: true, color: 'text-slate-700' },
    { lat: -30, lng: 45, label: 'Vĩ tuyến Nam', isAnnotation: true, color: 'text-slate-700' },
    { lat: 15, lng: 45, label: 'Kinh tuyến Đông', isAnnotation: true, color: 'text-slate-700' },
    { lat: 15, lng: -45, label: 'Kinh tuyến Tây', isAnnotation: true, color: 'text-slate-700' },
    { lat: 20, lng: 0, label: '20°B', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: 40, lng: 0, label: '40°B', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: 60, lng: 0, label: '60°B', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: -20, lng: 0, label: '20°N', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: -40, lng: 0, label: '40°N', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: 0, lng: 20, label: '20°Đ', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: 40, label: '40°Đ', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: 60, label: '60°Đ', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: -20, label: '20°T', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: -40, label: '40°T', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
  ],
  'continents': [
    { lat: 45, lng: 10, label: 'Châu Âu', isAnnotation: true, color: 'text-emerald-700' },
    { lat: 10, lng: 20, label: 'Châu Phi', isAnnotation: true, color: 'text-orange-700' },
    { lat: 40, lng: 100, label: 'Châu Á', isAnnotation: true, color: 'text-rose-700' },
    { lat: 45, lng: -100, label: 'Bắc Mỹ', isAnnotation: true, color: 'text-blue-700' },
    { lat: -15, lng: -60, label: 'Nam Mỹ', isAnnotation: true, color: 'text-green-700' },
    { lat: -25, lng: 135, label: 'Châu Đại Dương', isAnnotation: true, color: 'text-purple-700' },
    { lat: -80, lng: 0, label: 'Châu Nam Cực', isAnnotation: true, color: 'text-slate-700' },
  ],
  'oceans': [
    { lat: 0, lng: -150, label: 'Thái Bình Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: 0, lng: 150, label: 'Thái Bình Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: 0, lng: -30, label: 'Đại Tây Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: -10, lng: 70, label: 'Ấn Độ Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: 80, lng: 0, label: 'Bắc Băng Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: -60, lng: 0, label: 'Nam Đại Dương', isAnnotation: true, color: 'text-cyan-700' },
  ]
};

export function PresentationPreview({ blocks, onClose }: Props) {
  const [pov, setPov] = useState({ lat: 21.0285, lng: 105.8542, altitude: 2 });
  const [showGrid, setShowGrid] = useState(false);
  const [activePin, setActivePin] = useState<any>(null);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [activeMediaBlock, setActiveMediaBlock] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // `${blockId}_${qIdx}` -> selected option index
  const [quizCurrent, setQuizCurrent] = useState<Record<string, number>>({}); // blockId -> current question index
  const [openAnswerShown, setOpenAnswerShown] = useState<Record<string, boolean>>({}); // blockId -> revealed
  const globeRef = useRef<any>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Setup Intersection Observer for MapActions
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({
        width: window.innerWidth / 2, // Lấy exacly một nửa màn hình phải
        height: window.innerHeight
      });

      const handleResize = () => {
        setDimensions({
          width: window.innerWidth / 2,
          height: window.innerHeight
        });
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const mapActionElements = document.querySelectorAll('.preview-media-action');
          let activeEl: Element | null = null;

          const containerRect = container.getBoundingClientRect();
          const centerY = containerRect.top + containerRect.height / 2;

          // "Zone" model: the active block is the LAST one whose center has
          // already crossed (or reached) the viewport centre.  Elements are in
          // DOM order top→bottom, so we walk forward and keep overwriting
          // activeEl; once an element's centre is below centre we stop.
          for (let i = 0; i < mapActionElements.length; i++) {
            const el = mapActionElements[i];
            const rect = el.getBoundingClientRect();
            const elCenterY = rect.top + rect.height / 2;

            if (elCenterY <= centerY) {
              activeEl = el; // this one has passed centre — keep going
            } else {
              break; // all following elements are lower, no need to check
            }
          }

          // No block has reached centre yet → globe shows
          if (!activeEl) {
            setActiveMediaBlock(null);
            ticking = false;
            return;
          }

          const type = activeEl.getAttribute('data-type');

            if (type === 'mapAction') {
              const lat = parseFloat(activeEl.getAttribute('data-lat') || '0');
              const lng = parseFloat(activeEl.getAttribute('data-lng') || '0');
              const zoom = parseInt(activeEl.getAttribute('data-zoom') || '5', 10);
              const grid = activeEl.getAttribute('data-showgrid') === 'true';
              const annotationPreset = activeEl.getAttribute('data-annotationpreset') || 'none';
              const hasPin = activeEl.getAttribute('data-showpin') === 'true';
              const globeStyle = activeEl.getAttribute('data-globestyle') || 'blue-marble';

              const altitude = Math.max(0.1, 5 / zoom);

              setActiveMediaBlock((prev: any) => {
                if (
                  prev?.type === 'mapAction' &&
                  prev.lat === lat &&
                  prev.lng === lng &&
                  prev.altitude === altitude &&
                  prev.annotationPreset === annotationPreset &&
                  prev.grid === grid &&
                  prev.globeStyle === globeStyle
                ) {
                  return prev;
                }
                return {
                  type: 'mapAction',
                  lat, lng, altitude, grid, annotationPreset, globeStyle,
                  pin: hasPin ? {
                    lat, lng,
                    title: activeEl!.getAttribute('data-pintitle'),
                    info: activeEl!.getAttribute('data-pininfo'),
                    image: activeEl!.getAttribute('data-pinimage'),
                  } : null
                };
              });
            } else if (type === 'imageScenario') {
              const urlsAttr = activeEl.getAttribute('data-imageurls');
              let parsedUrls: string[] = [];
              if (urlsAttr) {
                try { parsedUrls = JSON.parse(urlsAttr); } catch (e) { }
              }
              const singleUrl = activeEl.getAttribute('data-imageurl');
              if (parsedUrls.length === 0 && singleUrl) parsedUrls = [singleUrl];

              setActiveMediaBlock((prev: any) => {
                if (prev?.type === 'imageScenario' && JSON.stringify(prev.imageUrls) === JSON.stringify(parsedUrls)) {
                  return prev;
                }
                return {
                  type: 'imageScenario',
                  imageUrls: parsedUrls
                };
              });
            } else if (type === 'openQuestion') {
              const imgUrl = activeEl.getAttribute('data-questionimage') || '';
              setActiveMediaBlock((prev: any) => {
                if (prev?.type === 'openQuestion' && prev.questionImage === imgUrl) return prev;
                return { type: 'openQuestion', questionImage: imgUrl };
              });
            } else if (type === 'gallery') {
              const urlsAttr = activeEl.getAttribute('data-imageurls') || '[]';
              let parsedUrls: string[] = [];
              try { parsedUrls = JSON.parse(urlsAttr); } catch (e) { }
              setActiveMediaBlock((prev: any) => {
                if (prev?.type === 'gallery' && JSON.stringify(prev.imageUrls) === JSON.stringify(parsedUrls)) return prev;
                return { type: 'gallery', imageUrls: parsedUrls };
              });
            }
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll);
    const initTimer = setTimeout(handleScroll, 100);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(initTimer);
    };
  }, [blocks, mounted]);

  // Khởi tạo tâm mặc định ở Việt Nam khi mới vào trình chiếu
  useEffect(() => {
    const initInterval = setInterval(() => {
      if (globeRef.current && !activeMediaBlock) {
        globeRef.current.flyTo(16.0, 106.0, 8000000, 2);
        clearInterval(initInterval);
      } else if (globeRef.current && activeMediaBlock) {
        clearInterval(initInterval);
      }
    }, 200);
    return () => clearInterval(initInterval);
  }, []);

  // Đảm bảo lệnh xoay được gọi kể cả khi Globe tải chậm (Dynamic Import)
  useEffect(() => {
    if (!activeMediaBlock || activeMediaBlock.type !== 'mapAction') return;

    const interval = setInterval(() => {
      if (globeRef.current) {
        globeRef.current.flyTo(activeMediaBlock.lat, activeMediaBlock.lng, activeMediaBlock.altitude * 4000000, 1.5);
        setShowGrid(activeMediaBlock.grid);
        setActivePin(activeMediaBlock.pin);
        
        globeRef.current.clearPins();
        if (activeMediaBlock.pin) {
          globeRef.current.addPin(activeMediaBlock.pin.lat, activeMediaBlock.pin.lng, activeMediaBlock.pin.title || '', activeMediaBlock.pin.info || '', activeMediaBlock.pin.image || '');
        } else {
          setSelectedPin(null);
        }
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeMediaBlock]);

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex flex-col lg:flex-row bg-[#E0F2FE] animate-in fade-in overflow-hidden">
      {/* CLOSE BUTTON */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-[100000]">
        <button onClick={onClose} className="w-10 h-10 lg:w-12 lg:h-12 bg-white/50 hover:bg-white/80 text-[#082F49] rounded-full flex items-center justify-center text-lg lg:text-xl font-bold backdrop-blur-md transition-all shadow-lg border border-white/80">✕</button>
      </div>

      {/* LEFT: SCROLLABLE CONTENT WRAPPER */}
      <div className="left-panel-preview flex flex-col relative z-20 bg-white/70 backdrop-blur-2xl border-b lg:border-b-0 lg:border-r border-white/80 shadow-[20px_0_50px_rgba(14,165,233,0.1)] w-full lg:w-1/2 lg:min-w-[500px] overflow-hidden">
        {/* Thêm class để ẩn scrollbar hiển thị ở giữa màn hình */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden pt-16 lg:pt-32 pb-16 lg:pb-64 px-4 lg:px-16 space-y-6 lg:space-y-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {blocks.map((block) => {

          if (block.type === 'heading') {
            const hasBg = !!block.headingBg;
            const hasColor = !!block.headingColor;
            return (
              <div
                key={block.id}
                className="relative z-10 p-6 rounded-2xl border-l-4"
                style={{
                  background: block.headingBg || 'linear-gradient(135deg, #E0F2FE, transparent)',
                  borderLeftColor: block.headingColor || '#06B6D4',
                }}
              >
                <h2
                  className={`font-black ${block.level === 1 ? 'text-5xl leading-tight' : block.level === 2 ? 'text-3xl' : 'text-2xl'}`}
                  style={{ color: block.headingColor || (block.level === 3 ? '#0891B2' : block.level === 2 ? '#0E7490' : '#082F49') }}
                >
                  {block.content}
                </h2>
              </div>
            );
          }

          if (block.type === 'text') {
            return (
              <div key={block.id} className="relative z-10 w-full">
                <div
                  className="text-[#334155] leading-[1.8] font-medium text-[1.1rem] text-justify drop-shadow-sm [&_b]:font-black [&_strong]:font-black [&_i]:italic [&_em]:italic [&_u]:underline [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2 [&_li]:my-1 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-cyan-700 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-cyan-600 [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-slate-700 [&_h4]:mt-3 [&_h4]:mb-1"
                  dangerouslySetInnerHTML={{ __html: block.content || '' }}
                />
              </div>
            );
          }

          if (block.type === 'objectives') {
            const hasItems = (block.items?.length || 0) > 0;
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-orange-50 to-amber-50 backdrop-blur-xl p-8 rounded-3xl border border-orange-200 shadow-[0_10px_30px_rgba(245,158,11,0.15)] mx-4 my-8">
                <h3 className="font-black text-orange-600 mb-4 flex items-center gap-3 text-xl drop-shadow-sm">
                  🎯 Học xong bài này, em sẽ:
                </h3>
                {hasItems ? (
                  <ul className="space-y-2.5">
                    {block.items!.filter(i => i.trim()).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-orange-100 shadow-sm">
                        <span className="w-6 h-6 rounded-md bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">✓</span>
                        <span className="text-[#082F49] font-medium text-base leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    className="text-[#334155] font-medium text-lg leading-relaxed [&_b]:font-black [&_strong]:font-black [&_i]:italic [&_em]:italic [&_u]:underline [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2 [&_li]:my-1"
                    dangerouslySetInnerHTML={{ __html: block.content || '' }}
                  />
                )}
              </div>
            );
          }

          if (block.type === 'imageScenario') {
            return (
              <div
                key={block.id}
                id={`block-${block.id}`}
                className="preview-media-action relative z-10 bg-white border-2 border-emerald-400 rounded-[32px] p-8 shadow-md mx-4 my-12"
                data-type="imageScenario"
                data-imageurl={block.imageUrl}
                data-imageurls={JSON.stringify(block.imageUrls || [])}
              >
                <div className="flex gap-6 items-start">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl shrink-0 border-4 border-white shadow-sm -mt-4 -ml-4 z-10 relative">
                    🏃
                  </div>
                  <div className="flex-1 mt-2">
                    <p className="text-[#082F49] text-xl font-medium italic leading-relaxed">
                      "{block.content}"
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          if (block.type === 'funFact') {
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-[#E0F2FE]/90 to-[#DCFCE7]/90 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-[0_10px_30px_rgba(14,165,233,0.1)] mx-4">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <h3 className="font-black text-[#082F49] flex items-center gap-3 text-xl drop-shadow-sm">
                    <span className="text-3xl">{block.emoji || '💡'}</span> {block.title}
                  </h3>
                  {block.tag && (
                    <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold border border-cyan-200">
                      #{block.tag}
                    </span>
                  )}
                </div>
{/* New unified math content */}
                {block.funFactRawContent ? (
                  <div
                    className="text-[#334155] text-lg leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: renderMathText(block.funFactRawContent) }}
                  />
                ) : (
                  <>
                    <div
                      className="text-[#334155] text-lg leading-relaxed font-medium [&_b]:font-black [&_strong]:font-black [&_i]:italic [&_em]:italic [&_u]:underline [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2 [&_li]:my-1 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-cyan-700 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-cyan-600 [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-slate-700 [&_h4]:mt-3 [&_h4]:mb-1"
                      dangerouslySetInnerHTML={{ __html: block.content || '' }}
                    />
                    {(block.funFactFormulas || []).length > 0 && (
                      <div className="mt-5 space-y-4">
                        {(block.funFactFormulas as FunFactFormula[]).map((f, fi) => {
                          let rendered = '';
                          let hasError = false;
                          try {
                            rendered = katex.renderToString(f.latex || '', { displayMode: true, throwOnError: false, trust: false });
                          } catch {
                            hasError = true;
                          }
                          return (
                            <div key={fi} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-cyan-200 px-5 py-4 shadow-sm">
                              {f.label && <p className="text-sm font-semibold text-[#334155] mb-2">{f.label}</p>}
                              {hasError
                                ? <p className="text-rose-500 text-sm font-mono">[Lỗi cú pháp LaTeX]</p>
                                : <div className="overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: rendered }} />
                              }
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {block.funFactContentAfter && (
                      <div
                        className="mt-4 text-[#334155] text-base leading-relaxed font-medium [&_b]:font-black [&_strong]:font-black [&_i]:italic [&_em]:italic [&_u]:underline [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2 [&_li]:my-1"
                        dangerouslySetInnerHTML={{ __html: block.funFactContentAfter }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          }

          if (block.type === 'dataTable') {
            return <DataTablePreview key={block.id} block={block} />;
          }

          if (block.type === 'quiz') {
            // Normalise: support legacy single-question blocks
            const questions: QuizQuestion[] = block.quizQuestions && block.quizQuestions.length > 0
              ? block.quizQuestions
              : [{
                  id: block.id + '_q0',
                  question: block.question || '',
                  options: block.options?.length === 4 ? block.options : ['', '', '', ''],
                  correctIndex: block.correctIndex ?? 0,
                  explanation: block.explanation || '',
                  questionImage: block.questionImage || '',
                }];

            const currentQIdx = quizCurrent[block.id] ?? 0;
            const q = questions[currentQIdx];
            const answerKey = `${block.id}_${currentQIdx}`;
            const selectedIdx = quizAnswers[answerKey];
            const hasAnswered = selectedIdx !== undefined;
            const isCorrect = selectedIdx === q.correctIndex;
            const totalAnswered = questions.filter((_, i) => quizAnswers[`${block.id}_${i}`] !== undefined).length;

            return (
              <div key={block.id} className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl border border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.12)] mx-4 overflow-hidden">
                {/* Progress bar + header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-black text-sm">❓ Trắc nghiệm</span>
                    {questions.length > 1 && (
                      <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {totalAnswered}/{questions.length} đã trả lời
                      </span>
                    )}
                  </div>
                  {questions.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      {questions.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setQuizCurrent(prev => ({ ...prev, [block.id]: i }))}
                          className={`transition-all duration-200 rounded-full ${
                            i === currentQIdx ? 'w-5 h-5 bg-white text-orange-600 text-[10px] font-black flex items-center justify-center shadow' :
                            quizAnswers[`${block.id}_${i}`] !== undefined
                              ? (quizAnswers[`${block.id}_${i}`] === questions[i].correctIndex ? 'w-3 h-3 bg-green-300' : 'w-3 h-3 bg-red-300')
                              : 'w-3 h-3 bg-white/40 hover:bg-white/70'
                          }`}
                        >{i === currentQIdx ? i + 1 : ''}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  {/* Question number + text */}
                  {questions.length > 1 && (
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Câu {currentQIdx + 1} / {questions.length}</p>
                  )}
                  <h3 className="font-bold text-[#082F49] text-xl leading-snug">{q.question || '(Chưa có câu hỏi)'}</h3>

                  {/* Question image */}
                  {q.questionImage && (
                    <div className="rounded-2xl overflow-hidden border border-orange-100 bg-slate-50 max-h-[260px] flex items-center justify-center">
                      <img src={q.questionImage} alt="Câu hỏi" className="max-w-full max-h-[260px] object-contain" />
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2.5">
                    {q.options.map((opt, idx) => {
                      const isSelected = selectedIdx === idx;
                      const isCorrectOpt = idx === q.correctIndex;
                      let cls = 'w-full text-left p-4 rounded-2xl border-2 font-semibold text-base transition-all duration-200 ';
                      if (!hasAnswered) cls += 'bg-slate-50/60 hover:bg-orange-50 border-slate-200 hover:border-orange-400 text-[#334155] cursor-pointer active:scale-[0.98]';
                      else if (isCorrectOpt) cls += 'bg-green-100 border-green-400 text-green-800';
                      else if (isSelected) cls += 'bg-red-100 border-red-400 text-red-700';
                      else cls += 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                      return (
                        <button key={idx} className={cls} onClick={() => !hasAnswered && setQuizAnswers(prev => ({ ...prev, [answerKey]: idx }))}>
                          <span className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                              !hasAnswered ? 'bg-orange-100 text-orange-600' :
                              isCorrectOpt ? 'bg-green-500 text-white' :
                              isSelected ? 'bg-red-400 text-white' : 'bg-slate-200 text-slate-400'
                            }`}>
                              {hasAnswered && isCorrectOpt ? '✓' : hasAnswered && isSelected && !isCorrectOpt ? '✕' : String.fromCharCode(65 + idx)}
                            </span>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {hasAnswered && q.explanation && (
                    <div className={`p-4 rounded-2xl border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'} animate-in slide-in-from-bottom-2 fade-in duration-400`}>
                      <p className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                        💡 {isCorrect ? 'Chính xác! Giải thích:' : 'Chưa đúng. Giải thích:'}
                      </p>
                      <p className="text-[#334155] leading-relaxed font-medium">{q.explanation}</p>
                    </div>
                  )}

                  {/* Navigation buttons */}
                  {questions.length > 1 && (
                    <div className="flex justify-between pt-2">
                      <button
                        onClick={() => setQuizCurrent(prev => ({ ...prev, [block.id]: Math.max(0, currentQIdx - 1) }))}
                        disabled={currentQIdx === 0}
                        className="px-4 py-2 rounded-xl bg-orange-100 text-orange-700 font-bold text-sm disabled:opacity-30 hover:bg-orange-200 transition-all"
                      >← Trước</button>
                      <button
                        onClick={() => setQuizCurrent(prev => ({ ...prev, [block.id]: Math.min(questions.length - 1, currentQIdx + 1) }))}
                        disabled={currentQIdx === questions.length - 1}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm disabled:opacity-30 hover:bg-orange-600 transition-all"
                      >Tiếp →</button>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // ════════ PHASE 2 MODULES ════════

          if (block.type === 'video') {
            // Convert YouTube URL → embed URL
            let embedUrl = block.videoUrl || '';
            const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
            const isYouTube = !!ytMatch;
            if (isYouTube) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
            const isMp4 = /\.(mp4|webm|ogg)(\?|$)/i.test(block.videoUrl || '');

            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-red-50 to-pink-50 backdrop-blur-xl p-6 rounded-3xl border border-red-200 shadow-[0_10px_30px_rgba(239,68,68,0.1)] mx-4 my-6">
                {block.title && <h3 className="font-black text-red-700 mb-3 flex items-center gap-3 text-xl"><span>🎬</span>{block.title}</h3>}
                <div className="rounded-2xl overflow-hidden bg-black aspect-video relative shadow-lg">
                  {isYouTube ? (
                    <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  ) : isMp4 ? (
                    <video controls className="absolute inset-0 w-full h-full" src={block.videoUrl} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                      <span className="text-5xl mb-2">🎬</span>
                      <span className="text-sm">Chưa có URL video hợp lệ</span>
                    </div>
                  )}
                </div>
                {block.videoCaption && <p className="text-sm text-red-600 italic mt-3 text-center font-medium">{block.videoCaption}</p>}
              </div>
            );
          }

          if (block.type === 'chart') {
            const data = block.chartData || [];
            const max = Math.max(...data.map(d => d.value), 1);
            const total = data.reduce((s, d) => s + d.value, 0) || 1;
            const chartType = block.chartType || 'column';

            // ── SGK-style Column Chart (vertical bars) ──
            const renderColumnChart = () => {
              if (data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu</p>;
              // Compute nice Y-axis max & ticks
              const rawMax = max * 1.15;
              const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
              const niceStep = [1, 2, 2.5, 5, 10].map(f => f * magnitude).find(s => rawMax / s <= 6) || magnitude * 10;
              const yMax = Math.ceil(rawMax / niceStep) * niceStep;
              const yTicks: number[] = [];
              for (let v = 0; v <= yMax; v += niceStep) yTicks.push(v);

              // SVG layout constants
              const SVG_W = 480;
              const SVG_H = 260;
              const PAD_L = 58;  // space for Y-axis labels
              const PAD_R = 16;
              const PAD_T = 28;  // space for value labels above bars
              const PAD_B = 44;  // space for X-axis labels
              const chartW = SVG_W - PAD_L - PAD_R;
              const chartH = SVG_H - PAD_T - PAD_B;
              const barGroupW = chartW / data.length;
              const barW = Math.min(barGroupW * 0.55, 60);

              const xOf = (i: number) => PAD_L + barGroupW * i + barGroupW / 2;
              const yOf = (v: number) => PAD_T + chartH * (1 - v / yMax);

              return (
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxHeight: 320 }}>
                  {/* Y-axis title */}
                  {block.chartYLabel && (
                    <text
                      x={12}
                      y={PAD_T + chartH / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={10}
                      fill="#334155"
                      transform={`rotate(-90, 12, ${PAD_T + chartH / 2})`}
                    >{block.chartYLabel}{block.chartUnit ? `\n(${block.chartUnit})` : ''}</text>
                  )}
                  {/* Grid lines + Y-axis ticks */}
                  {yTicks.map((v, i) => (
                    <g key={i}>
                      <line x1={PAD_L} y1={yOf(v)} x2={SVG_W - PAD_R} y2={yOf(v)}
                        stroke={v === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={v === 0 ? 1.5 : 1} />
                      <text x={PAD_L - 6} y={yOf(v)} textAnchor="end" dominantBaseline="middle"
                        fontSize={10} fill="#64748b">{v}</text>
                    </g>
                  ))}
                  {/* Y-axis line */}
                  <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + chartH} stroke="#94a3b8" strokeWidth={1.5} />
                  {/* Bars */}
                  {data.map((d, i) => {
                    const bh = chartH * (d.value / yMax);
                    const bx = xOf(i) - barW / 2;
                    const by = yOf(d.value);
                    return (
                      <g key={i}>
                        <rect x={bx} y={by} width={barW} height={bh}
                          fill={d.color || '#E9C46A'} rx={2} />
                        {/* Value label on top */}
                        <text x={xOf(i)} y={by - 5} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#334155">
                          {d.value}{block.chartUnit && !block.chartYLabel ? block.chartUnit : ''}
                        </text>
                        {/* X label */}
                        <text x={xOf(i)} y={PAD_T + chartH + 14} textAnchor="middle" fontSize={11} fill="#334155">
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* X-axis arrow tip */}
                  <line x1={PAD_L} y1={PAD_T + chartH} x2={SVG_W - PAD_R + 8} y2={PAD_T + chartH} stroke="#94a3b8" strokeWidth={1.5} />
                  <polygon points={`${SVG_W - PAD_R + 8},${PAD_T + chartH - 4} ${SVG_W - PAD_R + 14},${PAD_T + chartH} ${SVG_W - PAD_R + 8},${PAD_T + chartH + 4}`} fill="#94a3b8" />
                  {/* X-axis label (e.g., "Năm") at end */}
                  {block.chartXLabel && (
                    <text x={SVG_W - PAD_R + 16} y={PAD_T + chartH + 4} textAnchor="start" fontSize={11} fontStyle="italic" fill="#334155">{block.chartXLabel}</text>
                  )}
                </svg>
              );
            };

            // ── SGK-style Horizontal Bar Chart ──
            const renderBarChart = () => {
              if (data.length === 0) return <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu</p>;
              const SVG_W = 480;
              const rowH = 36;
              const PAD_L = 100;
              const PAD_R = 60;
              const PAD_T = 8;
              const chartW = SVG_W - PAD_L - PAD_R;
              const SVG_H = PAD_T + data.length * rowH + 20;
              return (
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxHeight: 400 }}>
                  {data.map((d, i) => {
                    const bw = chartW * (d.value / max);
                    const by = PAD_T + i * rowH + rowH * 0.2;
                    const bh = rowH * 0.6;
                    return (
                      <g key={i}>
                        <text x={PAD_L - 8} y={by + bh / 2} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#334155">{d.label}</text>
                        <rect x={PAD_L} y={by} width={bw} height={bh} fill={d.color || '#6366F1'} rx={3} />
                        <text x={PAD_L + bw + 6} y={by + bh / 2} dominantBaseline="middle" fontSize={11} fontWeight="bold" fill="#334155">
                          {d.value}{block.chartUnit || ''}
                        </text>
                      </g>
                    );
                  })}
                  <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={SVG_H - 12} stroke="#94a3b8" strokeWidth={1.5} />
                  {block.chartYLabel && (
                    <text x={PAD_L + chartW / 2} y={SVG_H - 2} textAnchor="middle" fontSize={10} fill="#64748b" fontStyle="italic">{block.chartYLabel}</text>
                  )}
                </svg>
              );
            };

            // ── SGK-style Line Chart ──
            const renderLineChart = () => {
              if (data.length < 2) return <p className="text-slate-400 text-sm text-center py-8">Cần ít nhất 2 điểm dữ liệu</p>;
              const rawMax = max * 1.15;
              const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
              const niceStep = [1, 2, 2.5, 5, 10].map(f => f * magnitude).find(s => rawMax / s <= 6) || magnitude * 10;
              const yMax = Math.ceil(rawMax / niceStep) * niceStep;
              const yTicks: number[] = [];
              for (let v = 0; v <= yMax; v += niceStep) yTicks.push(v);

              const SVG_W = 480;
              const SVG_H = 260;
              const PAD_L = 58;
              const PAD_R = 16;
              const PAD_T = 28;
              const PAD_B = 44;
              const chartW = SVG_W - PAD_L - PAD_R;
              const chartH = SVG_H - PAD_T - PAD_B;
              const xOf = (i: number) => PAD_L + (i / (data.length - 1)) * chartW;
              const yOf = (v: number) => PAD_T + chartH * (1 - v / yMax);
              const lineColor = data[0]?.color || '#6366F1';
              const points = data.map((d, i) => `${xOf(i)},${yOf(d.value)}`).join(' ');

              return (
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxHeight: 320 }}>
                  {block.chartYLabel && (
                    <text x={12} y={PAD_T + chartH / 2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#334155"
                      transform={`rotate(-90, 12, ${PAD_T + chartH / 2})`}>{block.chartYLabel}</text>
                  )}
                  {yTicks.map((v, i) => (
                    <g key={i}>
                      <line x1={PAD_L} y1={yOf(v)} x2={SVG_W - PAD_R} y2={yOf(v)} stroke={v === 0 ? '#94a3b8' : '#e2e8f0'} strokeWidth={v === 0 ? 1.5 : 1} />
                      <text x={PAD_L - 6} y={yOf(v)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#64748b">{v}</text>
                    </g>
                  ))}
                  <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + chartH} stroke="#94a3b8" strokeWidth={1.5} />
                  <polyline fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinejoin="round" points={points} />
                  {data.map((d, i) => (
                    <g key={i}>
                      <circle cx={xOf(i)} cy={yOf(d.value)} r={5} fill={d.color || lineColor} stroke="white" strokeWidth={2} />
                      <text x={xOf(i)} y={yOf(d.value) - 10} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#334155">
                        {d.value}{block.chartUnit && !block.chartYLabel ? block.chartUnit : ''}
                      </text>
                      <text x={xOf(i)} y={PAD_T + chartH + 14} textAnchor="middle" fontSize={11} fill="#334155">{d.label}</text>
                    </g>
                  ))}
                  <line x1={PAD_L} y1={PAD_T + chartH} x2={SVG_W - PAD_R + 8} y2={PAD_T + chartH} stroke="#94a3b8" strokeWidth={1.5} />
                  <polygon points={`${SVG_W - PAD_R + 8},${PAD_T + chartH - 4} ${SVG_W - PAD_R + 14},${PAD_T + chartH} ${SVG_W - PAD_R + 8},${PAD_T + chartH + 4}`} fill="#94a3b8" />
                  {block.chartXLabel && (
                    <text x={SVG_W - PAD_R + 16} y={PAD_T + chartH + 4} textAnchor="start" fontSize={11} fontStyle="italic" fill="#334155">{block.chartXLabel}</text>
                  )}
                </svg>
              );
            };

            return (
              <div key={block.id} className="relative z-10 bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-indigo-100 shadow-[0_10px_30px_rgba(99,102,241,0.08)] mx-4 my-6">
                {block.title && (
                  <h3 className="font-black text-[#082F49] mb-4 text-lg">{block.title}</h3>
                )}
                {/* Y-axis unit label above chart */}
                {(block.chartYLabel || block.chartUnit) && (
                  <div className="text-xs text-slate-600 mb-1 pl-1 leading-tight">
                    {block.chartYLabel}
                    {block.chartUnit ? <span className="block">({block.chartUnit})</span> : null}
                  </div>
                )}

                {(chartType === 'column') && renderColumnChart()}
                {(chartType === 'bar') && renderBarChart()}
                {(chartType === 'line') && renderLineChart()}
                {chartType === 'pie' && (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <svg viewBox="-1 -1 2 2" className="w-48 h-48 -rotate-90 shrink-0">
                      {(() => {
                        let cumulative = 0;
                        return data.map((d, i) => {
                          const start = cumulative / total;
                          cumulative += d.value;
                          const end = cumulative / total;
                          const x1 = Math.cos(2 * Math.PI * start);
                          const y1 = Math.sin(2 * Math.PI * start);
                          const x2 = Math.cos(2 * Math.PI * end);
                          const y2 = Math.sin(2 * Math.PI * end);
                          const largeArc = end - start > 0.5 ? 1 : 0;
                          return (
                            <path key={i}
                              d={`M 0 0 L ${x1} ${y1} A 1 1 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={d.color || '#6366F1'}
                              stroke="white"
                              strokeWidth="0.02"
                            />
                          );
                        });
                      })()}
                    </svg>
                    <div className="flex-1 space-y-2">
                      {data.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-4 h-4 rounded shrink-0" style={{ background: d.color || '#6366F1' }} />
                          <span className="font-bold text-[#082F49] flex-1">{d.label}</span>
                          <span className="text-slate-500 font-mono">{d.value}{block.chartUnit} ({Math.round((d.value / total) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Caption & Source — SGK style */}
                {(block.chartCaption || block.chartSource) && (
                  <div className="mt-4 text-center space-y-0.5">
                    {block.chartCaption && (
                      <p className="text-sm font-bold text-[#334155] italic">{block.chartCaption}</p>
                    )}
                    {block.chartSource && (
                      <p className="text-xs text-slate-500 italic">{block.chartSource}</p>
                    )}
                  </div>
                )}
              </div>
            );
          }

          if (block.type === 'diagram') {
            return (
              <div key={block.id} className="relative z-10 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-teal-200 shadow-[0_10px_30px_rgba(20,184,166,0.1)] mx-4 my-6">
                {block.title && <h3 className="font-black text-teal-700 mb-3 flex items-center gap-3 text-xl"><span>🧩</span>{block.title}</h3>}
                {block.diagramImage && (
                  <div className="relative rounded-2xl overflow-hidden bg-slate-50 border border-teal-200">
                    <img src={block.diagramImage} alt={block.title || 'Sơ đồ'} className="w-full max-h-[500px] object-contain" />
                    {(block.diagramHotspots || []).map((h, i) => (
                      <div key={i}
                        className="absolute -ml-4 -mt-4 group cursor-pointer"
                        style={{ left: `${h.x}%`, top: `${h.y}%` }}
                      >
                        <div className="w-8 h-8 rounded-full bg-teal-500 text-white text-sm font-black flex items-center justify-center border-2 border-white shadow-lg hover:scale-125 transition-transform">
                          {i + 1}
                        </div>
                        {h.description && (
                          <div className="absolute left-10 top-0 w-56 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-teal-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            <p className="font-black text-teal-700 text-sm mb-1">{h.label}</p>
                            <p className="text-xs text-[#334155] leading-relaxed">{h.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Legend */}
                {(block.diagramHotspots?.length || 0) > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(block.diagramHotspots || []).map((h, i) => (
                      <div key={i} className="flex items-start gap-2 bg-teal-50 border border-teal-100 rounded-xl p-2">
                        <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="flex-1">
                          <p className="font-bold text-teal-700 text-sm">{h.label}</p>
                          {h.description && <p className="text-xs text-[#334155] mt-0.5">{h.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (block.type === 'compare') {
            const COL_PRESETS: Record<string, { bg: string; accent: string; text: string; bullet: string }> = {
              'Xanh dương': { bg: 'linear-gradient(135deg,#E0F2FE,#BAE6FD)', accent: '#0284C7', text: '#0C4A6E', bullet: '#0284C7' },
              'Xanh cyan':  { bg: 'linear-gradient(135deg,#CFFAFE,#A5F3FC)', accent: '#06B6D4', text: '#164E63', bullet: '#06B6D4' },
              'Xanh lá':    { bg: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', accent: '#16A34A', text: '#14532D', bullet: '#16A34A' },
              'Vàng':       { bg: 'linear-gradient(135deg,#FEF9C3,#FDE68A)', accent: '#D97706', text: '#78350F', bullet: '#D97706' },
              'Cam':        { bg: 'linear-gradient(135deg,#FEF3C7,#FDBA74)', accent: '#EA580C', text: '#7C2D12', bullet: '#EA580C' },
              'Hồng':       { bg: 'linear-gradient(135deg,#FFE4E6,#FECDD3)', accent: '#DB2777', text: '#831843', bullet: '#DB2777' },
              'Tím':        { bg: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', accent: '#7C3AED', text: '#3B0764', bullet: '#7C3AED' },
              'Đen':        { bg: 'linear-gradient(135deg,#1E293B,#334155)', accent: '#94A3B8', text: '#F8FAFC', bullet: '#94A3B8' },
              // fallback for old data
              'blue':   { bg: 'linear-gradient(135deg,#E0F2FE,#BAE6FD)', accent: '#0284C7', text: '#0C4A6E', bullet: '#0284C7' },
              'green':  { bg: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', accent: '#16A34A', text: '#14532D', bullet: '#16A34A' },
              'orange': { bg: 'linear-gradient(135deg,#FEF3C7,#FDBA74)', accent: '#EA580C', text: '#7C2D12', bullet: '#EA580C' },
              'rose':   { bg: 'linear-gradient(135deg,#FFE4E6,#FECDD3)', accent: '#DB2777', text: '#831843', bullet: '#DB2777' },
              'violet': { bg: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', accent: '#7C3AED', text: '#3B0764', bullet: '#7C3AED' },
              'amber':  { bg: 'linear-gradient(135deg,#FEF9C3,#FDE68A)', accent: '#D97706', text: '#78350F', bullet: '#D97706' },
            };
            const cols = block.compareColumns || [];
            // Group into pairs: [0,1], [2,3], ...
            const pairs: (typeof cols)[] = [];
            for (let i = 0; i < cols.length; i += 2) {
              pairs.push(cols.slice(i, i + 2));
            }
            return (
              <div key={block.id} className="relative z-10 mx-4 my-6 space-y-6">
                {block.title && (
                  <h3 className="font-black text-[#082F49] flex items-center gap-3 text-xl">
                    <span>⚖️</span>{block.title}
                  </h3>
                )}
                {pairs.map((pair, pi) => (
                  <div key={pi} className="flex gap-0 items-stretch rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(14,165,233,0.12)] border border-white">
                    {pair.map((col, ci) => {
                      const preset = COL_PRESETS[col.color || 'Xanh dương'] || COL_PRESETS['Xanh dương'];
                      const isLeft = ci === 0;
                      return (
                        <>
                          <div
                            key={ci}
                            className="flex-1 flex flex-col"
                            style={{ background: preset.bg }}
                          >
                            {/* Column header */}
                            <div
                              className="px-5 py-4 border-b-2"
                              style={{ borderColor: preset.accent }}
                            >
                              <h4 className="font-black text-lg" style={{ color: preset.text }}>
                                {col.title || `Cột ${pi * 2 + ci + 1}`}
                              </h4>
                            </div>
                            {/* Items */}
                            <ul className="px-5 py-4 space-y-2.5 flex-1">
                              {col.items.filter(i => i.trim()).map((it, ii) => (
                                <li key={ii} className="flex items-start gap-2.5 text-sm">
                                  <span className="font-black mt-0.5 shrink-0" style={{ color: preset.bullet }}>✓</span>
                                  <span className="text-[#334155] font-medium leading-relaxed">{it}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* VS divider between the two */}
                          {isLeft && pair.length === 2 && (
                            <div className="w-10 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm shrink-0 gap-1 py-4">
                              <div className="w-px flex-1 bg-slate-200" />
                              <span className="text-[10px] font-black text-slate-400 tracking-widest rotate-0 select-none">VS</span>
                              <div className="w-px flex-1 bg-slate-200" />
                            </div>
                          )}
                        </>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          }

          if (block.type === 'callout') {
            const variantStyles: Record<string, { bg: string; border: string; text: string; icon: JSX.Element; ring: string }> = {
              info:    { bg: 'bg-sky-50',     border: 'border-sky-400',     text: 'text-sky-800',     icon: <Icon icon="ph:info" width={40} color="#0084D1"/>, ring: 'bg-sky-400' },
              warning: { bg: 'bg-amber-50',   border: 'border-amber-400',   text: 'text-amber-800',   icon: <Icon icon="ph:warning" width={40} color="#BB4D00" />, ring: 'bg-amber-400' },
              danger:  { bg: 'bg-rose-50',    border: 'border-rose-400',    text: 'text-rose-800',    icon: <Icon icon="ph:warning-octagon" width={40} color="#EC003F" />, ring: 'bg-rose-400' },
              success: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-800', icon: <Icon icon="ph:check-circle" width={40} color="#009966" />, ring: 'bg-emerald-400' },
              tip:     { bg: 'bg-violet-50',  border: 'border-violet-400',  text: 'text-violet-800',  icon: <Icon icon="ph:lightbulb" width={40} color="#7F22FE" />, ring: 'bg-violet-400' },
            };
            const v = block.calloutVariant || 'info';
            const style = variantStyles[v];
            return (
              <div key={block.id} className={`relative z-10 ${style.bg} border-l-4 ${style.border} rounded-r-2xl p-6 mx-4 my-6 shadow-sm`}>
                <div className={`absolute left-0 top-6 w-1 h-12 ${style.ring} rounded-r-full`} />
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{style.icon}</span>
                  <div className="flex-1">
                    {block.title && <h4 className={`font-black ${style.text} text-lg mb-1`}>{block.title}</h4>}
                    {block.content && <p className={`${style.text} leading-relaxed font-medium whitespace-pre-wrap`}>{block.content}</p>}
                  </div>
                </div>
              </div>
            );
          }

          // ════════ PHASE 3 MODULES ════════

          if (block.type === 'timeline') {
            return (
              <div key={block.id} className="relative z-10 mx-4 my-6">
                {block.title && <h3 className="font-black text-purple-700 mb-4 flex items-center gap-3 text-xl"><span>⏳</span>{block.title}</h3>}
                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-300 via-purple-400 to-fuchsia-400" />
                  {(block.timelineEvents || []).map((ev, idx) => (
                    <div key={idx} className="relative mb-6 last:mb-0">
                      <div className="absolute -left-8 top-0 w-7 h-7 rounded-full bg-white border-4 border-purple-500 flex items-center justify-center text-sm shadow-md">
                        {ev.icon || '•'}
                      </div>
                      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-purple-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-3 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-black uppercase tracking-wider">{ev.date}</span>
                        </div>
                        <h4 className="font-black text-[#082F49] text-base">{ev.title}</h4>
                        {ev.description && <p className="text-sm text-[#334155] mt-1 leading-relaxed">{ev.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === 'groupActivity') {
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-lime-50 to-green-50 backdrop-blur-xl p-6 rounded-3xl border-2 border-lime-300 shadow-[0_10px_30px_rgba(132,204,22,0.1)] mx-4 my-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-black text-lime-800 flex items-center gap-3 text-xl">
                    <span>👥</span>{block.title || 'Hoạt động nhóm'}
                  </h3>
                </div>

                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left: info */}
                  <div className="flex-1 space-y-3">
                    {block.activityGoal && (
                      <div className="bg-white/80 rounded-xl p-3 border-l-4 border-lime-500">
                        <p className="text-xs font-black text-lime-700 uppercase tracking-widest mb-1">🎯 Mục tiêu</p>
                        <p className="text-[#082F49] font-medium">{block.activityGoal}</p>
                      </div>
                    )}
                    {(block.activitySteps?.length || 0) > 0 && (
                      <div className="bg-white/80 rounded-xl p-3">
                        <p className="text-xs font-black text-lime-700 uppercase tracking-widest mb-2">📋 Các bước</p>
                        <ol className="space-y-2">
                          {block.activitySteps!.filter(s => s.trim()).map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-6 h-6 rounded-full bg-lime-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                              <span className="text-[#334155] font-medium leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {block.activityOutput && (
                      <div className="bg-white/80 rounded-xl p-3 border-l-4 border-emerald-500">
                        <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">🎁 Sản phẩm cần đạt</p>
                        <p className="text-[#082F49] font-medium">{block.activityOutput}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: countdown timer */}
                  {block.activityDuration && (
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <p className="text-[10px] font-black text-lime-600 uppercase tracking-widest">⏱ Đếm ngược</p>
                      <GroupActivityTimer duration={block.activityDuration} />
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (block.type === 'openQuestion') {
            const shown = !!openAnswerShown[block.id];
            return (
              <div
                key={block.id}
                className="preview-media-action relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl border border-cyan-200 shadow-[0_10px_30px_rgba(6,182,212,0.12)] mx-4 overflow-hidden"
                data-type="openQuestion"
                data-questionimage={block.questionImage || ''}
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-500 to-sky-400 px-6 py-3">
                  <span className="text-white font-black text-sm">✍️ Tự luận</span>
                </div>

                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-[#082F49] text-xl leading-snug">{block.question || '(Chưa có câu hỏi)'}</h3>

                  <textarea
                    placeholder={block.questionType === 'long' ? 'Nhập bài làm chi tiết của em...' : 'Nhập câu trả lời...'}
                    rows={block.questionType === 'long' ? 8 : 3}
                    className="w-full bg-slate-50/60 border-2 border-cyan-200 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 text-[#334155] font-medium leading-relaxed resize-none"
                  />

                  {/* Reveal answer button */}
                  {block.openAnswer && (
                    <div>
                      <button
                        onClick={() => setOpenAnswerShown(prev => ({ ...prev, [block.id]: !prev[block.id] }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
                          shown
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                        }`}
                      >
                        <span>{shown ? '🔒' : '🔓'}</span>
                        {shown ? 'Ẩn đáp án' : 'Xem đáp án'}
                      </button>

                      {shown && (
                        <div className="mt-3 p-4 rounded-2xl bg-emerald-50 border-l-4 border-emerald-500 animate-in slide-in-from-bottom-2 fade-in duration-300">
                          <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">💬 Đáp án gợi ý</p>
                          <p className="text-[#334155] leading-relaxed font-medium whitespace-pre-wrap">{block.openAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (block.type === 'fillBlank') {
            const template = block.blankTemplate || '';
            const parts = template.split(/(\{\{\d+\}\})/g);
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-yellow-50 to-amber-50 backdrop-blur-xl p-6 rounded-3xl border-2 border-amber-300 shadow-[0_10px_30px_rgba(245,158,11,0.1)] mx-4 my-6">
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3">✏️ Điền vào chỗ trống</p>
                <div className="text-lg text-[#082F49] font-medium leading-loose">
                  {parts.map((p, i) => {
                    const match = p.match(/\{\{(\d+)\}\}/);
                    if (match) {
                      const idx = parseInt(match[1]);
                      return (
                        <input
                          key={i}
                          type="text"
                          data-answer-idx={idx}
                          placeholder="..."
                          className="inline-block mx-1 px-3 py-1 bg-white border-b-2 border-amber-400 outline-none focus:border-amber-600 text-amber-700 font-bold text-center min-w-[80px] max-w-[150px]"
                        />
                      );
                    }
                    return <span key={i}>{p}</span>;
                  })}
                </div>
                {(block.blankAnswers?.length || 0) > 0 && (
                  <details className="mt-4 pt-3 border-t border-amber-200">
                    <summary className="text-xs font-bold text-amber-600 cursor-pointer hover:text-amber-800">✓ Xem đáp án</summary>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {block.blankAnswers!.map((a, i) => (
                        <span key={i} className="px-3 py-1 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 text-sm font-bold">
                          <span className="text-amber-500 mr-1">{i + 1}.</span>{a}
                        </span>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          }

          if (block.type === 'quote') {
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-stone-50 to-zinc-50 border-l-4 border-stone-400 rounded-r-2xl p-8 mx-4 my-8">
                <div className="absolute -top-2 left-4 text-7xl text-stone-300 font-serif leading-none select-none">&ldquo;</div>
                <blockquote className="text-xl italic text-[#334155] leading-relaxed font-medium relative z-10">
                  {block.quoteText}
                </blockquote>
                {(block.quoteAuthor || block.quoteSource) && (
                  <footer className="mt-4 text-right">
                    {block.quoteAuthor && <p className="font-black text-stone-700">— {block.quoteAuthor}</p>}
                    {block.quoteSource && <p className="text-xs text-stone-500 italic mt-0.5">{block.quoteSource}</p>}
                  </footer>
                )}
              </div>
            );
          }

          if (block.type === 'glossary') {
            return (
              <div key={block.id} className="relative z-10 mx-4 my-6">
                <h3 className="font-black text-fuchsia-700 mb-4 flex items-center gap-3 text-xl"><span>📖</span>Từ vựng địa lý</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(block.glossaryTerms || []).map((t, idx) => (
                    <div key={idx} className="bg-white/90 backdrop-blur-md border border-fuchsia-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="font-black text-fuchsia-700 text-base mb-1">{t.term}</h4>
                      <p className="text-sm text-[#334155] leading-relaxed">{t.definition}</p>
                      {t.example && (
                        <div className="mt-2 pt-2 border-t border-fuchsia-100">
                          <p className="text-xs text-fuchsia-500 italic">Ví dụ: {t.example}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === 'twoColumn') {
            const renderSide = (col?: typeof block.twoColumnLeft) => {
              if (!col) return <div className="text-slate-400 text-sm italic">(Chưa có nội dung)</div>;
              return (
                <div className="space-y-2">
                  {col.type === 'image' ? (
                    col.content ? (
                      <img src={col.content} alt={col.caption || ''} className="w-full rounded-xl border border-slate-200 max-h-[400px] object-cover" />
                    ) : (
                      <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm">Chưa có ảnh</div>
                    )
                  ) : (
                    <p className="text-[#334155] leading-relaxed font-medium whitespace-pre-wrap">{col.content}</p>
                  )}
                  {col.caption && <p className="text-xs text-slate-500 italic text-center">{col.caption}</p>}
                </div>
              );
            };
            return (
              <div key={block.id} className="relative z-10 mx-4 my-6">
                {block.title && <h3 className="font-black text-[#082F49] mb-4 text-xl">{block.title}</h3>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200">
                  <div>{renderSide(block.twoColumnLeft)}</div>
                  <div>{renderSide(block.twoColumnRight)}</div>
                </div>
              </div>
            );
          }

          if (block.type === 'gallery') {
            const images = block.galleryImages || [];
            const isPanel = block.galleryDisplayMode === 'panel';
            const imageUrls = images.map((img: { url: string; caption?: string }) => img.url).filter(Boolean);

            if (isPanel) {
              // Panel mode: trigger right-side ImageSlider via scroll mechanism
              return (
                <div
                  key={block.id}
                  className="preview-media-action relative z-10 mx-4 my-8"
                  data-type="gallery"
                  data-imageurls={JSON.stringify(imageUrls)}
                >
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-rose-200 shadow-[0_10px_30px_rgba(244,63,94,0.1)] px-6 py-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-2xl shrink-0">🖼️</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-[#082F49] text-base">{block.title || 'Bộ ảnh'}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">{images.length} ảnh — hiển thị ở khung phải</p>
                    </div>
                    {/* Mini thumbnail strip */}
                    <div className="flex gap-1 shrink-0">
                      {imageUrls.slice(0, 3).map((url: string, i: number) => (
                        <div key={i} className="w-10 h-10 rounded-lg overflow-hidden border border-rose-100 bg-slate-100">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {imageUrls.length > 3 && (
                        <div className="w-10 h-10 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-[10px] font-black text-rose-600">
                          +{imageUrls.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Inline mode: grid layout
            return (
              <div key={block.id} className="relative z-10 mx-4 my-6">
                {block.title && <h3 className="font-black text-rose-700 mb-4 flex items-center gap-3 text-xl"><span>🖼️</span>{block.title}</h3>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img: { url: string; caption?: string }, idx: number) => (
                    <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="group block bg-white border border-rose-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
                      <div className="aspect-square bg-slate-100 overflow-hidden">
                        {img.url && <img src={img.url} alt={img.caption || `Ảnh ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                      </div>
                      {img.caption && (
                        <div className="px-3 py-2 text-xs text-[#334155] font-medium italic">{img.caption}</div>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            );
          }

          if (block.type === 'summary') {
            const hasSections = (block.summarySections?.length || 0) > 0 &&
              block.summarySections!.some((s: { title: string; body: string }) => s.title.trim() || s.body.trim());

            return (
              <div key={block.id} className="relative z-10 mx-4 my-8">
                <div className="bg-gradient-to-br from-sky-50 to-cyan-50 backdrop-blur-xl rounded-3xl border-2 border-sky-300 shadow-[0_10px_30px_rgba(14,165,233,0.15)] overflow-hidden">
                  {/* Header bar */}
                  <div className="flex items-center gap-3 px-7 py-5 border-b border-sky-200/60">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">📋</div>
                    <h3 className="font-black text-sky-800 text-2xl">{block.title || 'Em đã học được gì?'}</h3>
                  </div>

                  {/* Body area — two columns if image present */}
                  <div className={`flex gap-0 ${block.summaryImage ? 'flex-col md:flex-row' : ''}`}>
                    {/* Content column */}
                    <div className="flex-1 px-7 py-5 space-y-5 min-w-0">
                      {block.content && (
                        <p className="text-[#334155] italic leading-relaxed border-l-4 border-sky-300 pl-4">{block.content}</p>
                      )}

                      {hasSections ? (
                        // New structured sections
                        <div className="space-y-5">
                          {block.summarySections!
                            .filter((s: { title: string; body: string }) => s.title.trim() || s.body.trim())
                            .map((sec: { title: string; body: string }, si: number) => (
                              <div key={si} className="bg-white/80 rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
                                {sec.title && (
                                  <div className="flex items-center gap-3 px-4 py-3 bg-sky-500/10 border-b border-sky-100">
                                    <span className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center shrink-0">{si + 1}</span>
                                    <h4 className="font-black text-sky-800 text-base">{sec.title}</h4>
                                  </div>
                                )}
                                {sec.body && (
                                  <div
                                    className="px-5 py-3 text-sm text-[#334155] leading-relaxed summary-rich-body"
                                    dangerouslySetInnerHTML={{ __html: sec.body }}
                                  />
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        // Fallback: old flat items list
                        <ul className="space-y-2">
                          {(block.items || []).filter((i: string) => i.trim()).map((item: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 bg-white/80 rounded-xl px-4 py-3 border border-sky-100 shadow-sm">
                              <span className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                              <span className="text-[#082F49] font-medium leading-relaxed flex-1">{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Optional image panel */}
                    {block.summaryImage && (
                      <div className="md:w-64 shrink-0 flex items-stretch">
                        <div className="w-full relative min-h-[200px]">
                          <img
                            src={block.summaryImage}
                            alt="Minh họa"
                            className="w-full h-full object-cover"
                            style={{ minHeight: '200px' }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-sky-50/30 pointer-events-none" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (block.type === 'practice') {
            const items = (block.practiceItems || []).filter((it: { text: string; icon?: string }) => it.text?.trim());
            return (
              <div key={block.id} className="relative z-10 mx-4 my-8">
                {/* Card with warm amber background */}
                <div className="relative bg-gradient-to-br from-[#FEF9C3] to-[#FDE68A] rounded-3xl border-2 border-amber-300 shadow-[0_8px_32px_rgba(217,119,6,0.18)] overflow-visible pt-6 pb-6 px-6">

                  {/* Decorative badge — top-left sticker */}
                  <div className="absolute -top-5 -left-2 z-10">
                    <div className="relative bg-gradient-to-br from-amber-400 to-orange-400 text-white px-4 py-2 rounded-2xl shadow-lg border-2 border-white rotate-[-3deg]">
                      <div className="font-black text-sm leading-tight text-center" style={{ fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
                        <div>Luyện tập</div>
                        <div className="text-[11px] font-bold opacity-90">và Vận dụng</div>
                      </div>
                      {/* Small circle decoration */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-400 rounded-full border-2 border-white" />
                    </div>
                  </div>

                  {/* Optional custom title */}
                  {block.title && block.title !== 'Luyện tập và Vận dụng' && (
                    <h3 className="font-black text-amber-900 text-xl mb-4 mt-2">{block.title}</h3>
                  )}

                  {/* Items */}
                  <div className="mt-4 space-y-4">
                    {items.map((item: { text: string; icon?: string }, idx: number) => (
                      <div key={idx} className="flex items-start gap-4">
                        {/* Number */}
                        <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md border-2 border-white">
                          {idx + 1}
                        </div>
                        {/* Text */}
                        <p className="text-[#334155] font-semibold leading-relaxed text-base flex-1 pt-1">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          }

          if (block.type === 'mapAction') {
            return (
              <div
                key={block.id}
                className="preview-media-action relative z-10 my-16"
                data-type="mapAction"
                data-lat={block.lat}
                data-lng={block.lng}
                data-zoom={block.zoom}
                data-showgrid={block.showGrid ? 'true' : 'false'}
                data-annotationpreset={block.annotationPreset || (block.showAnnotations ? 'latlng' : 'none')}
                data-showpin={block.showPin ? 'true' : 'false'}
                data-pintitle={block.pinTitle}
                data-pininfo={block.pinInfo}
                data-pinimage={block.pinImage}
                data-globestyle={block.globeStyle || 'blue-marble'}
              >
                <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-cyan-400 text-[#06B6D4] text-xs font-black uppercase tracking-[0.2em] text-center w-fit mx-auto shadow-[0_5px_20px_rgba(6,182,212,0.2)]">
                  📍 {block.description}
                </div>
              </div>
            );
          }

          return null;
        })}

        <div className="text-center pt-24 pb-12 opacity-70">
            <span className="text-[#94A3B8] text-sm font-bold uppercase tracking-widest">Hết bài giảng</span>
            <div className="w-1 h-16 bg-[#CBD5E1] mx-auto mt-4 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* RIGHT: GLOBE & MEDIA BACKGROUND */}
      <div className="right-panel-preview w-full flex flex-col p-2 lg:p-0 relative shrink-0 z-10 bg-white/40 lg:bg-[#0a1628] backdrop-blur-3xl lg:backdrop-blur-none border-t lg:border-0 border-white/80 rounded-t-[24px] lg:rounded-none">
        
        {/* MAC OS STYLE HEADER (Mobile Only) */}
        <div className="flex lg:hidden items-center justify-between mb-2 bg-white/80 backdrop-blur-md rounded-xl p-2 border border-white/60 shadow-sm shrink-0">
          <h3 className="font-black text-[#082F49] uppercase tracking-widest text-[10px]">Mô phỏng Đa phương tiện</h3>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-inner"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-inner"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-inner"></div>
          </div>
        </div>

        {/* DEVICE MOCKUP CONTAINER */}
        <div className="flex-1 flex flex-col items-center justify-center relative rounded-xl lg:rounded-none overflow-hidden border-4 lg:border-0 border-white/80 lg:border-transparent shadow-[0_20px_50px_rgba(14,165,233,0.2)] lg:shadow-none bg-[#082F49] pointer-events-none w-full h-full">
          <div className="pointer-events-auto w-full h-full relative">

            {/* LAYER 1: CESIUM GLOBE */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${(!activeMediaBlock || activeMediaBlock.type === 'mapAction') ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <CesiumGlobe
                ref={globeRef}
                imageryLayer={
                  activeMediaBlock?.globeStyle ||
                  (blocks.find(b => b.globeStyle)?.globeStyle) ||
                  'Sentinel-2'
                }
                showGrid={activeMediaBlock?.grid || false}
                showLayerPicker={false}
                annotations={ANNOTATION_PRESETS[activeMediaBlock?.annotationPreset || 'none'] || []}
                onPinClick={(pin) => setSelectedPin(pin)}
              />
            </div>

            {/* LAYER 2: IMAGE SCENARIO + OPEN QUESTION + GALLERY PANEL */}
            <div className={`absolute inset-0 bg-transparent transition-all duration-500 ease-in-out ${
              activeMediaBlock?.type === 'imageScenario' ||
              (activeMediaBlock?.type === 'openQuestion' && activeMediaBlock.questionImage) ||
              (activeMediaBlock?.type === 'gallery' && (activeMediaBlock.imageUrls?.length || 0) > 0)
                ? 'opacity-100 translate-x-0 z-20 pointer-events-auto'
                : 'opacity-0 translate-x-full z-0 pointer-events-none'
            }`}>
              <ImageSlider urls={
                activeMediaBlock?.type === 'openQuestion'
                  ? (activeMediaBlock.questionImage ? [activeMediaBlock.questionImage] : [])
                  : activeMediaBlock?.type === 'gallery'
                    ? (activeMediaBlock.imageUrls || [])
                    : (activeMediaBlock?.imageUrls || (activeMediaBlock?.imageUrl ? [activeMediaBlock.imageUrl] : []))
              } />
            </div>

          </div>


          {/* HIỂN THỊ POPUP THÔNG TIN KHI BẤM VÀO GHIM */}
          {selectedPin && (
            <div className="absolute z-50 bg-white/80 backdrop-blur-xl p-4 lg:p-6 rounded-3xl border border-white shadow-[0_20px_50px_rgba(14,165,233,0.3)] w-11/12 max-w-sm pointer-events-auto left-1/2 -translate-x-1/2 top-4 lg:left-auto lg:-translate-x-0 lg:right-8 lg:top-1/2 lg:-translate-y-1/2 animate-in slide-in-from-right fade-in">
              <button onClick={() => setSelectedPin(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full font-bold">✕</button>
              {selectedPin.image && (
                <div className="w-full h-40 bg-slate-200 rounded-xl mb-4 overflow-hidden">
                  <img src={selectedPin.image} alt={selectedPin.title} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="font-black text-2xl text-[#082F49] mb-2">{selectedPin.title}</h3>
              <p className="text-[#334155] leading-relaxed text-sm font-medium">{selectedPin.info}</p>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .left-panel-preview {
          height: 55vh;
          flex: none;
        }
        .right-panel-preview {
          height: 45vh;
          flex: none;
        }
        @media (min-width: 1024px) {
          .left-panel-preview {
            height: 100% !important;
            width: 60% !important;
            max-width: 60% !important;
            flex: none !important;
          }
          .right-panel-preview {
            height: 100% !important;
            width: 40% !important;
            flex: none !important;
          }
        }
        /* Rich text body inside summary sections */
        .summary-rich-body h1,.summary-rich-body h2,.summary-rich-body h3,.summary-rich-body h4 {
          font-weight: 900; color: #082F49; margin-top: 0.75em; margin-bottom: 0.25em;
        }
        .summary-rich-body h2 { font-size: 1.05rem; }
        .summary-rich-body h3 { font-size: 0.95rem; }
        .summary-rich-body h4 { font-size: 0.875rem; }
        .summary-rich-body p  { margin: 0.25em 0; }
        .summary-rich-body ul { list-style: none; padding: 0; margin: 0.25em 0; }
        .summary-rich-body ul li { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0.2em 0; }
        .summary-rich-body ul li::before { content: "▸"; color: #0284C7; font-weight: 900; font-size: 0.7rem; margin-top: 0.2rem; flex-shrink: 0; }
        .summary-rich-body ol { padding-left: 1.4em; margin: 0.25em 0; }
        .summary-rich-body ol li { margin: 0.2em 0; }
        .summary-rich-body strong { font-weight: 800; color: #082F49; }
        .summary-rich-body em { font-style: italic; }
        .summary-rich-body u  { text-decoration: underline; text-decoration-color: #0284C7; }
      `}} />
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
