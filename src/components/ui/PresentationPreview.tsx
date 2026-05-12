'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });

import type { StoryBlock } from '@/types/presentation';

function DataTablePreview({ block }: { block: StoryBlock }) {
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const headers = block.tableHeaders || [];
  const rawRows = block.tableRows || [];
  const highlightCol = block.tableHighlightCol ?? 1;

  // Sort rows
  const rows = sortCol !== null
    ? [...rawRows].sort((a, b) => {
      const va = parseFloat(a[sortCol]?.replace(/[^0-9.-]/g, '')) || 0;
      const vb = parseFloat(b[sortCol]?.replace(/[^0-9.-]/g, '')) || 0;
      const sv = va === 0 && vb === 0 ? (a[sortCol] || '').localeCompare(b[sortCol] || '') : va - vb;
      return sortAsc ? sv : -sv;
    })
    : rawRows;

  // Find max in highlight col for bar width
  const numericValues = rows.map(r => parseFloat((r[highlightCol] || '0').replace(/[^0-9.-]/g, '')) || 0);
  const maxVal = Math.max(...numericValues, 1);

  const handleSort = (ci: number) => {
    if (sortCol === ci) setSortAsc(!sortAsc);
    else { setSortCol(ci); setSortAsc(false); }
  };

  return (
    <div className="relative z-10 mx-4 my-8">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-violet-200 shadow-[0_10px_40px_rgba(139,92,246,0.12)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-4 flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="font-black text-white text-xl">{block.tableTitle || 'Bảng số liệu'}</h3>
            {block.tableUnit && <p className="text-violet-200 text-xs font-medium mt-0.5">Đơn vị: {block.tableUnit}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <span className="text-white text-xs font-bold">Nhấn tiêu đề cột để sắp xếp</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-violet-50 border-b-2 border-violet-100">
                <th className="px-4 py-3 text-left text-xs font-black text-violet-400 uppercase tracking-wider w-8">#</th>
                {headers.map((h, ci) => (
                  <th
                    key={ci}
                    onClick={() => handleSort(ci)}
                    className="px-4 py-3 text-left cursor-pointer hover:bg-violet-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-black ${ci === highlightCol ? 'text-violet-700' : 'text-[#082F49]'}`}>{h}</span>
                      <span className="text-violet-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortCol === ci ? (sortAsc ? '↑' : '↓') : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const numVal = parseFloat((row[highlightCol] || '0').replace(/[^0-9.-]/g, '')) || 0;
                const barPct = Math.round((numVal / maxVal) * 100);
                const isHovered = hoveredRow === ri;
                const isHighlightedRow = block.tableHighlightRow === ri;
                return (
                  <tr
                    key={ri}
                    onMouseEnter={() => setHoveredRow(ri)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`border-b border-violet-50 transition-all duration-200 ${
                      isHighlightedRow ? 'bg-amber-50 ring-2 ring-amber-300 ring-inset' :
                      isHovered ? 'bg-violet-50' :
                      ri % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'
                    }`}
                  >
                    <td className={`px-4 py-3 text-xs font-bold ${isHighlightedRow ? 'text-amber-600' : 'text-violet-300'}`}>
                      {isHighlightedRow ? '⭐' : ri + 1}
                    </td>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3">
                        {ci === highlightCol ? (
                          <div className="flex items-center gap-3">
                            <span className={`font-black text-base min-w-[60px] ${isHighlightedRow ? 'text-amber-700' : 'text-violet-700'}`}>{cell}</span>
                            <div className={`flex-1 rounded-full h-2.5 overflow-hidden ${isHighlightedRow ? 'bg-amber-100' : 'bg-violet-100'}`}>
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${isHighlightedRow ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-violet-500 to-purple-400'}`}
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-8 text-right ${isHighlightedRow ? 'text-amber-500' : 'text-violet-400'}`}>{barPct}%</span>
                          </div>
                        ) : (
                          <span className={`font-medium ${isHighlightedRow ? 'text-amber-900 font-bold' : isHovered ? 'text-[#082F49] font-bold' : 'text-[#334155]'}`}>{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-violet-50 px-6 py-3 flex items-center justify-between gap-2 text-xs text-violet-400 font-medium border-t border-violet-100 flex-wrap">
          <span className="flex items-center gap-2">
            <span>📌</span>
            <span>{rows.length} mục dữ liệu • Cột "{headers[highlightCol]}" hiển thị thanh phần trăm</span>
          </span>
          {block.tableSource && (
            <span className="text-violet-500 italic">Nguồn: {block.tableSource}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageSlider({ urls }: { urls: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [urls.join(',')]);

  if (!urls || urls.length === 0) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
      <span className="text-6xl mb-4">🖼️</span>
      <span className="text-xl font-bold">Chưa có hình ảnh minh họa</span>
    </div>
  );

  return (
    <div className="w-full h-full relative group bg-slate-50/50 flex items-center justify-center p-8 backdrop-blur-sm">
      <img
        src={urls[currentIndex]}
        alt="Minh họa tình huống"
        className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-2xl transition-all duration-500 animate-in fade-in zoom-in-95"
        key={currentIndex} // force re-render for animation
      />
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex(prev => prev === 0 ? urls.length - 1 : prev - 1)}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white text-[#082F49] text-xl font-bold rounded-full shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-auto border border-slate-100 hover:scale-110"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentIndex(prev => prev === urls.length - 1 ? 0 : prev + 1)}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white text-[#082F49] text-xl font-bold rounded-full shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-auto border border-slate-100 hover:scale-110"
          >
            →
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm pointer-events-auto">
            {urls.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2.5 rounded-full transition-all ${idx === currentIndex ? 'bg-emerald-500 w-8' : 'bg-slate-400 w-2.5 hover:bg-slate-500'}`}
              />
            ))}
          </div>
        </>
      )}
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
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({}); // blockId -> selected index
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
          let minDistance = Infinity;

          const containerRect = container.getBoundingClientRect();
          const centerY = containerRect.top + containerRect.height / 2;

          for (let i = 0; i < mapActionElements.length; i++) {
            const el = mapActionElements[i];
            const rect = el.getBoundingClientRect();
            // Center of the element
            const elCenterY = rect.top + rect.height / 2;
            const distance = Math.abs(elCenterY - centerY);

            if (distance < minDistance) {
              minDistance = distance;
              activeEl = el;
            }
          }

          if (activeEl) {
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
            }
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
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-r from-cyan-50 to-transparent p-6 rounded-2xl border-l-4 border-[#06B6D4]">
                <h2 className={`font-black text-[#082F49] ${block.level === 1 ? 'text-5xl leading-tight' : block.level === 2 ? 'text-3xl text-cyan-700' : 'text-2xl text-cyan-600'}`}>
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
                  🎯 Yêu cầu cần đạt:
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
                <div
                  className="text-[#334155] text-lg leading-relaxed font-medium [&_b]:font-black [&_strong]:font-black [&_i]:italic [&_em]:italic [&_u]:underline [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2 [&_li]:my-1 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-cyan-700 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-black [&_h3]:text-cyan-600 [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-slate-700 [&_h4]:mt-3 [&_h4]:mb-1"
                  dangerouslySetInnerHTML={{ __html: block.content || '' }}
                />
              </div>
            );
          }

          if (block.type === 'dataTable') {
            return <DataTablePreview key={block.id} block={block} />;
          }

          if (block.type === 'quiz') {
            const selectedIdx = quizAnswers[block.id];
            const hasAnswered = selectedIdx !== undefined;
            const isCorrect = selectedIdx === block.correctIndex;

            return (
              <div key={block.id} className="relative z-10 bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-orange-200 shadow-[0_10px_30px_rgba(249,115,22,0.1)] mx-4">
                <h3 className="font-bold text-[#082F49] mb-4 text-xl drop-shadow-sm">❓ {block.question}</h3>

                {/* Question image */}
                {block.questionImage && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-orange-100 bg-slate-50 max-h-[300px] flex items-center justify-center">
                    <img src={block.questionImage} alt="Câu hỏi" className="max-w-full max-h-[300px] object-contain" />
                  </div>
                )}

                <div className="space-y-3">
                  {block.options?.map((opt, idx) => {
                    const isSelected = selectedIdx === idx;
                    const isCorrectOpt = idx === block.correctIndex;

                    let optClass = "w-full text-left p-4 rounded-xl border font-bold text-lg transition-all shadow-sm ";
                    if (!hasAnswered) {
                      optClass += "bg-slate-50/50 hover:bg-orange-100 border-slate-200 hover:border-orange-400 text-[#334155] cursor-pointer";
                    } else if (isCorrectOpt) {
                      optClass += "bg-green-100 border-green-400 text-green-800";
                    } else if (isSelected && !isCorrectOpt) {
                      optClass += "bg-red-100 border-red-400 text-red-700";
                    } else {
                      optClass += "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => !hasAnswered && setQuizAnswers(prev => ({ ...prev, [block.id]: idx }))}
                        className={optClass}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
                            ${!hasAnswered ? 'bg-orange-100 text-orange-600' : isCorrectOpt ? 'bg-green-500 text-white' : isSelected ? 'bg-red-400 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            {hasAnswered && isCorrectOpt ? '✓' : hasAnswered && isSelected && !isCorrectOpt ? '✕' : String.fromCharCode(65 + idx)}
                          </span>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation - chỉ hiện sau khi đã trả lời */}
                {hasAnswered && block.explanation && (
                  <div className={`mt-5 p-4 rounded-2xl border-l-4 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'} animate-in slide-in-from-bottom-2 fade-in duration-500`}>
                    <p className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                      <span>💡</span> {isCorrect ? 'Chính xác! Giải thích:' : 'Chưa đúng. Giải thích:'}
                    </p>
                    <p className="text-[#334155] text-base leading-relaxed font-medium">{block.explanation}</p>
                  </div>
                )}
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
            const chartType = block.chartType || 'bar';

            return (
              <div key={block.id} className="relative z-10 bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-indigo-200 shadow-[0_10px_30px_rgba(99,102,241,0.1)] mx-4 my-6">
                {block.title && (
                  <h3 className="font-black text-indigo-700 mb-1 flex items-center gap-3 text-xl"><span>📈</span>{block.title}</h3>
                )}
                {(block.chartXLabel || block.chartYLabel || block.chartUnit) && (
                  <p className="text-xs text-slate-500 mb-4">
                    {block.chartXLabel}{block.chartYLabel ? ` × ${block.chartYLabel}` : ''}{block.chartUnit ? ` (${block.chartUnit})` : ''}
                  </p>
                )}

                {chartType === 'bar' && (
                  <div className="space-y-3">
                    {data.map((d, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-24 text-sm font-bold text-[#082F49] text-right shrink-0 truncate">{d.label}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden relative">
                          <div
                            className="h-full rounded-full transition-all duration-1000 flex items-center justify-end px-2"
                            style={{ width: `${(d.value / max) * 100}%`, background: d.color || '#6366F1' }}
                          >
                            <span className="text-xs font-black text-white">{d.value}{block.chartUnit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {chartType === 'line' && (
                  <div className="relative w-full h-64 bg-slate-50 rounded-xl p-4">
                    <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="2"
                        points={data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * 380 + 10},${190 - (d.value / max) * 170}`).join(' ')}
                      />
                      {data.map((d, i) => (
                        <circle key={i}
                          cx={(i / Math.max(data.length - 1, 1)) * 380 + 10}
                          cy={190 - (d.value / max) * 170}
                          r="4"
                          fill={d.color || '#6366F1'}
                        />
                      ))}
                    </svg>
                    <div className="flex justify-between mt-2 text-xs text-slate-500 font-medium">
                      {data.map((d, i) => <span key={i} className="truncate">{d.label}</span>)}
                    </div>
                  </div>
                )}

                {chartType === 'pie' && (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <svg viewBox="-1 -1 2 2" className="w-48 h-48 -rotate-90">
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
            const colorMap: Record<string, string> = {
              blue:   'from-blue-50 to-cyan-50 border-blue-200 text-blue-700',
              green:  'from-emerald-50 to-green-50 border-emerald-200 text-emerald-700',
              orange: 'from-orange-50 to-amber-50 border-orange-200 text-orange-700',
              rose:   'from-rose-50 to-pink-50 border-rose-200 text-rose-700',
              violet: 'from-violet-50 to-purple-50 border-violet-200 text-violet-700',
              amber:  'from-amber-50 to-yellow-50 border-amber-200 text-amber-700',
            };
            return (
              <div key={block.id} className="relative z-10 mx-4 my-6">
                {block.title && <h3 className="font-black text-[#082F49] mb-4 flex items-center gap-3 text-xl"><span>⚖️</span>{block.title}</h3>}
                <div className={`grid gap-4 ${(block.compareColumns?.length || 2) >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                  {(block.compareColumns || []).map((col, ci) => {
                    const styleClass = colorMap[col.color || 'blue'] || colorMap.blue;
                    return (
                      <div key={ci} className={`bg-gradient-to-br ${styleClass} border-2 rounded-2xl p-5 shadow-sm`}>
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-current/20">
                          <span className="text-3xl">{col.icon || '•'}</span>
                          <h4 className="font-black text-lg">{col.title}</h4>
                        </div>
                        <ul className="space-y-2">
                          {col.items.filter(i => i.trim()).map((it, ii) => (
                            <li key={ii} className="flex items-start gap-2 text-sm">
                              <span className="text-current font-black mt-0.5">✓</span>
                              <span className="text-[#334155] font-medium leading-relaxed">{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (block.type === 'callout') {
            const variantStyles: Record<string, { bg: string; border: string; text: string; icon: string; ring: string }> = {
              info:    { bg: 'bg-sky-50',     border: 'border-sky-400',     text: 'text-sky-800',     icon: 'ℹ️', ring: 'bg-sky-400' },
              warning: { bg: 'bg-amber-50',   border: 'border-amber-400',   text: 'text-amber-800',   icon: '⚠️', ring: 'bg-amber-400' },
              danger:  { bg: 'bg-rose-50',    border: 'border-rose-400',    text: 'text-rose-800',    icon: '🚨', ring: 'bg-rose-400' },
              success: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-800', icon: '✅', ring: 'bg-emerald-400' },
              tip:     { bg: 'bg-violet-50',  border: 'border-violet-400',  text: 'text-violet-800',  icon: '💡', ring: 'bg-violet-400' },
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
                  {block.activityDuration && (
                    <span className="px-3 py-1 rounded-full bg-lime-500 text-white text-xs font-black flex items-center gap-1.5">
                      <span>⏱️</span>{block.activityDuration}
                    </span>
                  )}
                </div>
                {block.activityGoal && (
                  <div className="bg-white/80 rounded-xl p-3 mb-3 border-l-4 border-lime-500">
                    <p className="text-xs font-black text-lime-700 uppercase tracking-widest mb-1">🎯 Mục tiêu</p>
                    <p className="text-[#082F49] font-medium">{block.activityGoal}</p>
                  </div>
                )}
                {(block.activitySteps?.length || 0) > 0 && (
                  <div className="bg-white/80 rounded-xl p-3 mb-3">
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
            );
          }

          if (block.type === 'openQuestion') {
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-cyan-50 to-blue-50 backdrop-blur-xl p-6 rounded-3xl border border-cyan-200 shadow-[0_10px_30px_rgba(6,182,212,0.1)] mx-4 my-6">
                <h3 className="font-black text-cyan-800 mb-4 flex items-center gap-3 text-xl">
                  <span>✍️</span>{block.question || '(Chưa có câu hỏi)'}
                </h3>
                <textarea
                  placeholder={block.questionType === 'long' ? 'Nhập bài làm chi tiết của em...' : 'Nhập câu trả lời...'}
                  rows={block.questionType === 'long' ? 8 : 3}
                  className="w-full bg-white border-2 border-cyan-200 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 text-[#334155] font-medium leading-relaxed"
                />
                {(block.expectedKeywords?.length || 0) > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs font-bold text-cyan-600 cursor-pointer hover:text-cyan-800">💡 Gợi ý từ khóa</summary>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {block.expectedKeywords!.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-bold">{kw}</span>
                      ))}
                    </div>
                  </details>
                )}
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
            return (
              <div key={block.id} className="relative z-10 mx-4 my-6">
                {block.title && <h3 className="font-black text-rose-700 mb-4 flex items-center gap-3 text-xl"><span>🖼️</span>{block.title}</h3>}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
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
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-sky-50 to-cyan-50 backdrop-blur-xl p-8 rounded-3xl border-2 border-sky-300 shadow-[0_10px_30px_rgba(14,165,233,0.15)] mx-4 my-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-2xl shadow-md">📋</div>
                  <h3 className="font-black text-sky-800 text-2xl">{block.title || 'Em đã học được gì?'}</h3>
                </div>
                {block.content && (
                  <p className="text-[#334155] italic mb-4 leading-relaxed">{block.content}</p>
                )}
                <ul className="space-y-2">
                  {(block.items || []).filter(i => i.trim()).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/80 rounded-xl px-4 py-3 border border-sky-100 shadow-sm">
                      <span className="w-7 h-7 rounded-full bg-sky-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      <span className="text-[#082F49] font-medium leading-relaxed flex-1">{item}</span>
                    </li>
                  ))}
                </ul>
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

            {/* LAYER 2: IMAGE SCENARIO */}
            <div className={`absolute inset-0 bg-transparent transition-opacity duration-700 ${activeMediaBlock?.type === 'imageScenario' ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <ImageSlider urls={activeMediaBlock?.imageUrls || (activeMediaBlock?.imageUrl ? [activeMediaBlock.imageUrl] : [])} />
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
            width: 50% !important;
            max-width: 50% !important;
            flex: none !important;
          }
          .right-panel-preview {
            height: 100% !important;
            flex: 1 1 0% !important;
          }
        }
      `}} />
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
