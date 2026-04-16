'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CountryEditor } from './CountryEditor';

// Import thư viện động để tránh lỗi SSR trong Next.js do thư viện dùng WebGL trực tiếp
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export interface CountryData {
  _id: string;
  name: string;
  capital: string;
  population: string;
  description: string;
  color: string;
  lat: number;
  lng: number;
  images: string[];
  flag?: string;
  area?: string;
  language?: string;
  currency?: string;
  continent?: string;
  funFact?: string;
}

interface Props {
  userRole?: number;
}

// ── Image Slideshow ────────────────────────────────────────────────────────────
function ImageSlideshow({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[idx]} alt={`slide-${idx}`} className="w-full h-full object-cover transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm text-[#082F49] font-bold flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 text-base leading-none">‹</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm text-[#082F49] font-bold flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 text-base leading-none">›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Stat Cell ─────────────────────────────────────────────────────────────────
function StatCell({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl p-2.5 flex items-start gap-2" style={{ background: 'rgba(248,250,252,0.8)' }}>
      <span className="text-sm mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-[#94A3B8] font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[11px] font-bold text-[#082F49] leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ── Country Info Panel ─────────────────────────────────────────────────────────
function CountryInfoPanel({ country, onClose }: { country: CountryData; onClose: () => void }) {
  return (
    <div
      className="fixed z-50 inset-x-3 bottom-3 md:inset-auto md:right-5 md:top-1/2 md:-translate-y-1/2 md:w-80 max-h-[85vh] overflow-y-auto rounded-3xl cursor-auto"
      style={{
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,1)',
        boxShadow: '0 20px 60px rgba(14,165,233,0.20)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header color strip */}
      <div
        className="relative h-14 rounded-t-3xl flex items-center px-5 gap-3 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${country.color}ee, ${country.color}99)` }}
      >
        <span className="text-3xl drop-shadow">{country.flag ?? '🌍'}</span>
        <div>
          <p className="font-extrabold text-white text-base leading-tight drop-shadow">{country.name}</p>
          {country.continent && <p className="text-white/80 text-[10px] font-semibold">{country.continent}</p>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/25 text-white hover:bg-white/40 flex items-center justify-center transition-all font-bold text-xs"
        >✕</button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Slideshow */}
        <ImageSlideshow images={country.images} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCell label="Thủ đô" value={country.capital} icon="🏛️" />
          <StatCell label="Dân số" value={country.population} icon="👥" />
          {country.area && <StatCell label="Diện tích" value={country.area} icon="📐" />}
          {country.language && <StatCell label="Ngôn ngữ" value={country.language} icon="🗣️" />}
          {country.currency && <StatCell label="Tiền tệ" value={country.currency} icon="💰" />}
        </div>

        {/* Description */}
        <div className="rounded-2xl p-3" style={{ background: 'rgba(224,242,254,0.6)', border: '1px solid rgba(186,230,253,0.5)' }}>
          <p className="text-[#334155] text-xs leading-relaxed">{country.description}</p>
        </div>

        {/* Fun fact */}
        {country.funFact && (
          <div className="rounded-2xl p-3 flex gap-2" style={{ background: 'rgba(220,252,231,0.6)', border: '1px solid rgba(187,247,208,0.5)' }}>
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-[#166534] text-xs leading-relaxed font-medium">{country.funFact}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Globe Component ───────────────────────────────────────────────────────
export function EarthGlobe({ userRole }: Props) {
  const [mounted, setMounted] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [selected, setSelected] = useState<CountryData | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [graphics, setGraphics] = useState<'ultra' | 'smooth'>('ultra');
  const globeRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('geo_graphics') as 'ultra' | 'smooth';
    if (saved) setGraphics(saved);

    const handleSettings = () => {
      const g = localStorage.getItem('geo_graphics') as 'ultra' | 'smooth';
      if (g) setGraphics(g);
    };
    window.addEventListener('geo_settings_changed', handleSettings);
    return () => window.removeEventListener('geo_settings_changed', handleSettings);
  }, []);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await fetch('/api/countries');
      if (!res.ok) return;
      const data = await res.json();
      setCountries(data.countries ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

  useEffect(() => {
    if (mounted && globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = false;
      globeRef.current.pointOfView({ altitude: 1.5 });
    }
  }, [mounted]);

  const handleLocationClick = (loc: CountryData) => {
    setSelected(loc);
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.0 }, 1000);
      globeRef.current.controls().autoRotate = false;
    }
  };

  const handleClosePanel = () => {
    setSelected(null);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.pointOfView({ altitude: 1.5 }, 1000);
    }
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-[600px] aspect-square mx-auto flex items-center justify-center">
        <div className="w-32 h-32 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[600px] aspect-square relative mx-auto flex items-center justify-center pointer-events-auto globe-container cursor-grab active:cursor-grabbing">

        {/* Top Badges */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {/* Interaction notice */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-slate-700 pointer-events-auto shadow-sm animate-pulse"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,1)'
            }}
          >
            <span className="text-sm">👆</span> Có thể tương tác trực tiếp
          </div>

          {/* Edit button — role=1 only */}
          {userRole === 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowEditor(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-bold text-white transition-all duration-300 hover:scale-105 pointer-events-auto"
              style={{
                background: 'rgba(6,182,212,0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 4px 16px rgba(6,182,212,0.3)',
              }}
            >
              ✏️ Chỉnh sửa
            </button>
          )}
        </div>

        <Globe
          ref={globeRef}
          width={800}
          height={800}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl=""
          backgroundColor="rgba(0,0,0,0)"
          showAtmosphere={graphics === 'ultra'}
          atmosphereColor="#E0F2FE"
          atmosphereAltitude={graphics === 'ultra' ? 0.2 : 0}
          labelsData={countries}
          labelLat={(d: any) => d.lat}
          labelLng={(d: any) => d.lng}
          labelDotRadius={0.7}
          labelColor={(d: any) => d.color}
          labelText={() => ''}
          onLabelClick={(d: any) => handleLocationClick(d)}
          ringsData={countries}
          ringLat={(d: any) => d.lat}
          ringLng={(d: any) => d.lng}
          ringColor={(d: any) => d.color}
          ringMaxRadius={3}
          ringPropagationSpeed={2}
          ringRepeatPeriod={800}
          // @ts-expect-error — onRingClick present at runtime, missing in typings
          onRingClick={(d: any) => handleLocationClick(d)}
        />

        <style>{`
          .globe-container canvas {
            outline: none;
            filter: drop-shadow(0 20px 40px rgba(14,165,233,0.15));
          }
        `}</style>
      </div>

      {/* Rich info panel */}
      {selected && (
        <CountryInfoPanel country={selected} onClose={handleClosePanel} />
      )}

      {/* Country editor modal — admin only */}
      {showEditor && (
        <CountryEditor
          onClose={() => setShowEditor(false)}
          onSaved={fetchCountries}
        />
      )}
    </>
  );
}
