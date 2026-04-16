'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// InteractiveMap (Leaflet 2D) — không bundle cùng MapLibre
const InteractiveMap = dynamic(
  () => import('@/components/ui/InteractiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-80px)] mt-6 rounded-[32px] bg-white/50 backdrop-blur-xl border border-white flex flex-col items-center justify-center animate-pulse p-4 text-center">
        <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">🌍</span>
        <p className="text-xl font-bold text-[#082F49]">Đang tải trung tâm dữ liệu Bản đồ...</p>
        <p className="text-sm font-medium text-slate-500 mt-2">Việc này mất vài giây trong lần tải đầu tiên</p>
      </div>
    ),
  }
);

// MapboxView3D — load hoàn toàn riêng biệt, không bao giờ bundle cùng Leaflet
const MapboxView3D = dynamic(
  () => import('@/components/ui/MapboxView3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-80px)] mt-6 rounded-[32px] bg-sky-50 flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white/90 px-5 py-3 rounded-full shadow-lg">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-sm font-bold text-[#082F49]">Đang khởi tạo chế độ 3D...</span>
        </div>
      </div>
    ),
  }
);

type MapMode = 'political' | 'physical' | 'climate' | 'ocean' | 'economic' | 'vietnam';

export function MapWrapper() {
  const [is3D, setIs3D]   = useState(false);
  const [mode, setMode]   = useState<MapMode>('political');

  return (
    <>
      {is3D ? (
        // Chế độ 3D: Mapbox GL — chỉ load khi người dùng bật 3D
        <div className="relative w-full h-[calc(100vh-80px)] mt-6 rounded-[32px] overflow-hidden border border-white/40 shadow-[0_20px_50px_rgba(14,165,233,0.15)]">
          <MapboxView3D mode={mode} />

          {/* Nút quay về 2D — nằm ngoài MapboxView3D để luôn hiện */}
          <div className="absolute top-4 right-4 z-[1000] flex gap-2">
            {/* Mode selector */}
            <div className="flex gap-1 p-1 bg-white/80 backdrop-blur-xl border border-white rounded-[18px]">
              {([
                ['political','🗺️','Chính trị'],
                ['physical', '⛰️','Địa hình'],
                ['climate',  '🌡️','Khí hậu'],
                ['ocean',    '🌊','Đại dương'],
                ['economic', '🏭','Kinh tế'],
                ['vietnam',  '🇻🇳','Việt Nam'],
              ] as [MapMode, string, string][]).map(([id, icon, label]) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`flex flex-col items-center justify-center w-14 h-12 rounded-[14px] text-[10px] font-bold transition-all ${
                    mode === id
                      ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md'
                      : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-600'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            {/* Nút 2D */}
            <button
              onClick={() => setIs3D(false)}
              className="h-10 px-3 self-center rounded-[14px] bg-white/80 backdrop-blur-xl border border-white flex items-center gap-1.5 text-xs font-black text-slate-600 hover:bg-white transition-all"
            >
              <span>🗺️</span> 2D
            </button>
          </div>
        </div>
      ) : (
        // Chế độ 2D: Leaflet — pass callback lên để toggle 3D
        <InteractiveMap
          is3D={false}
          onToggle3D={() => setIs3D(true)}
          mode={mode}
          onModeChange={setMode}
        />
      )}
    </>
  );
}
