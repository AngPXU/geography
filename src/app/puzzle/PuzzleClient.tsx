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
import { Icon } from '@iconify/react';

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

function getThumbnailInfo(feat: Feature, size: number): { path: string; proj: ReturnType<typeof geoMercator> | null } {
  try {
    const proj = geoMercator().fitSize([size, size], feat);
    return { path: geoPath().projection(proj)(feat) ?? '', proj };
  } catch { return { path: '', proj: null }; }
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

// ISO 3166-1 numeric → alpha-2 (for flagcdn.com)
const NUM_TO_CCA2: Record<number, string> = {
  // Đông Nam Á
  96:'bn', 116:'kh', 360:'id', 418:'la', 458:'my', 104:'mm', 608:'ph', 702:'sg', 764:'th', 626:'tl', 704:'vn',
  // Nam Á
  4:'af', 50:'bd', 64:'bt', 356:'in', 524:'np', 586:'pk', 144:'lk',
  // Đông Á & Trung Á
  156:'cn', 392:'jp', 408:'kp', 410:'kr', 496:'mn', 398:'kz', 417:'kg', 762:'tj', 795:'tm', 860:'uz',
  // Trung Đông
  31:'az', 368:'iq', 364:'ir', 376:'il', 400:'jo', 422:'lb', 512:'om', 682:'sa', 760:'sy', 792:'tr', 887:'ye',
  // Châu Âu
  8:'al', 40:'at', 112:'by', 56:'be', 70:'ba', 100:'bg', 191:'hr', 196:'cy', 203:'cz', 208:'dk', 233:'ee',
  246:'fi', 250:'fr', 276:'de', 300:'gr', 348:'hu', 352:'is', 372:'ie', 380:'it', 428:'lv', 440:'lt',
  807:'mk', 498:'md', 499:'me', 528:'nl', 578:'no', 616:'pl', 620:'pt', 642:'ro', 643:'ru', 688:'rs',
  703:'sk', 705:'si', 724:'es', 752:'se', 756:'ch', 804:'ua', 826:'gb',
  // Châu Phi
  12:'dz', 24:'ao', 204:'bj', 72:'bw', 854:'bf', 108:'bi', 120:'cm', 140:'cf', 148:'td', 178:'cg', 180:'cd',
  384:'ci', 262:'dj', 818:'eg', 226:'gq', 232:'er', 748:'sz', 231:'et', 266:'ga', 270:'gm', 288:'gh',
  324:'gn', 624:'gw', 404:'ke', 426:'ls', 430:'lr', 434:'ly', 450:'mg', 454:'mw', 466:'ml', 478:'mr',
  504:'ma', 508:'mz', 516:'na', 562:'ne', 566:'ng', 646:'rw', 686:'sn', 694:'sl', 706:'so', 710:'za',
  728:'ss', 729:'sd', 834:'tz', 768:'tg', 788:'tn', 800:'ug', 894:'zm', 716:'zw',
  // Châu Mỹ
  32:'ar', 84:'bz', 68:'bo', 76:'br', 124:'ca', 152:'cl', 170:'co', 188:'cr', 192:'cu', 214:'do', 218:'ec',
  222:'sv', 320:'gt', 328:'gy', 332:'ht', 340:'hn', 388:'jm', 484:'mx', 558:'ni', 591:'pa', 600:'py',
  604:'pe', 740:'sr', 780:'tt', 840:'us', 858:'uy', 862:'ve',
  // Châu Đại Dương
  36:'au', 242:'fj', 554:'nz', 598:'pg', 90:'sb', 548:'vu',
};

// ─── Draggable Piece in Tray ───────────────────────────────────────────────────
function DraggablePiece({
  country, feat, isPlaced,
}: { country: CountryData; feat: Feature; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(country.id),
  });
  const thumbPath = useMemo(() => getThumbnailPath(feat, THUMB), [feat]);
  // For Vietnam: compute projection to place island clusters
  const vnInfo = useMemo(
    () => country.id === 704 ? getThumbnailInfo(feat, THUMB) : null,
    [feat, country.id]
  );
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

        {/* Hoàng Sa & Trường Sa — luôn hiển thị trên mảnh ghép VN */}
        {vnInfo?.proj && (() => {
          const p   = vnInfo.proj;
          const hs  = p([112.0, 16.5] as [number, number]);
          const ts  = p([114.0,  9.8] as [number, number]);
          if (!hs || !ts) return null;
          const Island = ({ cx, cy, s }: { cx: number; cy: number; s: number }) => (
            <g>
              <ellipse cx={cx}        cy={cy}        rx={3.2*s} ry={2*s}   fill={c1} stroke="white" strokeWidth={0.6} />
              <ellipse cx={cx+5.5*s}  cy={cy-3.5*s}  rx={2*s}   ry={1.3*s} fill={c2} stroke="white" strokeWidth={0.5} />
              <ellipse cx={cx-4*s}    cy={cy+3.5*s}  rx={1.6*s} ry={1*s}   fill={c1} stroke="white" strokeWidth={0.5} />
              <ellipse cx={cx+2.5*s}  cy={cy+5*s}    rx={1.3*s} ry={0.8*s} fill={c2} stroke="white" strokeWidth={0.4} />
            </g>
          );
          return (
            <g>
              <Island cx={hs[0]} cy={hs[1]} s={1} />
              <Island cx={ts[0]} cy={ts[1]} s={0.85} />
            </g>
          );
        })()}
      </svg>
      <span className="text-[10px] font-bold text-[#082F49] text-center leading-tight max-w-[80px]">
        {country.flag} {country.name}
      </span>
    </div>
  );
}

// ─── Droppable Country on Map ──────────────────────────────────────────────────
function DroppableCountry({
  country, d, isPlaced, bounds,
}: { country: CountryData; d: string; isPlaced: boolean; bounds?: [[number,number],[number,number]] }) {
  const { setNodeRef, isOver } = useDroppable({ id: String(country.id) });
  const [c1, c2] = getColors(country.color);
  const gradId    = `map-grad-${country.id}`;
  const patternId = `flag-pat-${country.id}`;

  const flagCode = NUM_TO_CCA2[country.id];
  const flagUrl  = flagCode ? `https://flagcdn.com/w320/${flagCode}.png` : null;

  const bx = bounds?.[0][0] ?? 0;
  const by = bounds?.[0][1] ?? 0;
  const bw = bounds ? bounds[1][0] - bounds[0][0] : 100;
  const bh = bounds ? bounds[1][1] - bounds[0][1] : 100;

  const fill = isPlaced
    ? (flagUrl && bounds ? `url(#${patternId})` : `url(#${gradId})`)
    : isOver
    ? 'rgba(6,182,212,0.35)'
    : 'rgba(148,163,184,0.12)';

  const stroke  = isPlaced ? '#64748b' : isOver ? '#06B6D4' : '#94a3b8';
  const strokeW = isPlaced ? 1.5 : isOver ? 1.5 : 1;

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor={c1} stopOpacity={0.75} />
          <stop offset="100%" stopColor={c2} stopOpacity={0.75} />
        </linearGradient>
        {flagUrl && bounds && (
          <pattern id={patternId} patternUnits="userSpaceOnUse" x={bx} y={by} width={bw} height={bh}>
            <image href={flagUrl} x={0} y={0} width={bw} height={bh} preserveAspectRatio="xMidYMid slice" />
          </pattern>
        )}
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
const MAP_PAD = 32; // inner padding so paths don't touch edge

function MapBoard({
  features, countryMap, placed, puzzleSet, zoom,
}: {
  features: Feature[];
  countryMap: Map<number, CountryData>;
  placed: Set<string>;
  puzzleSet: PuzzleSet;
  zoom: number;
}) {
  const { paths, centroids, bounds, proj } = useMemo(() => {
    if (features.length === 0) return {
      paths: new Map<number, string>(),
      centroids: new Map<number, [number, number]>(),
      bounds: new Map<number, [[number,number],[number,number]]>(),
      proj: null as ReturnType<typeof geoMercator> | null,
    };

    const collection: FeatureCollection = { type: 'FeatureCollection', features };
    // fitExtent guarantees ALL features fit inside the viewport
    const proj = geoMercator().fitExtent(
      [[MAP_PAD, MAP_PAD], [MAP_W - MAP_PAD, MAP_H - MAP_PAD]],
      collection
    );
    const gen = geoPath().projection(proj);

    const paths    = new Map<number, string>();
    const centroids = new Map<number, [number, number]>();
    const bounds   = new Map<number, [[number,number],[number,number]]>();

    features.forEach(f => {
      const id = Number(f.id);
      paths.set(id, gen(f) ?? '');
      bounds.set(id, gen.bounds(f) as [[number,number],[number,number]]);
      try {
        const [cx, cy] = proj(geoCentroid(f)) ?? [0, 0];
        centroids.set(id, [cx, cy]);
      } catch {}
    });

    return { paths, centroids, bounds, proj };
  }, [features, puzzleSet]);

  return (
    <div
      className="relative w-full rounded-[20px] overflow-auto"
      style={{
        background: 'rgba(186,230,253,0.15)',
        border: '1px solid rgba(255,255,255,0.8)',
        maxHeight: '64vh',
      }}
    >
      <svg
        width={MAP_W * zoom}
        height={MAP_H * zoom}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        style={{ display: 'block' }}
      >
        {features.map(f => {
          const id = Number(f.id);
          const country = countryMap.get(id);
          if (!country) return null;
          const d = paths.get(id) ?? '';
          const isPlaced = placed.has(String(id));

          return (
            <g key={id}>
              <DroppableCountry
                country={country}
                d={d}
                isPlaced={isPlaced}
                bounds={bounds.get(id)}
              />
            </g>
          );
        })}

        {/* Hoàng Sa & Trường Sa — luôn hiển thị, màu đổi khi VN được ghép */}
        {proj && (() => {
          const hs  = proj([112.0, 16.5] as [number, number]);
          const ts  = proj([114.0,  9.8] as [number, number]);
          if (!hs || !ts) return null;
          const vnPlaced = placed.has('704');
          const islandFill   = vnPlaced ? '#EF4444' : 'rgba(148,163,184,0.18)';
          const islandStroke = vnPlaced ? 'white'   : '#94a3b8';

          const IslandCluster = ({ cx, cy, scale }: { cx: number; cy: number; scale: number }) => (
            <g transform={`translate(${cx},${cy})`} style={{ pointerEvents: 'none' }}>
              <ellipse rx={5*scale}   ry={3*scale}   cx={0}        cy={0}        fill={islandFill} stroke={islandStroke} strokeWidth={0.8} />
              <ellipse rx={3*scale}   ry={2*scale}   cx={9*scale}  cy={-5*scale} fill={islandFill} stroke={islandStroke} strokeWidth={0.8} />
              <ellipse rx={2.5*scale} ry={1.8*scale} cx={-7*scale} cy={5*scale}  fill={islandFill} stroke={islandStroke} strokeWidth={0.8} />
              <ellipse rx={2*scale}   ry={1.2*scale} cx={4*scale}  cy={7*scale}  fill={islandFill} stroke={islandStroke} strokeWidth={0.8} />
              <ellipse rx={1.5*scale} ry={1*scale}   cx={-3*scale} cy={-6*scale} fill={islandFill} stroke={islandStroke} strokeWidth={0.7} />
            </g>
          );

          return (
            <g style={{ pointerEvents: 'none' }}>
              <IslandCluster cx={hs[0]} cy={hs[1]} scale={1.15} />
              <IslandCluster cx={ts[0]} cy={ts[1]} scale={1}    />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

// ─── Completion Screen ────────────────────────────────────────────────────────
function CompletionScreen({ elapsed, total, onRestart, expEarned, submitting }: {
  elapsed: number; total: number; onRestart: () => void;
  expEarned: number | null; submitting: boolean;
}) {
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

        {submitting ? (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-slate-200 text-slate-500 font-bold text-xs">
            <span className="w-3 h-3 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin inline-block" />
            Đang lưu kết quả...
          </div>
        ) : expEarned ? (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-sm animate-bounce">
            🎉 Nhận {expEarned} EXP!
          </div>
        ) : null}
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expEarned, setExpEarned] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

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
    setActiveId(null);
    setElapsed(0);
    setStartTime(null);
    setCompleted(false);
    setExpEarned(null);
    setSubmitting(false);
    setZoom(1);
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
          const finalElapsed = Math.floor((Date.now() - (startTime ?? Date.now())) / 1000);
          // Submit — giống handleSoloEnd trong map-guessing
          setSubmitting(true);
          setExpEarned(null);
          fetch('/api/arena/puzzle/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ setId: selectedSetId, elapsed: finalElapsed, total: puzzleSet.countries.length }),
          })
            .then(r => r.json())
            .then(d => {
              if (d.success) {
                setExpEarned(d.expEarned ?? 50);
                window.dispatchEvent(new CustomEvent('arena-game-complete'));
              }
            })
            .catch(() => {})
            .finally(() => setSubmitting(false));
        }
        return next;
      });
    } else {
      // Wrong — do nothing (harder mode)
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
            <Icon icon="material-symbols:toys-and-games" width={22} /><span className="text-cyan-600 font-black">{placed.size}</span>/{puzzleSet.countries.length} mảnh
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white font-bold text-sm text-[#082F49] tabular-nums">
            ⏱ {fmtTime(elapsed)}
          </div>
        </div>
        <button
          onClick={() => handleSetChange(selectedSetId)}
          className="flex items-center px-4 py-2 rounded-full bg-white/70 border border-white text-sm font-bold text-slate-500 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <Icon icon="mingcute:refresh-4-fill" width={20} />&nbsp; Đặt lại
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
              <p className="flex items-center text-xs font-black text-[#082F49] uppercase tracking-widest mb-3 px-1">
                <Icon icon="material-symbols:toys-and-games" width={22} />&nbsp; Mảnh ghép ({trayCountries.length} còn lại)
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
                {/* Map header + zoom controls */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <p className="flex items-center text-xs font-black text-[#082F49] uppercase tracking-widest">
                    <Icon icon="material-symbols:map-rounded" width={22} />&nbsp;Bản đồ — kéo mảnh ghép vào đúng vị trí
                  </p>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.2).toFixed(1))))}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-slate-200 text-slate-600 font-black text-base hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-600 transition-colors select-none"
                      title="Thu nhỏ"
                    >−</button>
                    <span className="text-[11px] font-bold text-slate-400 min-w-[38px] text-center tabular-nums">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.2).toFixed(1))))}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-slate-200 text-slate-600 font-black text-base hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-600 transition-colors select-none"
                      title="Phóng to"
                    >+</button>
                    <button
                      onClick={() => setZoom(1)}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-slate-200 text-slate-400 font-bold text-xs hover:bg-slate-100 transition-colors select-none"
                      title="Đặt lại zoom"
                    >↺</button>
                  </div>
                </div>
                <MapBoard
                  features={features}
                  countryMap={countryMap}
                  placed={placed}
                  puzzleSet={puzzleSet}
                  zoom={zoom}
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
          expEarned={expEarned}
          submitting={submitting}
        />
      )}

      {/* (no shake animation needed) */}
    </div>
  );
}
