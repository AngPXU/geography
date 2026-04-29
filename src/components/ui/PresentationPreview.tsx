'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });

type BlockType = 'heading' | 'text' | 'funFact' | 'mapAction' | 'quiz' | 'objectives' | 'imageScenario' | 'dataTable';

interface StoryBlock {
  id: string;
  type: BlockType;
  content?: string;
  level?: 1 | 2 | 3;
  title?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  lat?: number;
  lng?: number;
  zoom?: number;
  description?: string;
  showGrid?: boolean;
  showAnnotations?: boolean;
  annotationPreset?: string;
  showPin?: boolean;
  pinTitle?: string;
  pinInfo?: string;
  pinImage?: string;
  // ImageScenario
  imageUrl?: string;
  imageUrls?: string[];
  // DataTable
  tableTitle?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  tableHighlightCol?: number;
  tableUnit?: string;
  // Globe Style
  globeStyle?: string;
}

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
                return (
                  <tr
                    key={ri}
                    onMouseEnter={() => setHoveredRow(ri)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`border-b border-violet-50 transition-all duration-200 ${isHovered ? 'bg-violet-50' : ri % 2 === 0 ? 'bg-white' : 'bg-violet-50/30'}`}
                  >
                    <td className="px-4 py-3 text-xs font-bold text-violet-300">{ri + 1}</td>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3">
                        {ci === highlightCol ? (
                          <div className="flex items-center gap-3">
                            <span className="font-black text-violet-700 text-base min-w-[60px]">{cell}</span>
                            <div className="flex-1 bg-violet-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-violet-400 font-bold w-8 text-right">{barPct}%</span>
                          </div>
                        ) : (
                          <span className={`font-medium text-[#334155] ${isHovered ? 'text-[#082F49] font-bold' : ''}`}>{cell}</span>
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
        <div className="bg-violet-50 px-6 py-3 flex items-center gap-2 text-xs text-violet-400 font-medium border-t border-violet-100">
          <span>📌</span>
          <span>{rows.length} mục dữ liệu • Cột “{headers[highlightCol]}” đang hiển thị thanh thị phần trăm</span>
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
                if (prev?.type === 'mapAction' && prev.lat === lat && prev.lng === lng && prev.altitude === altitude) {
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
        if (!activeMediaBlock.pin) {
          setSelectedPin(null);
        }
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeMediaBlock]);

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex bg-[#E0F2FE] animate-in fade-in overflow-hidden">
      {/* CLOSE BUTTON */}
      <div className="absolute top-6 right-6 z-[100000]">
        <button onClick={onClose} className="w-12 h-12 bg-white/50 hover:bg-white/80 text-[#082F49] rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-md transition-all shadow-lg border border-white/80">✕</button>
      </div>

      {/* RIGHT: GLOBE & MEDIA BACKGROUND (Fixed) */}
      <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="pointer-events-auto w-full h-full relative">

          {/* LAYER 1: CESIUM GLOBE */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${(!activeMediaBlock || activeMediaBlock.type === 'mapAction') ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <CesiumGlobe
              ref={globeRef}
              imageryLayer={
                activeMediaBlock?.globeStyle ||
                (blocks.find(b => b.globeStyle)?.globeStyle) ||
                'Bing Maps Aerial'
              }
              showGrid={activeMediaBlock?.grid || false}
              showLayerPicker={false}
            />
          </div>

          {/* LAYER 2: IMAGE SCENARIO */}
          <div className={`absolute inset-0 bg-transparent transition-opacity duration-700 ${activeMediaBlock?.type === 'imageScenario' ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
            <ImageSlider urls={activeMediaBlock?.imageUrls || (activeMediaBlock?.imageUrl ? [activeMediaBlock.imageUrl] : [])} />
          </div>

        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#E0F2FE] via-transparent to-transparent pointer-events-none" />

        {/* HIỂN THỊ POPUP THÔNG TIN KHI BẤM VÀO GHIM */}
        {selectedPin && (
          <div className="absolute z-50 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-[0_20px_50px_rgba(14,165,233,0.3)] max-w-sm pointer-events-auto right-8 top-1/2 -translate-y-1/2 animate-in slide-in-from-right fade-in">
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

      {/* LEFT: SCROLLABLE CONTENT */}
      {/* Thêm class để ẩn scrollbar hiển thị ở giữa màn hình */}
      <div ref={scrollContainerRef} className="w-1/2 min-w-[500px] max-w-3xl h-full overflow-y-auto overflow-x-hidden pt-32 pb-64 px-16 space-y-10 relative z-20 bg-white/70 backdrop-blur-2xl border-r border-white/80 shadow-[20px_0_50px_rgba(14,165,233,0.1)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                  className="text-[#334155] leading-[1.8] font-medium text-[1.1rem] text-justify drop-shadow-sm [&_b]:font-black [&_strong]:font-black [&_i]:italic [&_em]:italic [&_u]:underline [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-2 [&_li]:my-1"
                  dangerouslySetInnerHTML={{ __html: block.content || '' }}
                />
              </div>
            );
          }

          if (block.type === 'objectives') {
            const items = block.content?.split('\n').filter(Boolean) || [];
            return (
              <div key={block.id} className="relative z-10 bg-gradient-to-br from-orange-50 to-amber-50 backdrop-blur-xl p-8 rounded-3xl border border-orange-200 shadow-[0_10px_30px_rgba(245,158,11,0.15)] mx-4 my-8">
                <h3 className="font-black text-orange-600 mb-4 flex items-center gap-3 text-xl drop-shadow-sm">
                  🎯 Học xong bài này, em sẽ:
                </h3>
                <ul className="space-y-3">
                  {items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-[#334155] font-medium text-lg leading-relaxed">
                      <span className="text-orange-400 mt-1.5 font-black text-xl">•</span>
                      <span>{item.trim()}</span>
                    </li>
                  ))}
                </ul>
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
                <h3 className="font-black text-[#082F49] mb-3 flex items-center gap-3 text-xl drop-shadow-sm">💡 {block.title}</h3>
                <p className="text-[#334155] text-lg leading-relaxed font-medium">{block.content}</p>
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
                <h3 className="font-bold text-[#082F49] mb-6 text-xl drop-shadow-sm">❓ {block.question}</h3>
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
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
