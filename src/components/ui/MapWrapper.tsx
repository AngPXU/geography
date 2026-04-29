'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// CesiumMapView — cho chế độ Chính trị
const CesiumMapView = dynamic(
  () => import('@/components/ui/CesiumMapView'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#082F49]/90 rounded-[28px]">
        <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">🌍</span>
        <p className="text-xl font-black text-white">Đang khởi tạo Bản đồ Cesium...</p>
        <p className="text-sm text-slate-300 mt-2">Vui lòng chờ trong giây lát</p>
      </div>
    ),
  }
);

// InteractiveMap (Leaflet) — cho các chế độ còn lại
const InteractiveMap = dynamic(
  () => import('@/components/ui/InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center animate-pulse">
        <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">🗺️</span>
        <p className="text-xl font-bold text-[#082F49]">Đang tải Bản đồ...</p>
      </div>
    ),
  }
);

type MapMode = 'political' | 'physical' | 'climate' | 'ocean' | 'economic' | 'vietnam';

const MODES: { id: MapMode; icon: string; label: string }[] = [
  { id: 'political', icon: '🗺️', label: 'Chính trị' },
  { id: 'physical',  icon: '⛰️', label: 'Địa hình' },
  { id: 'climate',   icon: '🌡️', label: 'Khí hậu' },
  { id: 'ocean',     icon: '🌊', label: 'Đại dương' },
  { id: 'economic',  icon: '🏭', label: 'Kinh tế' },
  { id: 'vietnam',   icon: '🇻🇳', label: 'Việt Nam' },
];

export function MapWrapper() {
  const [mode, setMode] = useState<MapMode>('political');

  return (
    // flex-col: tabs cố định trên, map fill phần còn lại
    <div className="w-full flex flex-col gap-3 mt-2" style={{ height: 'calc(100vh - 220px)' }}>

      {/* Thanh chọn chế độ — flex-shrink-0 để không bị nén */}
      <div className="flex-shrink-0 flex gap-1.5 flex-wrap justify-center p-1.5 bg-white/70 backdrop-blur-xl border border-white rounded-[20px] shadow-sm w-fit mx-auto">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-xs font-bold transition-all ${
              mode === m.id
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md'
                : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-600'
            }`}
          >
            <span className="text-sm">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Map container — flex-1 fill hết phần còn lại */}
      <div className="relative flex-1 rounded-[32px] overflow-hidden border border-white/40 shadow-[0_20px_50px_rgba(14,165,233,0.15)]">
        {mode === 'political' ? (
          <CesiumMapView initialScene="2d" className="absolute inset-0 w-full h-full" />
        ) : (
          <InteractiveMap
            is3D={false}
            onToggle3D={() => {}}
            mode={mode}
            onModeChange={setMode}
          />
        )}
      </div>
    </div>
  );
}
