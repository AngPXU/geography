'use client';
import React from 'react';
import dynamic from 'next/dynamic';

export function calcDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const CATEGORY_LABEL: Record<string, { label: string; icon: string }> = {
  mountain:        { label: 'Đỉnh Núi',   icon: '⛰️' },
  river:           { label: 'Con Sông',   icon: '🌞️' },
  ocean:           { label: 'Đại Dương',  icon: '🌊' },
  lake:            { label: 'Hồ',         icon: '💧' },
  desert:          { label: 'Sa Mạc',     icon: '🐪' },
  plain:           { label: 'Đồng Bằng',  icon: '🌾' },
  island:          { label: 'Đảo',        icon: '🏖️' },
  volcano:         { label: 'Núi Lửa',   icon: '🌋' },
  country_economy: { label: 'Quốc Gia',   icon: '🌍' },
  country:         { label: 'Quốc Gia',   icon: '🌍' },
};

export function getCat(sub: string) {
  return CATEGORY_LABEL[sub] ?? { label: sub, icon: '📍' };
}

export function getGrade(pts: number) {
  if (pts >= 800) return { label: '🌟 Xuất Sắc!',      barColor: 'from-emerald-400 to-green-500', textColor: 'text-emerald-600', badgeBg: 'bg-emerald-50 border-emerald-200' };
  if (pts >= 500) return { label: '👍 Rất Tốt!',        barColor: 'from-cyan-400 to-blue-500',     textColor: 'text-cyan-600',     badgeBg: 'bg-cyan-50 border-cyan-200'       };
  if (pts >= 200) return { label: '😊 Khá Ổn',          barColor: 'from-amber-400 to-orange-400',  textColor: 'text-amber-600',    badgeBg: 'bg-amber-50 border-amber-200'     };
  return           { label: '💪 Cố Gắng Hơn!',         barColor: 'from-rose-400 to-red-500',      textColor: 'text-rose-600',     badgeBg: 'bg-rose-50 border-rose-200'       };
}

export function TargetInfoGrid({ target }: { target: any }) {
  const rows: { icon: string; label: string; value: string }[] = [];
  if (target.elevation)      rows.push({ icon: '📐', label: 'Độ cao',       value: `${Number(target.elevation).toLocaleString('vi-VN')} m` });
  if (target.length)         rows.push({ icon: '📐', label: 'Chiều dài',    value: `${Number(target.length).toLocaleString('vi-VN')} km` });
  if (target.depth)          rows.push({ icon: '🌊', label: 'Độ sâu',       value: `${Number(target.depth).toLocaleString('vi-VN')} m` });
  if (target.area)           rows.push({ icon: '🗺️', label: 'Diện tích',   value: `${Number(target.area).toLocaleString('vi-VN')} km²` });
  if (target.population)     rows.push({ icon: '👥', label: 'Dân số',       value: `${(Number(target.population) / 1_000_000).toFixed(1)} triệu` });
  if (target.gdpTotal)       rows.push({ icon: '🏦', label: 'GDP',          value: `$${Number(target.gdpTotal).toFixed(1)} tỷ` });
  if (target.gdpPerCapita)   rows.push({ icon: '💰', label: 'GDP/người',    value: `$${Number(target.gdpPerCapita).toLocaleString('vi-VN')}` });
  if (target.lifeExpectancy) rows.push({ icon: '❤️', label: 'Tuổi thọ',    value: `${target.lifeExpectancy} tuổi` });
  if (target.unemployment)   rows.push({ icon: '📊', label: 'Thất nghiệp', value: `${Number(target.unemployment).toFixed(1)}%` });
  if (target.region)         rows.push({ icon: '🌐', label: 'Khu vực',      value: target.region });
  if (target.incomeLevel)    rows.push({ icon: '💳', label: 'Thu nhập',     value: target.incomeLevel });
  if (target.country)        rows.push({ icon: '🏳️', label: 'Quốc gia',   value: target.country });
  if (target.continent)      rows.push({ icon: '🌍', label: 'Châu lục',    value: target.continent });
  if (!rows.length) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.slice(0, 6).map((r, i) => (
        <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-[14px] px-3 py-2">
          <span className="text-lg shrink-0">{r.icon}</span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">{r.label}</p>
            <p className="text-sm font-black text-[#082F49] leading-tight truncate">{r.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
export const TileLayer    = dynamic(() => import('react-leaflet').then(m => m.TileLayer),    { ssr: false });
export const Marker       = dynamic(() => import('react-leaflet').then(m => m.Marker),       { ssr: false });
export const Polyline     = dynamic(() => import('react-leaflet').then(m => m.Polyline),     { ssr: false });

export const MapController = dynamic(
  () => import('react-leaflet').then(m => {
    const { useMap, useMapEvents } = m;
    return function MC({
      onMapClick,
      boundsKey,
      boundsArr,
    }: {
      onMapClick?: (ll: any) => void;
      boundsKey: string;
      boundsArr: [[number, number], [number, number]] | null;
    }) {
      const map = useMap();
      useMapEvents({ click(e) { if(onMapClick) onMapClick(e.latlng); } });
      React.useEffect(() => {
        if (!boundsArr) return;
        const t = setTimeout(() => {
          try { map.fitBounds(boundsArr as any, { padding: [110, 110], maxZoom: 9, animate: true, duration: 0.9 }); } catch { /* ignore */ }
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [boundsKey]);
      return null;
    };
  }),
  { ssr: false }
);

export const TOPIC_MODES = [
  { key: 'all',          icon: '🎲', label: 'Đấu Trường Ngẫu Nhiên', sub: 'Mix tất cả chủ đề',           span: true,  grad: 'from-rose-400 to-orange-400',   sh: 'shadow-rose-200'    },
  { key: 'country',      icon: '🌍', label: 'Khám phá Quốc Gia',     sub: 'Tìm vị trí các quốc gia',     span: false, grad: 'from-cyan-400 to-blue-400',     sh: 'shadow-cyan-200'    },
  { key: 'mountain',     icon: '⛰️', label: 'Đỉnh Núi Kỷ Lục',      sub: 'Các ngọn núi cao nhất',        span: false, grad: 'from-slate-500 to-slate-700',   sh: 'shadow-slate-200'   },
  { key: 'river',        icon: '🌞️', label: 'Sông Ngòi Thế Giới',   sub: 'Các dòng sông lớn',            span: false, grad: 'from-teal-400 to-emerald-500',  sh: 'shadow-teal-200'    },
  { key: 'country_pop',  icon: '👥', label: 'Định Vị Dân Số',        sub: 'Đoán quốc gia từ dân số',      span: false, grad: 'from-violet-400 to-purple-500', sh: 'shadow-violet-200'  },
  { key: 'country_gdp',  icon: '🏦', label: 'Tìm GDP Cường Quốc',   sub: 'Đoán quốc gia từ GDP',          span: false, grad: 'from-amber-400 to-yellow-500',  sh: 'shadow-amber-200'   },
  { key: 'country_life', icon: '❤️', label: 'Tuổi Thọ & Mức Sống',  sub: 'Đoán quốc gia từ tuổi thọ TB', span: true,  grad: 'from-pink-400 to-rose-500',     sh: 'shadow-pink-200'    },
];

export function buildQuestions(topic: string, pool: any[]) {
    let subPool = pool;
    if (topic === 'mountain') subPool = subPool.filter(f => f.subCategory === 'mountain');
    if (topic === 'river')    subPool = subPool.filter(f => f.subCategory === 'river');
    if (topic === 'country' || topic.startsWith('country_')) {
      subPool = subPool.filter(f => f.subCategory === 'country_economy');
      if (topic === 'country_pop')  subPool = subPool.filter(f => f.population);
      if (topic === 'country_gdp')  subPool = subPool.filter(f => f.gdpTotal);
      if (topic === 'country_life') subPool = subPool.filter(f => f.lifeExpectancy);
    }
    return [...subPool].sort(() => Math.random() - 0.5).slice(0, 10).map(t => {
      const cat = getCat(t.subCategory ?? '');
      let qTitle = cat.icon + ' ' + cat.label;
      let qText  = t.name;
      let qDesc  = t.desc ?? '';
      if (topic === 'country_pop' && t.population) {
        qTitle = '👥 Thử thách Dân Số';
        qText  = `Quốc gia có ~${(Number(t.population) / 1_000_000).toFixed(1)} triệu dân`;
        qDesc  = `Khu vực: ${t.region ?? '?'} • Thu nhập: ${t.incomeLevel ?? '?'}`;
      } else if (topic === 'country_gdp' && t.gdpTotal) {
        qTitle = '🏦 Thử thách GDP';
        qText  = `Quốc gia có GDP ≈ $${Number(t.gdpTotal).toFixed(0)} tỷ USD`;
        qDesc  = `Khu vực: ${t.region ?? '?'} • GDP/người: $${Number(t.gdpPerCapita ?? 0).toFixed(0)}`;
      } else if (topic === 'country_life' && t.lifeExpectancy) {
        qTitle = '❤️ Thử thách Tuổi Thọ';
        qText  = `Quốc gia có tuổi thọ TB ${t.lifeExpectancy} tuổi`;
        qDesc  = `Khu vực: ${t.region ?? '?'} • GDP/người: $${Number(t.gdpPerCapita ?? 0).toFixed(0)}`;
      } else if (t.subCategory === 'mountain' && t.elevation) {
        qDesc = `Cao ${Number(t.elevation).toLocaleString('vi-VN')} m so với mực nước biển${t.country ? ' • ' + t.country : ''}`;
      } else if (t.subCategory === 'river' && t.length) {
        qDesc = `Dài ${Number(t.length).toLocaleString('vi-VN')} km${t.continent ? ' • ' + t.continent : ''}`;
      } else if (t.subCategory === 'country_economy' && t.region) {
        qDesc = `${t.region}${t.incomeLevel ? ' • ' + t.incomeLevel : ''}`;
      }
      return { ...t, qTitle, qText, qDesc };
    });
}
