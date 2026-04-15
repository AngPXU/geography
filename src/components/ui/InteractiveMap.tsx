'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import mapData from '@/data/mapData.json';

// Sửa lỗi icon defaut của Leaflet khi dùng với Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Các chế độ bản đồ
type MapMode = 'topo' | 'climate' | 'population' | 'night';

const MODES = [
  { id: 'topo',       label: 'Địa hình',   icon: '⛰️' },
  { id: 'climate',    label: 'Sinh quyển', icon: '☀️' },
  { id: 'population', label: 'Dân cư',     icon: '👥' },
  { id: 'night',      label: 'Ngày/Đêm',   icon: '🌙' },
] as const;

// Auto-switch mode layer component
function MapLayerSwitcher({ mode }: { mode: MapMode }) {
  // TileLayer sources
  const topoUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
  const climateUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const populationUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const nightUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

  return (
    <>
      {mode === 'topo' && <TileLayer url={topoUrl} attribution="&copy; OpenTopoMap" />}
      {mode === 'climate' && <TileLayer url={climateUrl} attribution="&copy; Esri World Imagery" />}
      {mode === 'population' && <TileLayer url={populationUrl} attribution="&copy; CartoDB Voyager" />}
      {mode === 'night' && <TileLayer url={nightUrl} attribution="&copy; CartoDB Dark Matter" />}
    </>
  );
}

// Marker hiển thị tuỳ theo chế độ
function MapMarkers({ mode, setSelected }: { mode: MapMode, setSelected: (data: any) => void }) {
  const customIcon = (emoji: string) => L.divIcon({
    html: `<div style="font-size: 24px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.5));">${emoji}</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  return (
    <>
      {/* Topology mode - Show mountains */}
      {mode === 'topo' && mapData.mountains.map(m => (
        <Marker key={m.id} position={[m.lat, m.lng]} icon={customIcon(m.emoji)} eventHandlers={{ click: () => setSelected(m) }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-bold">{m.name}</Tooltip>
        </Marker>
      ))}

      {/* Climate mode - Show Biomes */}
      {mode === 'climate' && mapData.biomes.map(b => (
        <CircleMarker key={b.id} center={[b.lat, b.lng]} radius={30} pathOptions={{ color: b.color, fillColor: b.color, fillOpacity: 0.4 }} eventHandlers={{ click: () => setSelected(b) }}>
          <Tooltip direction="center" opacity={1} className="font-bold text-sm bg-white/80 backdrop-blur-md border-0 text-slate-800">{b.emoji} {b.name}</Tooltip>
        </CircleMarker>
      ))}

      {/* Population mode - Show Heatmap Bubbles */}
      {mode === 'population' && mapData.population.map(p => {
        // scale radius based on pop
        const radius = Math.max(10, (p.pop / 1000000) * 1.5);
        return (
          <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={radius} pathOptions={{ color: '#ef4444', fillColor: '#f43f5e', fillOpacity: 0.6, weight: 2 }} eventHandlers={{ click: () => setSelected(p) }}>
            <Tooltip direction="top" opacity={1}>
              <div className="text-center font-sans">
                <p className="font-black text-rose-600 mb-0.5">{p.name}</p>
                <p className="font-bold text-slate-600 text-xs">{p.pop.toLocaleString()} người</p>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Night mode - Glow marker for cities */}
      {mode === 'night' && mapData.population.map(p => (
         <CircleMarker key={`n-${p.id}`} center={[p.lat, p.lng]} radius={3} pathOptions={{ color: '#fef08a', fillColor: '#fdf08a', fillOpacity: 1, weight: 3 }} eventHandlers={{ click: () => setSelected(p) }}>
            <Tooltip direction="top" opacity={1}><span className="font-bold">{p.name}</span></Tooltip>
         </CircleMarker>
      ))}
    </>
  );
}

// Map Event Listener để reset selection khi click ra ngoài
function MapEvents({ setSelected }: { setSelected: (v: any) => void }) {
  const map = useMap();
  useEffect(() => {
    map.on('click', () => setSelected(null));
    return () => { map.off('click'); }
  }, [map, setSelected]);
  return null;
}

export default function InteractiveMap() {
  const [mode, setMode] = useState<MapMode>('topo');
  const [selectedGeo, setSelectedGeo] = useState<any | null>(null);

  // Default coordinate for start (Vietnam focus)
  const defaultCenter: [number, number] = [16.047079, 108.206230];

  return (
    <div className="relative w-full h-[calc(100vh-80px)] rounded-[32px] overflow-hidden border border-white/40 shadow-[0_20px_50px_rgba(14,165,233,0.15)] mt-6">
      
      {/* Lớp Kính Bo Góc cho Leaflet container */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={defaultCenter} zoom={4} scrollWheelZoom={true} className="w-full h-full font-sans z-0" zoomControl={false}>
          <MapLayerSwitcher mode={mode} />
          <MapMarkers mode={mode} setSelected={setSelectedGeo} />
          <MapEvents setSelected={setSelectedGeo} />
        </MapContainer>
      </div>

      {/* Floating Dock - Liquid Glass Selector */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 p-2 bg-white/60 backdrop-blur-2xl border border-white rounded-[24px] shadow-[0_10px_30px_rgba(8,47,73,0.15)]">
         {MODES.map(m => (
           <button 
             key={m.id} 
             onClick={() => { setMode(m.id as MapMode); setSelectedGeo(null); }}
             className={`flex flex-col items-center justify-center w-20 h-16 rounded-[18px] font-bold text-xs transition-all duration-300 ${
               mode === m.id 
                 ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md transform -translate-y-1' 
                 : 'bg-white/40 text-slate-600 hover:bg-white hover:text-cyan-600'
             }`}
           >
             <span className="text-xl mb-0.5">{m.icon}</span>
             {m.label}
           </button>
         ))}
      </div>

      {/* Side Info Panel - Glassmorphism */}
      <div className={`absolute top-6 right-6 w-80 max-w-[calc(100vw-48px)] p-6 bg-white/80 backdrop-blur-2xl border border-white rounded-[28px] shadow-[0_20px_40px_rgba(8,47,73,0.12)] z-[1000] transition-all duration-500 ${selectedGeo ? 'translate-x-0 opacity-100 visible' : 'translate-x-12 opacity-0 invisible'}`}>
        {selectedGeo && (
          <>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 flex items-center justify-center bg-cyan-100 text-cyan-600 text-2xl rounded-[16px] shadow-sm">
                {selectedGeo.emoji || '📍'}
              </div>
              <button onClick={() => setSelectedGeo(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors">
                ✕
              </button>
            </div>
            <h3 className="text-xl font-black text-[#082F49] mb-2 leading-tight">{selectedGeo.name}</h3>
            {selectedGeo.pop && (
               <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold">
                 <span>👥</span> Dân số: {selectedGeo.pop.toLocaleString()}
               </div>
            )}
            <p className="text-sm text-[#334155] leading-relaxed font-medium">
              {selectedGeo.desc}
            </p>
          </>
        )}
      </div>

      {/* Title Overlay */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
         <div className="bg-white/80 backdrop-blur-xl border border-white px-5 py-3 rounded-[20px] shadow-sm flex items-center gap-3">
           <span className="text-2xl animate-spin-slow">🌍</span>
           <div>
             <h1 className="text-lg font-black text-[#082F49] uppercase tracking-wider leading-none">GeoMap</h1>
             <p className="text-[10px] font-bold text-cyan-600 mt-0.5">Khám phá Trái Đất Đa Chiều</p>
           </div>
         </div>
      </div>
    </div>
  );
}
