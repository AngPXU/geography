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

// CesiumOceanView — cho chế độ Đại dương
const CesiumOceanView = dynamic(
  () => import('@/components/ui/CesiumOceanView'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1f3c]/92 rounded-[28px]">
        <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">🌊</span>
        <p className="text-xl font-black text-white">Đang tải Bản đồ Đại dương...</p>
        <p className="text-sm text-slate-300 mt-2">Vui lòng chờ trong giây lát</p>
      </div>
    ),
  }
);

// CesiumEconomicView — cho chế độ Kinh tế
const CesiumEconomicView = dynamic(
  () => import('@/components/ui/CesiumEconomicView'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#082F49]/90 rounded-[28px]">
        <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">🏭</span>
        <p className="text-xl font-black text-white">Đang khởi tạo Bản đồ Kinh tế...</p>
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
    <div className="w-full flex flex-col gap-3 mt-2" style={{ height: 'calc(100vh - 140px)' }}>

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
        {mode === 'political' && (
          <CesiumMapView initialScene="2d" className="absolute inset-0 w-full h-full" />
        )}
        {mode === 'vietnam' && (
          <InteractiveMap
            is3D={false}
            onToggle3D={() => {}}
            mode="vietnam"
            onModeChange={setMode}
          />
        )}
        {mode === 'economic' && (
          <CesiumEconomicView className="absolute inset-0 w-full h-full" />
        )}
        {mode === 'ocean' && (
          <CesiumOceanView className="absolute inset-0 w-full h-full" />
        )}
        {(mode === 'physical' || mode === 'climate') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#E0F2FE]/80 via-white/60 to-[#DCFCE7]/80 backdrop-blur-xl">
            <div className="text-center px-8">
              <div className="text-7xl mb-6">
                {mode === 'physical' ? '⛰️' : '🌡️'}
              </div>
              <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Đang phát triển
              </div>
              <h2 className="text-2xl font-black text-[#082F49] mb-3">
                Bản đồ {mode === 'physical' ? 'Địa hình' : 'Khí hậu'}
              </h2>
              <p className="text-[#334155] font-medium max-w-md mx-auto text-sm leading-relaxed">
                Tính năng này đang được xây dựng và sẽ sớm ra mắt. Chúng tôi đang tổng hợp dữ liệu từ nhiều nguồn để mang lại trải nghiệm học tập tốt nhất.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
