'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext, DragOverlay, useDraggable, useDroppable,
  closestCenter, type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { geoPath, geoMercator, geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, Objects } from 'topojson-specification';
import type { Feature, Geometry, FeatureCollection } from 'geojson';
import { PUZZLE_SETS, type PuzzleSet, type CountryData } from '@/data/puzzleSets';

// ─── Constants ─────────────────────────────────────────────────────────────────
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const MAP_W = 800;
const MAP_H = 500;
const THUMB = 72; // px for piece thumbnails

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getThumbnailPath(feat: Feature, size: number): string {
  try {
    const proj = geoMercator().fitSize([size, size], feat);
    return geoPath().projection(proj)(feat) ?? '';
  } catch { return ''; }
}

// Tailwind gradient class → [from, to] hex colors
const GRAD_MAP: Record<string, [string, string]> = {
  'from-cyan-400 to-blue-500':     ['#22D3EE', '#3B82F6'],
  'from-emerald-400 to-green-500': ['#34D399', '#22C55E'],
  'from-amber-400 to-orange-500':  ['#FBBF24', '#F97316'],
  'from-rose-400 to-red-500':      ['#FB7185', '#EF4444'],
  'from-violet-500 to-purple-600': ['#8B5CF6', '#9333EA'],
  'from-pink-400 to-fuchsia-500':  ['#F472B6', '#D946EF'],
  'from-teal-400 to-cyan-500':     ['#2DD4BF', '#06B6D4'],
  'from-orange-400 to-red-400':    ['#FB923C', '#F87171'],
  'from-indigo-400 to-blue-600':   ['#818CF8', '#2563EB'],
  'from-lime-400 to-green-500':    ['#A3E635', '#22C55E'],
  'from-sky-400 to-indigo-500':    ['#38BDF8', '#6366F1'],
  'from-yellow-400 to-amber-500':  ['#FACC15', '#F59E0B'],
  'from-red-500 to-rose-600':      ['#EF4444', '#E11D48'],
  'from-fuchsia-400 to-pink-500':  ['#E879F9', '#EC4899'],
  'from-green-500 to-emerald-600': ['#22C55E', '#059669'],
  'from-blue-400 to-violet-500':   ['#60A5FA', '#8B5CF6'],
  'from-amber-500 to-yellow-400':  ['#F59E0B', '#FACC15'],
  'from-purple-400 to-fuchsia-600':['#C084FC', '#C026D3'],
  'from-slate-400 to-blue-500':    ['#94A3B8', '#3B82F6'],
  'from-rose-300 to-pink-500':     ['#FDA4AF', '#EC4899'],
};

function getColors(colorClass: string): [string, string] {
  return GRAD_MAP[colorClass] ?? ['#06B6D4', '#3B82F6'];
}

// ─── Draggable Piece in Tray ───────────────────────────────────────────────────
function DraggablePiece({
  country, feat, isPlaced,
}: { country: CountryData; feat: Feature; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(country.id),
  });
  const thumbPath = useMemo(() => getThumbnailPath(feat, THUMB), [feat]);
  const [c1, c2] = getColors(country.color);
  const gradId = `grad-${country.id}`;

  if (isPlaced) {
    return (
      <div className="flex flex-col items-center gap-1 p-2 rounded-[16px] bg-emerald-50 border border-emerald-200 opacity-60 select-none">
        <div className="w-[72px] h-[72px] flex items-center justify-center">
          <span className="text-2xl">{country.flag}</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 text-center leading-tight">✓ {country.name}</span>
      </div>
    );
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 'auto' as React.CSSProperties['zIndex'],
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex flex-col items-center gap-1 p-2 rounded-[16px] bg-white/80 border border-white shadow-[0_4px_12px_rgba(14,165,233,0.1)] cursor-grab active:cursor-grabbing hover:-translate-y-1 transition-transform select-none"
    >
      <svg width={THUMB} height={THUMB} viewBox={`0 0 ${THUMB} ${THUMB}`} className="overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <path d={thumbPath} fill={`url(#${gradId})`} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
      <span className="text-[10px] font-bold text-[#082F49] text-center leading-tight max-w-[80px]">
        {country.flag} {country.name}
      </span>
    </div>
  );
}

// ─── Droppable Country on Map ──────────────────────────────────────────────────
function DroppableCountry({
  country, d, isPlaced, isWrong,
}: { country: CountryData; d: string; isPlaced: boolean; isWrong: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: String(country.id) });
  const [c1, c2] = getColors(country.color);
  const gradId = `map-grad-${country.id}`;

  const fill = isPlaced
    ? `url(#${gradId})`
    : isOver
    ? 'rgba(6,182,212,0.35)'
    : 'rgba(148,163,184,0.12)';

  const stroke = isPlaced ? c1 : isOver ? '#06B6D4' : '#94a3b8';
  const strokeW = isPlaced || isOver ? 2 : 1;

  return (
    <g className={isWrong ? 'animate-[shake_0.4s_ease]' : ''}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c1} stopOpacity={0.75} />
          <stop offset="100%" stopColor={c2} stopOpacity={0.75} />
        </linearGradient>
      </defs>
      <path
        ref={setNodeRef as unknown as React.RefCallback<SVGPathElement>}
        d={d}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinejoin="round"
        style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
      />
    </g>
  );
}

// ─── Map Board ────────────────────────────────────────────────────────────────
function MapBoard({
  features, countryMap, placed, wrongPiece, puzzleSet,
}: {
  features: Feature[];
  countryMap: Map<number, CountryData>;
  placed: Set<string>;
  wrongPiece: string | null;
  puzzleSet: PuzzleSet;
}) {
  const { paths, centroids } = useMemo(() => {
    if (features.length === 0) return { paths: new Map<number, string>(), centroids: new Map<number, [number, number]>() };

    const collection: FeatureCollection = { type: 'FeatureCollection', features };
    const proj = geoMercator()
      .center(puzzleSet.mapCenter)
      .scale(puzzleSet.mapScale)
      .translate([MAP_W / 2, MAP_H / 2]);
    const gen = geoPath().projection(proj);

    const paths = new Map<number, string>();
    const centroids = new Map<number, [number, number]>();

    features.forEach(f => {
      const id = Number(f.id);
      paths.set(id, gen(f) ?? '');
      try {
        const [cx, cy] = proj(geoCentroid(f)) ?? [0, 0];
        centroids.set(id, [cx, cy]);
      } catch {}
    });

    return { paths, centroids };
  }, [features, puzzleSet]);

  return (
    <div className="relative w-full rounded-[24px] overflow-hidden" style={{ background: 'rgba(186,230,253,0.15)', border: '1px solid rgba(255,255,255,0.8)' }}>
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="w-full h-auto"
        style={{ display: 'block' }}
      >
        {features.map(f => {
          const id = Number(f.id);
          const country = countryMap.get(id);
          if (!country) return null;
          const d = paths.get(id) ?? '';
          const [cx, cy] = centroids.get(id) ?? [0, 0];
          const isPlaced = placed.has(String(id));

          return (
            <g key={id}>
              <DroppableCountry
                country={country}
                d={d}
                isPlaced={isPlaced}
                isWrong={wrongPiece === String(id)}
              />
              {isPlaced && (
                <text
                  x={cx} y={cy + 4}
                  textAnchor="middle"
                  fontSize={puzzleSet.mapScale > 500 ? 12 : 10}
                  fill="white"
                  fontWeight="800"
                  style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                >
                  {country.flag}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Completion Screen ────────────────────────────────────────────────────────
function CompletionScreen({ elapsed, total, onRestart }: { elapsed: number; total: number; onRestart: () => void }) {
  const stars = elapsed < 60 ? 3 : elapsed < 180 ? 2 : 1;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(8,47,73,0.6)', backdropFilter: 'blur(20px)' }}>
      <div className="text-center max-w-md w-full rounded-[36px] p-10" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(32px)', border: '2px solid white', boxShadow: '0 40px 80px rgba(8,47,73,0.2)' }}>
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-black text-[#082F49] mb-2">Hoàn thành!</h2>
        <p className="text-slate-500 font-semibold mb-6">Bạn đã ghép đúng cả {total} mảnh ghép!</p>

        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`text-4xl transition-all ${i < stars ? 'opacity-100 scale-110' : 'opacity-30 grayscale'}`}>⭐</span>
          ))}
        </div>

        <div className="flex gap-4 justify-center mb-8">
          <div className="rounded-[20px] p-4 bg-cyan-50 border border-cyan-100 min-w-[100px]">
            <p className="text-2xl font-black text-[#082F49] tabular-nums">{fmtTime(elapsed)}</p>
            <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mt-1">Thời gian</p>
          </div>
          <div className="rounded-[20px] p-4 bg-emerald-50 border border-emerald-100 min-w-[100px]">
            <p className="text-2xl font-black text-[#082F49]">{total}/{total}</p>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mt-1">Mảnh ghép</p>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full h-14 rounded-full bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black text-lg shadow-[0_8px_20px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 transition-all"
        >
          🔄 Chơi lại
        </button>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────
export function PuzzleClient({ initialSet = 'sea' }: { initialSet?: string }) {
  const [topology, setTopology] = useState<Topology<Objects<Record<string, unknown>>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState(initialSet);
  const [placed, setPlaced] = useState<Set<string>>(new Set());
  const [wrongPiece, setWrongPiece] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);

  // Load TopoJSON
  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(data => { setTopology(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Timer
  useEffect(() => {
    if (!startTime || completed) return;
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startTime, completed]);

  const puzzleSet = useMemo(() => PUZZLE_SETS.find(s => s.id === selectedSetId)!, [selectedSetId]);
  const countryMap = useMemo(() => new Map(puzzleSet.countries.map(c => [c.id, c])), [puzzleSet]);

  // Filter GeoJSON features for current set
  const features = useMemo((): Feature[] => {
    if (!topology) return [];
    const validIds = new Set(puzzleSet.countries.map(c => c.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = topology as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allFeatures = (feature(topo, topo.objects.countries) as unknown as FeatureCollection).features;
    return allFeatures.filter(f => validIds.has(Number(f.id)));
  }, [topology, puzzleSet]);

  // Thumbnail paths per country (computed once)
  const thumbPaths = useMemo(() => {
    const map = new Map<number, string>();
    features.forEach(f => {
      map.set(Number(f.id), getThumbnailPath(f, THUMB));
    });
    return map;
  }, [features]);

  const handleSetChange = useCallback((id: string) => {
    setSelectedSetId(id);
    setPlaced(new Set());
    setWrongPiece(null);
    setActiveId(null);
    setElapsed(0);
    setStartTime(null);
    setCompleted(false);
  }, []);

  const handleDragStart = useCallback(({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    if (!startTime) setStartTime(Date.now());
  }, [startTime]);

  const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;

    const pieceId = String(active.id);
    const zoneId = String(over.id);

    if (pieceId === zoneId) {
      // Correct!
      setPlaced(prev => {
        const next = new Set(prev);
        next.add(pieceId);
        // Check completion
        if (next.size === puzzleSet.countries.length) {
          setCompleted(true);
          setElapsed(prev2 => prev2); // freeze
        }
        return next;
      });
    } else {
      // Wrong — shake effect
      setWrongPiece(pieceId);
      setTimeout(() => setWrongPiece(null), 500);
    }
  }, [puzzleSet.countries.length]);

  // Remaining pieces in tray
  const trayCountries = useMemo(() =>
    puzzleSet.countries.filter(c => !placed.has(String(c.id))),
    [puzzleSet.countries, placed]
  );

  // Active feature for DragOverlay
  const activeFeature = useMemo(() =>
    activeId ? features.find(f => String(f.id) === activeId) : null,
    [activeId, features]
  );
  const activeCountry = useMemo(() =>
    activeId ? countryMap.get(Number(activeId)) : null,
    [activeId, countryMap]
  );

  return (
    <div className="w-[95%] max-w-[1400px] mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-block px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-600 font-bold text-xs uppercase tracking-widest border border-cyan-100 mb-3">
          Mini-game
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-[#082F49] tracking-tight">
          Ghép <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">Bản Đồ</span>
        </h1>
        <p className="text-slate-500 font-medium mt-2">Kéo và thả các mảnh ghép vào đúng vị trí trên bản đồ</p>
      </div>

      {/* Puzzle Set Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {PUZZLE_SETS.map(set => (
          <button
            key={set.id}
            onClick={() => handleSetChange(set.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 border ${
              selectedSetId === set.id
                ? 'bg-[#06B6D4] text-white border-transparent shadow-[0_4px_12px_rgba(6,182,212,0.35)]'
                : 'bg-white/70 text-[#334155] border-white hover:border-cyan-200 hover:bg-white'
            }`}
          >
            {set.icon} {set.label}
          </button>
        ))}
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white font-bold text-sm text-[#082F49]">
            ✅ <span className="text-cyan-600 font-black">{placed.size}</span>/{puzzleSet.countries.length} mảnh
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white font-bold text-sm text-[#082F49] tabular-nums">
            ⏱ {fmtTime(elapsed)}
          </div>
        </div>
        <button
          onClick={() => handleSetChange(selectedSetId)}
          className="px-4 py-2 rounded-full bg-white/70 border border-white text-sm font-bold text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          🔄 Đặt lại
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#06B6D4]/30 border-t-[#06B6D4] animate-spin" />
          <p className="text-slate-500 font-medium">Đang tải bản đồ...</p>
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Left: Piece Tray */}
            <div
              className="lg:w-[280px] shrink-0 rounded-[24px] p-4 overflow-y-auto"
              style={{
                background: 'rgba(255,255,255,0.65)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
                maxHeight: '600px',
              }}
            >
              <p className="text-xs font-black text-[#082F49] uppercase tracking-widest mb-3 px-1">
                🧩 Mảnh ghép ({trayCountries.length} còn lại)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {puzzleSet.countries.map(country => {
                  const feat = features.find(f => Number(f.id) === country.id);
                  if (!feat) return null;
                  return (
                    <DraggablePiece
                      key={country.id}
                      country={country}
                      feat={feat}
                      isPlaced={placed.has(String(country.id))}
                    />
                  );
                })}
              </div>
            </div>

            {/* Right: Map Board */}
            <div className="flex-1 min-w-0">
              <div
                className="rounded-[24px] p-4"
                style={{
                  background: 'rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
                }}
              >
                <p className="text-xs font-black text-[#082F49] uppercase tracking-widest mb-3 px-1">
                  🗺️ Bản đồ — kéo mảnh ghép vào đúng vị trí
                </p>
                <MapBoard
                  features={features}
                  countryMap={countryMap}
                  placed={placed}
                  wrongPiece={wrongPiece}
                  puzzleSet={puzzleSet}
                />
              </div>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay dropAnimation={null}>
            {activeId && activeFeature && activeCountry ? (() => {
              const [c1, c2] = getColors(activeCountry.color);
              const overlayGradId = `overlay-grad-${activeId}`;
              return (
                <div className="flex flex-col items-center gap-1 p-2 rounded-[16px] bg-white shadow-[0_8px_32px_rgba(6,182,212,0.3)] border-2 border-cyan-300 cursor-grabbing opacity-90 select-none">
                  <svg width={THUMB} height={THUMB} viewBox={`0 0 ${THUMB} ${THUMB}`}>
                    <defs>
                      <linearGradient id={overlayGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={c1} />
                        <stop offset="100%" stopColor={c2} />
                      </linearGradient>
                    </defs>
                    <path
                      d={thumbPaths.get(Number(activeId)) ?? ''}
                      fill={`url(#${overlayGradId})`}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[10px] font-bold text-[#082F49]">
                    {activeCountry.flag} {activeCountry.name}
                  </span>
                </div>
              );
            })() : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Completion Modal */}
      {completed && (
        <CompletionScreen
          elapsed={elapsed}
          total={puzzleSet.countries.length}
          onRestart={() => handleSetChange(selectedSetId)}
        />
      )}

      {/* CSS for shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
