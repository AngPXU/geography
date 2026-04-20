'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { findProvinceByName, VnProvince } from '@/data/vnProvinces';
import {
  MapContainer, TileLayer, WMSTileLayer, Marker, CircleMarker, Polyline, Polygon, Tooltip, useMap, useMapEvents, ImageOverlay
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackMission } from '@/utils/missionTracker';
import 'leaflet/dist/leaflet.css';
// Không còn dùng import mapData from '@/data/mapData.json' vì đã dùng Database


// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Types ─────────────────────────────────────────────────────────────────────
type MapMode = 'political' | 'physical' | 'climate' | 'ocean' | 'economic' | 'vietnam';

interface GeoItem {
  id: string; name: string; lat: number; lng: number; desc: string;
  subCategory?: string;
  emoji?: string; country?: string; elevation?: number; length?: number;
  pop?: number; color?: string; zone?: string; type?: string;
  area?: number; depth?: number; continent?: string; path?: number[][];
  rank?: number; featureClass?: string; nameEn?: string; comment?: string;
  capitalCity?: string; subregion?: string; officialName?: string;
  langs?: string; currs?: string;
  // Economic fields from World Bank
  incomeLevel?: string; incomeLevelCode?: string;
  gdpPerCapita?: number | null; gdpTotal?: number | null;
  population?: number | null; unemployment?: number | null;
  lifeExpectancy?: number | null; region?: string;
  iso3?: string; iso2?: string;
  speed?: string;
}

interface WorldCountry {
  _id: string;
  cca2: string;
  nameCommon: string;
  nameOfficial: string;
  capital: string;
  capitalLat: number;
  capitalLng: number;
  flag: string;
  flagPng: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  centerLat: number;
  centerLng: number;
  languages?: string;  // JSON string
  currencies?: string; // JSON string
}

// Màu chấm tròn theo châu lục
const REGION_DOT_COLOR: Record<string, string> = {
  'Asia': '#06B6D4', // cyan
  'Europe': '#8B5CF6', // violet
  'Americas': '#F97316', // orange
  'Africa': '#F59E0B', // amber
  'Oceania': '#10B981', // emerald
  'Antarctic': '#94A3B8', // slate
};
const DEFAULT_DOT_COLOR = '#64748B';


// ── Mode config ───────────────────────────────────────────────────────────────
const MODES = [
  { id: 'political' as MapMode, label: 'Chính trị', icon: '🗺️', center: [20, 10] as [number, number], zoom: 2 },
  { id: 'physical' as MapMode, label: 'Địa hình', icon: '⛰️', center: [30, 10] as [number, number], zoom: 2 },
  { id: 'climate' as MapMode, label: 'Khí hậu', icon: '🌡️', center: [20, 20] as [number, number], zoom: 2 },
  { id: 'ocean' as MapMode, label: 'Đại dương', icon: '🌊', center: [0, 0] as [number, number], zoom: 2 },
  { id: 'economic' as MapMode, label: 'Kinh tế', icon: '🏭', center: [20, 60] as [number, number], zoom: 2 },
  { id: 'vietnam' as MapMode, label: 'Việt Nam', icon: '🇻🇳', center: [16.05, 107.5] as [number, number], zoom: 5 },
] as const;

const TILES: Record<MapMode, { url: string; attr: string; overlay?: string }> = {
  // Bản đồ gốc CartoDB Voyager (Cập nhật dữ liệu từ OpenStreetMap mới nhất)
  political: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attr: '© CartoDB Voyager | OpenStreetMap contributors',
  },
  physical: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
  climate: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
  ocean: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', attr: '© Esri Ocean' },
  economic: { url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attr: '© CartoDB Positron' },
  vietnam: {
    url: 'https://services.arcgisonline.com/arcgis/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri World Terrain | Bản đồ ranh giới hành chính © Bộ Nông nghiệp và Môi trường Việt Nam',
  },
};

const LEGENDS: Record<MapMode, { color?: string; icon: string; label: string }[]> = {
  political: [
    { icon: '🔴', label: 'Thủ đô quốc gia' },
    { icon: '🏳️', label: 'Quốc gia (click để xem)' },
  ],
  physical: [
    { icon: '🏔️', label: 'Núi / Dãy núi' },
    { color: '#3b82f6', icon: '💧', label: 'Sông lớn' },
  ],
  climate: [
    { color: '#16a34a', icon: '🌴', label: 'Nhiệt đới ẩm' },
    { color: '#ca8a04', icon: '🦁', label: 'Nhiệt đới xavan' },
    { color: '#0d9488', icon: '🌧️', label: 'Gió mùa nhiệt đới' },
    { color: '#b45309', icon: '🏜️', label: 'Sa mạc nóng' },
    { color: '#2563eb', icon: '☁️', label: 'Ôn đới' },
    { color: '#93c5fd', icon: '🧊', label: 'Cực / Cận cực' },
  ],
  ocean: [
    { icon: '🌊', label: 'Đại dương / Biển' },
    { color: '#ef4444', icon: '🔴', label: 'Dòng hải lưu nóng' },
    { color: '#3b82f6', icon: '🔵', label: 'Dòng hải lưu lạnh (đứt)' },
  ],
  economic: [
    { color: '#16a34a', icon: '🟢', label: 'Quốc gia Phát triển cao (HIC)' },
    { color: '#0284c7', icon: '🔵', label: 'Thu nhập trên trung bình (UMC)' },
    { color: '#d97706', icon: '🟡', label: 'Quốc gia Đang phát triển (LMC)' },
    { color: '#dc2626', icon: '🔴', label: 'Quốc gia Kém phát triển (LIC)' },
    { color: '#94a3b8', icon: '⚪', label: 'Không phân loại (INX)' },
  ],
  vietnam: [
    { icon: '🗺️', label: 'Click tỉnh/TP để xem chi tiết' },
    { color: '#3B82F6', icon: '🔵', label: 'Đồng bằng sông Hồng' },
    { color: '#8B5CF6', icon: '🟣', label: 'Đông Bắc Bộ' },
    { color: '#EC4899', icon: '🩷', label: 'Tây Bắc Bộ' },
    { color: '#F97316', icon: '🟠', label: 'Bắc Trung Bộ' },
    { color: '#14B8A6', icon: '🩵', label: 'Nam Trung Bộ' },
    { color: '#84CC16', icon: '🟢', label: 'Tây Nguyên' },
    { color: '#F59E0B', icon: '🟡', label: 'Đông Nam Bộ' },
    { color: '#22C55E', icon: '💚', label: 'ĐB sông Cửu Long' },
    { icon: '🏙️', label: 'Thành phố / Đô thị lớn' },
  ],
};

// ── Helper: emoji Leaflet icon ────────────────────────────────────────────────
function emojiIcon(emoji: string, size = 26) {
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.4));cursor:pointer">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── Map Controller – flyTo khi chuyển mode hoặc tìm kiếm ─────────────────────
function MapController({ mode, flyTarget }: {
  mode: MapMode;
  flyTarget: [number, number, number] | null;
}) {
  const map = useMap();
  const prevMode = useRef<MapMode | null>(null);
  const prevFly = useRef<string | null>(null);

  useEffect(() => {
    if (mode !== prevMode.current) {
      prevMode.current = mode;
      const cfg = MODES.find(m => m.id === mode)!;
      map.flyTo(cfg.center, cfg.zoom, { duration: 1.1 });
    }
  }, [mode, map]);

  useEffect(() => {
    if (!flyTarget) return;
    const key = flyTarget.join(',');
    if (key === prevFly.current) return;
    prevFly.current = key;
    map.flyTo([flyTarget[0], flyTarget[1]], flyTarget[2], { duration: 1.4 });
  }, [flyTarget, map]);

  return null;
}

// ── Political markers ─────────────────────────────────────────────────────────
function PoliticalMarkers({
  countries, onSelect,
}: { countries: WorldCountry[]; onSelect: (item: GeoItem) => void }) {
  return (
    <>
      {countries.map(c => {
        const lat = c.capitalLat || c.centerLat;
        const lng = c.capitalLng || c.centerLng;
        if (!lat || !lng) return null;
        const dotColor = REGION_DOT_COLOR[c.region] ?? DEFAULT_DOT_COLOR;
        return (
          <CircleMarker
            key={c.cca2}
            center={[lat, lng]}
            radius={5}
            pathOptions={{
              color: dotColor,
              fillColor: dotColor,
              fillOpacity: 0.85,
              weight: 1.5,
            }}
            eventHandlers={{
              click: () => onSelect({
                id: c.cca2,
                name: c.nameCommon,
                lat, lng,
                desc: c.nameOfficial !== c.nameCommon ? `Tên chính thức: ${c.nameOfficial}` : '',
                emoji: c.flag,
                country: c.region,
                pop: c.population,
                area: c.area,
                capitalCity: c.capital,
                subregion: c.subregion || c.region,
                officialName: c.nameOfficial,
                langs: c.languages,
                currs: c.currencies,
              }),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <span className="font-bold text-xs">{c.flag} {c.nameCommon}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}



// ── Các marker Giáo dục (Sử dụng Db features) ──────────────────────────────
function PhysicalMarkers({ features, onSelect }: { features: GeoItem[]; onSelect: (item: GeoItem) => void }) {
  const mnts = features.filter(f => f.subCategory === 'mountain');
  const rvs = features.filter(f => f.subCategory === 'river');
  return (
    <>
      {mnts.map(m => (
        <Marker key={m.id} position={[m.lat, m.lng]}
          icon={emojiIcon(m.emoji || '🏔️', 26)}
          eventHandlers={{ click: () => onSelect(m) }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <span className="font-bold text-xs">{m.name}</span>
          </Tooltip>
        </Marker>
      ))}
      {rvs.map(r => r.path ? (
        <Polyline key={r.id} positions={r.path as any}
          pathOptions={{ color: '#0ea5e9', weight: 3, opacity: 0.8 }}
          eventHandlers={{ click: () => onSelect(r) }}>
          <Tooltip sticky opacity={1}>
            <span className="font-bold text-xs">💧 {r.name}</span>
          </Tooltip>
        </Polyline>
      ) : (
        <Marker key={r.id} position={[r.lat, r.lng]}
          icon={emojiIcon(r.emoji || '💧', 20)}
          eventHandlers={{ click: () => onSelect(r) }}>
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <span className="font-bold text-xs">{r.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

function ClimateMarkers({ features, onSelect }: { features: GeoItem[]; onSelect: (item: GeoItem) => void }) {
  return (
    <>
      {features.map(c => (
        <Marker key={c.id} position={[c.lat, c.lng]}
          icon={emojiIcon(c.emoji || '☀️', 30)}
          eventHandlers={{ click: () => onSelect(c) }}>
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            <span className="font-bold text-xs">{c.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

function OceanMarkers({ features, onSelect }: { features: GeoItem[]; onSelect: (item: GeoItem) => void }) {
  const marinePolys = features.filter(f => f.subCategory === 'marine_poly');
  const trenches = features.filter(f => f.subCategory === 'trench');
  const currents = features.filter(f => f.subCategory === 'current');

  return (
    <>
      {/* 1. Lớp viền vùng biển (Polygons) */}
      {marinePolys.map(poly => poly.path && (
        <Polygon key={poly.id} positions={poly.path as any}
          pathOptions={{ color: '#0284c7', weight: 2, fillOpacity: 0.1, fillColor: '#38bdf8' }}
          eventHandlers={{ click: () => onSelect(poly) }}>
          <Tooltip sticky opacity={1}>
            <span className="font-bold text-xs">🌊 {poly.name}</span>
          </Tooltip>
        </Polygon>
      ))}

      {/* 2. Điểm đánh dấu Rãnh Sâu (Trenches) */}
      {trenches.map(t => (
        <Marker key={t.id} position={[t.lat, t.lng]}
          icon={emojiIcon(t.emoji || '🐙', 28)}
          eventHandlers={{ click: () => onSelect(t) }}>
          <Tooltip direction="top" offset={[0, -14]} opacity={1}>
            <span className="font-bold text-xs">{t.name}</span>
          </Tooltip>
        </Marker>
      ))}

      {/* 3. Dòng Hải lưu (Ocean Currents) */}
      {currents.map((cur, i) => cur.path && (
        <Polyline key={cur.id || i} positions={cur.path as [number, number][]}
          pathOptions={{
            color: cur.type === 'Dòng lạnh' ? '#2563eb' : '#dc2626',
            weight: 5,
            opacity: 0.75,
            dashArray: cur.type === 'Dòng lạnh' ? '12 8' : '20 5', // Nóng liền mảnh hơn, Lạnh đứt quãng
            lineCap: 'round'
          }}
          eventHandlers={{ click: () => onSelect(cur) }}>
          <Tooltip sticky opacity={1}>
            <span className="font-bold text-xs">{cur.emoji} {cur.name}</span>
          </Tooltip>
        </Polyline>
      ))}
    </>
  );
}

// ── Economic markers (World Bank income-level coloring) ───────────────────────
const INCOME_COLOR: Record<string, string> = {
  HIC: '#16a34a', // Xanh lá — Phát triển cao
  UMC: '#0284c7', // Xanh dương — Thu nhập trên TB
  LMC: '#d97706', // Vàng hổ phách — Đang phát triển
  LIC: '#dc2626', // Đỏ — Kém phát triển
  INX: '#94a3b8', // Xám — Không phân loại
};
function EconomicMarkers({ features, onSelect }: { features: GeoItem[]; onSelect: (item: GeoItem) => void }) {
  const economies = features.filter(f => f.subCategory === 'country_economy');
  return (
    <>
      {/* Chấm màu từng quốc gia theo mức thu nhập World Bank */}
      {economies.map(e => {
        const fillColor = INCOME_COLOR[e.incomeLevelCode || 'INX'] || '#94a3b8';
        return (
          <CircleMarker key={e.id} center={[e.lat, e.lng]} radius={7}
            pathOptions={{ color: 'white', weight: 1.5, fillColor, fillOpacity: 0.85 }}
            eventHandlers={{ click: () => onSelect(e) }}>
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <span className="font-bold text-xs">{e.name}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

// ── Vietnam markers (34 tỉnh/TP mới từ 01/01/2025) ─────────────────────────────
const REGION_COLOR: Record<string, string> = {
  'Đồng bằng sông Hồng': '#3B82F6',
  'Đông Bắc Bộ': '#8B5CF6',
  'Tây Bắc Bộ': '#EC4899',
  'Bắc Trung Bộ': '#F97316',
  'Nam Trung Bộ': '#14B8A6',
  'Tây Nguyên': '#84CC16',
  'Đông Nam Bộ': '#F59E0B',
  'Đồng bằng sông Cửu Long': '#22C55E',
};

function VietnamMarkers({ features, onSelect, provinces }: { features: GeoItem[]; onSelect: (item: GeoItem) => void; provinces: any[] }) {
  const regions = features.filter(f => f.subCategory === 'vnRegion');
  const cities = features.filter(f => f.subCategory === 'vnCity');
  return (
    <>
      {/* Layer GeoJSON: 34 tỉnh/thành phố với label tên */}
      {provinces.map((prov, idx) => {
        const props = prov.properties;
        const region = props.region as string;
        const dotColor = REGION_COLOR[region] || '#64748B';
        const lat = prov.geometry.coordinates[1] as number;
        const lng = prov.geometry.coordinates[0] as number;
        return (
          <CircleMarker key={props.id || idx} center={[lat, lng]} radius={12}
            pathOptions={{ color: '#fff', weight: 2, fillColor: dotColor, fillOpacity: 0.9 }}
            eventHandlers={{
              click: () => onSelect({
                id: props.id,
                name: props.name,
                lat, lng,
                desc: `Vùng: ${region}${props.note ? ` (${props.note})` : ''}`,
                emoji: '🗺️',
                pop: props.pop,
                zone: region,
              })
            }}>
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent={false}>
              <span className="font-bold text-xs">{props.name}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
      {/* Regions — vùng kinh tế */}
      {regions.map(r => (
        <Marker key={r.id} position={[r.lat, r.lng]}
          icon={L.divIcon({
            html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));">${r.emoji || '📍'}</div>`,
            className: '', iconSize: [28, 28], iconAnchor: [14, 14]
          })}
          eventHandlers={{ click: () => onSelect(r) }}>
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <span className="font-bold text-xs">{r.name}</span>
          </Tooltip>
        </Marker>
      ))}
      {/* Cities — thành phố lớn */}
      {cities.map(c => (
        <Marker key={c.id} position={[c.lat, c.lng]}
          icon={emojiIcon(c.emoji || '🏙️', 22)}
          eventHandlers={{ click: () => onSelect(c) }}>
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <span className="font-bold text-xs">{c.emoji} {c.name}</span>
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

// ── Vietnam Click Handler — Nominatim reverse geocoding ──────────────────────
function VietnamClickHandler({ onProvince, onLoading }: {
  onProvince: (p: ReturnType<typeof findProvinceByName>) => void;
  onLoading: (v: boolean) => void;
}) {
  useMapEvents({
    click: async (e) => {
      onLoading(true);
      try {
        // Reverse geocode tại zoom 6 = cấp tỉnh/thành phố
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json&accept-language=vi&zoom=6`,
          { headers: { 'User-Agent': 'GeoExplore-Education/1.0' } }
        );
        if (!res.ok) throw new Error('Nominatim error');

        const data = await res.json();
        // Tên tỉnh từ Nominatim (có thể là tên cũ trước sáp nhập)
        const stateName = data.address?.state || data.address?.province
          || data.address?.county || data.display_name?.split(',')[0] || '';

        const province = findProvinceByName(stateName);
        onProvince(province);
      } catch {
        onProvince(null);
      } finally {
        onLoading(false);
      }
    },
  });
  return null;
}

// ── Props từ MapWrapper ──────────────────────────────────────────────────────
interface InteractiveMapProps {
  is3D: boolean;
  onToggle3D: () => void;
  mode: MapMode;
  onModeChange: (m: MapMode) => void;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function InteractiveMap({ is3D, onToggle3D, mode, onModeChange }: InteractiveMapProps) {
  const [selectedGeo, setSelectedGeo] = useState<GeoItem | null>(null);
  const [panelView, setPanelView] = useState<'none' | 'info' | 'legend'>('none');
  const [flyTarget, setFlyTarget] = useState<[number, number, number] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [vnFetching, setVnFetching] = useState(false);
  const [vnProvince, setVnProvince] = useState<VnProvince | null>(null); // tỉnh được click

  // Dữ liệu bản đồ 
  const [countries, setCountries] = useState<WorldCountry[]>([]);
  const [geoFeatures, setGeoFeatures] = useState<GeoItem[]>([]);
  const [vnProvinces, setVnProvinces] = useState<any[]>([]); // 34 tỉnh/TP mới

  // Trạng thái đồng bộ Database
  const [needsSeed, setNeedsSeed] = useState({ countries: false, features: false });
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');
  const [seedErrors, setSeedErrors] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const defaultCenter = MODES.find(m => m.id === 'political')!.center;

  // ── 1. Kiểm tra trạng thái DB khi load trang ──
  useEffect(() => {
    fetch('/api/map/countries').then(r => r.json()).then(d => {
      if (d.seeded) setCountries(d.countries);
      else setNeedsSeed(n => ({ ...n, countries: true }));
    }).catch(() => { });

    fetch('/api/map/features?category=status').then(r => r.json()).then(d => {
      if (!d.seeded) setNeedsSeed(n => ({ ...n, features: true }));
    }).catch(() => { });

    // Load GeoJSON 34 tỉnh/TP Việt Nam (luôn load từ public, không cần DB)
    fetch('/vietnam-provinces.geojson')
      .then(r => r.json())
      .then(data => {
        if (data.features) setVnProvinces(data.features);
      })
      .catch(() => { });
  }, []);

  // ── 2. Lấy dữ liệu Động khi chuyển Tab (ngoại trừ Political) ──
  useEffect(() => {
    if (mode === 'political') return; // Của riêng REST API
    if (needsSeed.features) return;   // Nếu DB chưa có, đợi nạp

    fetch(`/api/map/features?category=${mode}`)
      .then(r => r.json())
      .then((data: any[]) => {
        // Flat (trải phẳng) thuộc tính từ Map attribute ra thành dạng GeoItem cho Frontend
        const mapped: GeoItem[] = data.map(item => ({
          ...item,
          ...item.attributes
        }));
        setGeoFeatures(mapped);
      })
      .catch((err) => console.error('Lỗi tải DB tính năng:', err));
  }, [mode, needsSeed.features]);

  // ── 3. Nút Tải toàn bộ Dữ liệu Giáo dục (Đồng bộ) ──
  const handleGlobalSeed = async () => {
    setSeeding(true);
    setSeedErrors([]);
    setSeedMsg('⏳ Đang tải toàn bộ CSDL Giáo dục...');

    try {
      const errs: string[] = [];

      if (needsSeed.countries) {
        setSeedMsg('⏳ Đang kết nối REST Countries API...');
        const r1 = await fetch('/api/map/countries', { method: 'POST' });
        const d1 = await r1.json();
        if (r1.ok) {
          const rr1 = await fetch('/api/map/countries').then(r => r.json());
          setCountries(rr1.countries);
          setNeedsSeed(n => ({ ...n, countries: false }));
        } else {
          errs.push(`Lỗi Quốc gia: ${d1.error || 'Server error'}`);
        }
      }

      if (needsSeed.features) {
        setSeedMsg('⏳ Đang phân tích Bộ dữ liệu tự nhiên...');
        const r2 = await fetch('/api/map/features', { method: 'POST' });
        const d2 = await r2.json();
        if (r2.ok || d2.success) { // Nếu d2.success dù 400 (có vài lỗi nhỏ nhưng vẫn seed được)
          if (d2.errors) errs.push(...d2.errors);
          setNeedsSeed(n => ({ ...n, features: false }));
        } else {
          errs.push(`Lỗi Hệ thống gốc: ${d2.error || 'Không rõ nguyên nhân'}`);
        }
      }

      if (errs.length > 0) {
        setSeedErrors(errs);
        setSeedMsg('⚠️ Hoàn tất tải dữ liệu, nhưng có rủi ro (xem chi tiết).');
      } else {
        setSeedMsg('✅ Tải toàn bộ dữ liệu thành công!');
        setTimeout(() => setSeedMsg(''), 5000);
      }
    } catch (e: any) {
      setSeedErrors([e.message || 'Lỗi mạng nội bộ']);
      setSeedMsg('❌ Mất kết nối tới Server.');
    } finally {
      setSeeding(false);
    }
  };

  // Search via Nominatim
  const handleSearch = useCallback((q: string) => {
    setSearchQ(q);
    clearTimeout(searchTimer.current);
    if (!q.trim() || q.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=vi`,
          { headers: { 'User-Agent': 'GeoExplore-App/1.0' } }
        );
        const data = await res.json();
        setSearchResults(data);
      } catch { setSearchResults([]); }
    }, 450);
  }, []);

  const handleSelectResult = (r: any) => {
    setFlyTarget([parseFloat(r.lat), parseFloat(r.lon), 8]);
    setSearchQ(r.display_name.split(',')[0]);
    setSearchResults([]);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleModeChange = (m: MapMode) => {
    onModeChange(m);
    setSelectedGeo(null);
    setPanelView('none');
    setFlyTarget(null);
    setSearchQ('');
    setSearchResults([]);
  };

  const handleSelectGeo = (item: GeoItem) => {
    setSelectedGeo(item);
    setPanelView('info');
    trackMission('explore-map', 1);
  };

  const currentTile = TILES[mode];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-80px)] rounded-[32px] overflow-hidden border border-white/40 shadow-[0_20px_50px_rgba(14,165,233,0.15)] mt-6"
    >
      {/* ── Map: Leaflet 2D (Mapbox 3D được render ở MapWrapper) ── */}
      <div className="absolute inset-0">
        <MapContainer
          center={defaultCenter}
          zoom={2}
          minZoom={2}
          maxBounds={[[-85, -220], [85, 220]]}
          maxBoundsViscosity={0.7}
          scrollWheelZoom
          className="w-full h-full"
          zoomControl={false}
        >
          <TileLayer url={currentTile.url} attribution={currentTile.attr} key={mode} />
          {/* Lớp viền biên giới + tên quốc gia đè lên ảnh vệ tinh (chỉ dùng cho mode political) */}
          {currentTile.overlay && (
            <TileLayer url={currentTile.overlay} key={`${mode}-overlay`} opacity={0.8} />
          )}

          {/* Lớp phủ bản đồ Khí hậu Köppen-Geiger từ Local */}
          {mode === 'climate' && (
            <ImageOverlay
              url="/koppen.svg"
              bounds={[[-90, -180], [90, 180]]}
              opacity={0.5}
              zIndex={10}
            />
          )}

          <MapController mode={mode} flyTarget={flyTarget} />

          {/* Lớp WMS chính thức 34 tỉnh/TP Việt Nam (Bộ NN&MT - cache.bando.com.vn) */}
          {mode === 'vietnam' && (
            <>
              {/* Lớp Bản đồ nền + ranh giới 34 tỉnh/TP mới (hiệu lực từ 01/01/2025) */}
              <WMSTileLayer
                key="vn-wms-boundary"
                url="https://cache.bando.com.vn/service"
                layers="vietnam_2026"
                format="image/png"
                transparent={true}
                version="1.3.0"
                opacity={0.95}
                attribution="© Bộ Nông nghiệp và Môi trường VN | NXB Tài nguyên Môi trường và Bản đồ"
              />
              {/* Lớp Nhãn tên đơn vị hành chính */}
              <WMSTileLayer
                key="vn-wms-label"
                url="https://cache.bando.com.vn/service"
                layers="vietnam_label_2026"
                format="image/png"
                transparent={true}
                version="1.3.0"
                opacity={1}
              />
            </>
          )}

          {mode === 'political' && (
            <>
              <PoliticalMarkers countries={countries} onSelect={handleSelectGeo} />
            </>
          )}
          {mode === 'physical' && <PhysicalMarkers features={geoFeatures} onSelect={handleSelectGeo} />}
          {mode === 'climate' && <ClimateMarkers features={geoFeatures} onSelect={handleSelectGeo} />}
          {mode === 'ocean' && <OceanMarkers features={geoFeatures} onSelect={handleSelectGeo} />}
          {mode === 'economic' && <EconomicMarkers features={geoFeatures} onSelect={handleSelectGeo} />}

          {/* Click handler — Nominatim reverse geocoding, hoạt động khi mode Vietnam */}
          {mode === 'vietnam' && (
            <VietnamClickHandler
              onProvince={(p) => setVnProvince(p)}
              onLoading={setVnFetching}
            />
          )}
        </MapContainer>
      </div>

      {/* Loading spinner khi đang query WMS GetFeatureInfo */}
      {vnFetching && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-xl border border-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-[#082F49]">Đang tra cứu thông tin...</span>
        </div>
      )}


      {/* Vietnam Province Info Panel — hiển thị khi click tỉnh/TP */}
      {mode === 'vietnam' && vnProvince && (
        <div className="absolute top-[76px] right-4 w-[320px] max-w-[calc(100vw-32px)] z-[999] bg-white/92 backdrop-blur-2xl border border-white rounded-[24px] shadow-[0_20px_40px_rgba(8,47,73,0.12)] overflow-hidden transition-all duration-300">
          {/* Header — tên tỉnh và loại DVHC */}
          <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-cyan-50 to-emerald-50 border-b border-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-0.5">{vnProvince.type}</p>
                <p className="text-base font-black text-[#082F49] leading-tight">{vnProvince.name}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{vnProvince.region}</p>
              </div>
              <button
                onClick={() => setVnProvince(null)}
                className="w-6 h-6 rounded-full bg-white/80 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors text-xs flex items-center justify-center flex-shrink-0 mt-0.5"
              >✕</button>
            </div>
          </div>

          {/* Thông tin chính */}
          <div className="p-4 space-y-2 max-h-[55vh] overflow-y-auto">
            {/* Trung tâm hành chính & Liên hệ */}
            <div className="bg-blue-50 rounded-[12px] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏛️</span>
                <div>
                  <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Trung tâm Hành chính</p>
                  <p className="text-xs font-bold text-[#082F49]">{vnProvince.capital}</p>
                </div>
              </div>

              {vnProvince.address && (
                <div className="flex items-start gap-2 border-t border-blue-100/50 pt-2">
                  <span className="text-sm mt-0.5">📍</span>
                  <div>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Địa chỉ trụ sở</p>
                    <p className="text-[10px] font-medium text-[#334155] leading-snug">{vnProvince.address}</p>
                  </div>
                </div>
              )}

              {vnProvince.phone && (
                <div className="flex items-center gap-2 border-t border-blue-100/50 pt-2">
                  <span className="text-sm">📞</span>
                  <div>
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Điện thoại</p>
                    <p className="text-[10px] font-bold text-[#334155]">{vnProvince.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Diện tích + Dân số hàng ngang */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-50 rounded-[12px] px-3 py-2">
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Diện tích</p>
                <p className="text-xs font-bold text-[#082F49]">{vnProvince.area.toLocaleString('vi-VN')} km²</p>
              </div>
              <div className="bg-violet-50 rounded-[12px] px-3 py-2">
                <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Dân số</p>
                <p className="text-xs font-bold text-[#082F49]">{(vnProvince.population / 1_000_000).toFixed(1)} triệu</p>
              </div>
            </div>

            {/* Số DVHCCS */}
            <div className="flex items-center gap-3 bg-amber-50 rounded-[12px] px-3 py-2">
              <span className="text-base">🏘️</span>
              <div>
                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Số ĐVHC cấp xã</p>
                <p className="text-xs font-bold text-[#082F49]">{vnProvince.units}</p>
              </div>
            </div>

            {/* Sáp nhập từ */}
            {vnProvince.mergedFrom.length > 1 && (
              <div className="bg-rose-50 rounded-[12px] px-3 py-2">
                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">🔄 Sáp nhập từ (01/01/2025)</p>
                <div className="flex flex-wrap gap-1">
                  {vnProvince.mergedFrom.map(p => (
                    <span key={p} className="text-[10px] font-bold bg-white/80 text-[#082F49] px-2 py-0.5 rounded-full border border-rose-100">{p}</span>
                  ))}
                </div>
              </div>
            )}
            {vnProvince.mergedFrom.length === 1 && (
              <div className="flex items-center gap-2 bg-slate-50 rounded-[12px] px-3 py-2">
                <span className="text-base">✅</span>
                <p className="text-[10px] font-semibold text-slate-500">Giữ nguyên, không sáp nhập</p>
              </div>
            )}

            {/* Nghị quyết */}
            {vnProvince.decree && (
              <div className="flex items-center gap-3 bg-slate-50 rounded-[12px] px-3 py-2">
                <span className="text-base">📜</span>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nghị quyết sáp nhập</p>
                  <p className="text-[10px] font-bold text-[#082F49]">{vnProvince.decree}</p>
                </div>
              </div>
            )}

            {/* Mã DVHC */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-[12px] px-3 py-2">
              <span className="text-base">🔤</span>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Mã ĐVHC (QĐ 19/2025)</p>
                <p className="text-xs font-bold text-[#082F49]">{vnProvince.code}</p>
              </div>
            </div>
          </div>

          {/* Footer nguồn dữ liệu */}
          <div className="px-4 py-2 bg-emerald-50 border-t border-slate-100">
            <p className="text-[9px] font-bold text-emerald-700">✅ Cập nhật 01/2025 · QĐ 19/2025/QĐ-TTg · NXB Bản đồ VN</p>
          </div>
        </div>
      )}
      {/* ── Banner Đồng bộ dữ liệu CSDL (Tích hợp) ── */}
      {(needsSeed.countries || needsSeed.features) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-xl border border-white rounded-[24px] px-6 py-5 shadow-2xl w-[400px]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🗄️</span>
            <div>
              <p className="text-sm font-black text-[#082F49]">Cơ sở Dữ liệu Bản đồ</p>
              <p className="text-[10px] font-bold text-emerald-600">Đồng bộ Hệ thống Giáo Dục</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-3 text-xs text-slate-600 space-y-1 mb-4 shadow-inner">
            <p className="flex justify-between items-center font-bold">
              <span>Quốc gia (REST API)</span>
              <span>{needsSeed.countries ? '❌ Trống' : '✅ Đã tải'}</span>
            </p>
            <p className="flex justify-between items-center font-bold">
              <span>Thực tế & Kinh tế</span>
              <span>{needsSeed.features ? '❌ Trống' : '✅ Đã xử lý'}</span>
            </p>
          </div>

          <button
            onClick={handleGlobalSeed}
            disabled={seeding}
            className="w-full h-11 rounded-[14px] bg-[#0F172A] text-white text-sm font-bold disabled:opacity-60 transition-all hover:bg-[#1E293B] shadow-[0_8px_20px_rgba(15,23,42,0.2)] flex items-center justify-center gap-2"
          >
            {seeding ? <span className="animate-spin text-lg block">⏳</span> : '⬇️ Cập nhật Dữ liệu ngay'}
          </button>

          {seedMsg && <p className="text-xs font-bold text-center mt-3 text-[#0F172A]">{seedMsg}</p>}

          {seedErrors.length > 0 && (
            <div className="mt-3 bg-red-50 text-red-600 text-[10px] p-2 rounded-lg max-h-24 overflow-y-auto w-full font-mono border border-red-100 text-left">
              {seedErrors.map((e, idx) => (
                <div key={idx} className="border-b border-red-100 last:border-0 py-1">- {e}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2">
        {/* Logo */}
        <div className="shrink-0 bg-white/80 backdrop-blur-xl border border-white px-4 py-2.5 rounded-[18px] shadow-sm flex items-center gap-2">
          <span className="text-xl">🌍</span>
          <div>
            <p className="text-sm font-black text-[#082F49] leading-none">GeoMap</p>
            <p className="text-[9px] font-bold text-cyan-600 mt-0.5">Bản Đồ Học Tập</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="flex items-center bg-white/80 backdrop-blur-xl border border-white rounded-[18px] shadow-sm px-3 py-2.5">
            <span className="text-slate-400 mr-2 text-sm">🔍</span>
            <input
              type="text"
              value={searchQ}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Tìm địa danh, quốc gia..."
              className="flex-1 bg-transparent text-sm font-medium text-[#082F49] placeholder-slate-400 outline-none min-w-0"
            />
            {searchQ && (
              <button onClick={() => { setSearchQ(''); setSearchResults([]); }} className="text-slate-400 hover:text-slate-600 ml-1 text-xs">✕</button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 bg-white/95 backdrop-blur-xl border border-white rounded-[18px] shadow-xl overflow-hidden z-50">
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#082F49] font-medium hover:bg-cyan-50 transition-colors border-b border-slate-50 last:border-0">
                  <p className="font-bold truncate text-xs">{r.display_name.split(',')[0]}</p>
                  <p className="text-[10px] text-slate-400 truncate">{r.display_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <button
          onClick={() => setPanelView(v => v === 'legend' ? 'none' : 'legend')}
          title="Chú giải"
          className={`w-10 h-10 rounded-[14px] border backdrop-blur-xl flex items-center justify-center text-base transition-all ${panelView === 'legend' ? 'bg-cyan-500 text-white border-cyan-400 shadow-md' : 'bg-white/80 border-white text-slate-600 hover:bg-white'}`}
        >📋</button>

        {/* Nút 2D / 3D */}
        <button
          onClick={() => { onToggle3D(); setPanelView('none'); setSelectedGeo(null); }}
          title="Bật chế độ 3D"
          className="h-10 px-3 rounded-[14px] border bg-white/80 border-white backdrop-blur-xl flex items-center gap-1.5 text-xs font-black text-slate-600 hover:bg-white transition-all"
        >
          <span className="text-base">🌐</span> 3D
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toàn màn hình"
          className="w-10 h-10 rounded-[14px] bg-white/80 backdrop-blur-xl border border-white flex items-center justify-center text-sm hover:bg-white transition-all"
        >{isFullscreen ? '✕' : '⧆'}</button>
      </div>

      {/* ── Right panel: Legend or Info ── */}
      <div className={`absolute top-[76px] right-4 w-[290px] max-w-[calc(100vw-32px)] bg-white/85 backdrop-blur-2xl border border-white rounded-[24px] shadow-[0_20px_40px_rgba(8,47,73,0.12)] p-5 z-[999] transition-all duration-400 ${panelView !== 'none' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
        {/* Legend */}
        {panelView === 'legend' && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-[#082F49] text-sm">📋 Chú giải</p>
              <button onClick={() => setPanelView('none')} className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors text-xs flex items-center justify-center">✕</button>
            </div>
            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              {MODES.find(m => m.id === mode)?.icon} {MODES.find(m => m.id === mode)?.label}
              {mode === 'vietnam' && (
                <span className="ml-auto text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✅ Cập nhật 01/2025</span>
              )}
            </p>
            {LEGENDS[mode].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 mb-2">
                {item.color ? (
                  <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color + '40', border: `2px solid ${item.color}` }} />
                ) : (
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                )}
                <span className="text-xs font-semibold text-[#334155]">{item.label}</span>
              </div>
            ))}
          </>
        )}

        {/* Info panel */}
        {panelView === 'info' && selectedGeo && (() => {
          // Parse languages & currencies nếu có (Political mode)
          let langList: string[] = [];
          let currList: string[] = [];
          try {
            if (selectedGeo.langs) {
              langList = Object.values(JSON.parse(selectedGeo.langs)) as string[];
            }
          } catch { }
          try {
            if (selectedGeo.currs) {
              const currObj = JSON.parse(selectedGeo.currs);
              currList = Object.entries(currObj).map(([code, v]: [string, any]) =>
                v?.name ? `${v.name} (${code})` : code
              );
            }
          } catch { }

          return (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100 text-3xl rounded-[14px] border border-white shadow-sm">
                    {selectedGeo.emoji || '📍'}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#082F49] leading-tight">{selectedGeo.name}</h3>
                    {selectedGeo.nameEn && selectedGeo.nameEn !== selectedGeo.name && (
                      <p className="text-[10px] italic text-cyan-600 mt-0.5">{selectedGeo.nameEn}</p>
                    )}
                    {(selectedGeo.subregion || selectedGeo.continent) && (
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{selectedGeo.subregion || selectedGeo.continent}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setPanelView('none')} className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors text-xs flex items-center justify-center flex-shrink-0">✕</button>
              </div>

              {/* Info rows */}
              <div className="space-y-1.5">
                {selectedGeo.capitalCity && (
                  <div className="flex items-center gap-2 bg-cyan-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">🏛️</span>
                    <div>
                      <p className="text-[9px] font-bold text-cyan-500 uppercase tracking-wider">Thủ đô</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.capitalCity}</p>
                    </div>
                  </div>
                )}
                {(selectedGeo.country || selectedGeo.continent) && (
                  <div className="flex items-center gap-2 bg-violet-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">🌍</span>
                    <div>
                      <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Khu vực</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.subregion || selectedGeo.country || selectedGeo.continent}</p>
                    </div>
                  </div>
                )}
                {selectedGeo.featureClass && (
                  <div className="flex items-center gap-2 bg-fuchsia-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">📌</span>
                    <div>
                      <p className="text-[9px] font-bold text-fuchsia-500 uppercase tracking-wider">Phân loại Khoa học</p>
                      <p className="text-xs font-bold text-[#082F49] capitalize">{selectedGeo.featureClass}</p>
                    </div>
                  </div>
                )}
                {selectedGeo.rank !== undefined && (
                  <div className="flex items-center gap-2 bg-orange-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">⭐</span>
                    <div>
                      <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Quy mô / Hạng</p>
                      <p className="text-xs font-bold text-[#082F49]">Cấp {selectedGeo.rank} (ScaleRank)</p>
                    </div>
                  </div>
                )}
                {selectedGeo.pop && selectedGeo.pop > 0 && (
                  <div className="flex items-center gap-2 bg-rose-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">👥</span>
                    <div>
                      <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Dân số</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.pop.toLocaleString('vi-VN')} người</p>
                    </div>
                  </div>
                )}
                {selectedGeo.area && selectedGeo.area > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">📐</span>
                    <div>
                      <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Diện tích</p>
                      <p className="text-xs font-bold text-[#082F49]">{Math.round(selectedGeo.area).toLocaleString('vi-VN')} km²</p>
                    </div>
                  </div>
                )}
                {langList.length > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">🗣️</span>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Ngôn ngữ</p>
                      <p className="text-xs font-bold text-[#082F49] line-clamp-2">{langList.join(', ')}</p>
                    </div>
                  </div>
                )}
                {currList.length > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">💱</span>
                    <div>
                      <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Tiền tệ</p>
                      <p className="text-xs font-bold text-[#082F49] line-clamp-2">{currList.join(', ')}</p>
                    </div>
                  </div>
                )}
                {/* Đặc điểm khác (Physical, Climate...) */}
                {selectedGeo.elevation && selectedGeo.elevation > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">⛰️</span>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Độ cao</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.elevation.toLocaleString()} m</p>
                    </div>
                  </div>
                )}
                {selectedGeo.length && (
                  <div className="flex items-center gap-2 bg-slate-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">📏</span>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Chiều dài</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.length.toLocaleString()} km</p>
                    </div>
                  </div>
                )}
                {selectedGeo.depth && (
                  <div className="flex items-center gap-2 bg-indigo-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">🌊</span>
                    <div>
                      <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Độ sâu cực đại</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.depth.toLocaleString()} m</p>
                    </div>
                  </div>
                )}
                {selectedGeo.speed && (
                  <div className="flex items-center gap-2 bg-pink-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">🚤</span>
                    <div>
                      <p className="text-[9px] font-bold text-pink-500 uppercase tracking-wider">Tốc độ dòng chảy</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.speed}</p>
                    </div>
                  </div>
                )}
                {/* === Dữ liệu Kinh tế (World Bank) === */}
                {selectedGeo.incomeLevel && (
                  <div className="flex items-center gap-2 rounded-[10px] px-3 py-1.5"
                    style={{ backgroundColor: (INCOME_COLOR[selectedGeo.incomeLevelCode || 'INX'] || '#94a3b8') + '18' }}>
                    <span className="text-sm">📊</span>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider"
                        style={{ color: INCOME_COLOR[selectedGeo.incomeLevelCode || 'INX'] }}>Mức phát triển</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.incomeLevel}</p>
                    </div>
                  </div>
                )}
                {selectedGeo.gdpPerCapita != null && (
                  <div className="flex items-center gap-2 bg-emerald-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">💵</span>
                    <div>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">GDP / Đầu người</p>
                      <p className="text-xs font-bold text-[#082F49]">
                        {selectedGeo.gdpPerCapita.toLocaleString('vi-VN')} USD
                      </p>
                    </div>
                  </div>
                )}
                {selectedGeo.gdpTotal != null && (
                  <div className="flex items-center gap-2 bg-green-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">🏦</span>
                    <div>
                      <p className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Tổng GDP</p>
                      <p className="text-xs font-bold text-[#082F49]">
                        {selectedGeo.gdpTotal.toLocaleString('vi-VN')} tỷ USD
                      </p>
                    </div>
                  </div>
                )}
                {selectedGeo.population != null && (
                  <div className="flex items-center gap-2 bg-violet-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">👥</span>
                    <div>
                      <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Dân số</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.population.toLocaleString('vi-VN')} người</p>
                    </div>
                  </div>
                )}
                {selectedGeo.unemployment != null && (
                  <div className="flex items-center gap-2 bg-orange-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">📉</span>
                    <div>
                      <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Tỷ lệ thất nghiệp</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.unemployment}%</p>
                    </div>
                  </div>
                )}
                {selectedGeo.lifeExpectancy != null && (
                  <div className="flex items-center gap-2 bg-rose-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">❤️</span>
                    <div>
                      <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Tuổi thọ trung bình</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.lifeExpectancy} tuổi</p>
                    </div>
                  </div>
                )}
                {selectedGeo.zone && (
                  <div className="flex items-center gap-2 bg-amber-50 rounded-[10px] px-3 py-1.5">
                    <span className="text-sm">🌡️</span>
                    <div>
                      <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Đới khí hậu</p>
                      <p className="text-xs font-bold text-[#082F49]">{selectedGeo.zone}</p>
                    </div>
                  </div>
                )}
                {selectedGeo.comment && (
                  <div className="flex bg-white/60 border border-slate-100 rounded-[10px] p-2 mt-2 shadow-sm backdrop-blur-md">
                    <span className="text-sm mr-2 mt-0.5">💡</span>
                    <p className="text-[10px] font-medium text-slate-600 leading-relaxed italic border-l-[3px] border-cyan-300 pl-2">
                      {selectedGeo.comment}
                    </p>
                  </div>
                )}
              </div>
              {/* Mô tả */}
              {selectedGeo.desc && (
                <p className="text-xs text-[#334155] leading-relaxed mt-3 font-medium border-t border-slate-100 pt-3">{selectedGeo.desc}</p>
              )}
            </>
          );
        })()}

      </div>

      {/* ── Mode Dock ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-1.5 p-1.5 bg-white/65 backdrop-blur-2xl border border-white rounded-[28px] shadow-[0_10px_30px_rgba(8,47,73,0.15)] overflow-x-auto max-w-[calc(100vw-24px)]">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={`flex flex-col items-center justify-center min-w-[68px] h-[58px] rounded-[20px] font-bold text-xs transition-all duration-300 whitespace-nowrap px-2 ${mode === m.id
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg -translate-y-1 scale-105'
                : 'bg-white/40 text-slate-600 hover:bg-white/80 hover:text-cyan-600'
              }`}
          >
            <span className="text-lg mb-0.5">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
