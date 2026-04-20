'use client';
import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { trackMission } from '@/utils/missionTracker';
import { calcDistanceKM, getGrade, getCat, TargetInfoGrid, MapContainer, TileLayer, Marker, Polyline, MapController, buildQuestions, TOPIC_MODES } from '@/utils/map-guessing-utils';

export default function MapGuessSolo({ topic, dbFeatures, onSummary }: { topic: string, dbFeatures: any[], onSummary: (score: number) => void }) {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [guessLat, setGuessLat] = useState<number | null>(null);
  const [guessLng, setGuessLng] = useState<number | null>(null);
  const [roundDistance, setRoundDistance] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState(0);
  const [roundEnd, setRoundEnd] = useState(false);
  const [guessIcon, setGuessIcon] = useState<any>(null);
  const [targetIcon, setTargetIcon] = useState<any>(null);

  useEffect(() => {
    setQueue(buildQuestions(topic, dbFeatures));
  }, [topic, dbFeatures]);

  useEffect(() => {
    import('leaflet').then(({ default: L }) => {
      setGuessIcon(L.divIcon({
        className: '',
        html: '<div style="width:20px;height:20px;border-radius:50%;background:#06B6D4;border:3px solid white;box-shadow:0 0 0 3px rgba(6,182,212,0.35),0 3px 10px rgba(0,0,0,0.3)"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10],
      }));
      setTargetIcon(L.divIcon({
        className: 'geo-target-icon',
        html: '<div style="position:relative;width:36px;height:36px"><div class="geo-ring" style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.25)"></div><div style="position:absolute;inset:6px;border-radius:50%;background:#EF4444;border:3px solid white;box-shadow:0 0 0 3px rgba(239,68,68,0.4),0 4px 14px rgba(0,0,0,0.35)"></div></div>',
        iconSize: [36, 36], iconAnchor: [18, 18],
      }));
    });
  }, []);

  const handleMapClick = useCallback((latlng: any) => {
    if (roundEnd) return;
    const target = queue[currentRound];
    if (!target) return;
    const dist = calcDistanceKM(latlng.lat, latlng.lng, target.lat, target.lng);
    const pts  = dist <= 50 ? 1000 : dist > 5000 ? 0 : Math.round(1000 * (1 - dist / 5000));
    setGuessLat(latlng.lat); setGuessLng(latlng.lng);
    setRoundDistance(dist);  setRoundScore(pts);
    setScore(s => s + pts);  setRoundEnd(true);
  }, [roundEnd, queue, currentRound]);

  const nextRound = async () => {
    if (currentRound >= 9) {
      trackMission('play-arena', 1);
      onSummary(score);
    } else {
      setCurrentRound(c => c + 1); setGuessLat(null); setGuessLng(null); setRoundDistance(null); setRoundEnd(false); 
    }
  };

  const target = queue[currentRound];
  const boundsArr: [[number, number], [number, number]] | null =
    roundEnd && guessLat !== null && guessLng !== null && target
      ? [[Math.min(guessLat, target.lat), Math.min(guessLng, target.lng)],
         [Math.max(guessLat, target.lat), Math.max(guessLng, target.lng)]]
      : null;
  const boundsKey = boundsArr ? boundsArr.flat().join(',') : '';

  if (!target) return null;
  const grade = getGrade(roundScore);
  const cat = getCat(target.subCategory ?? '');

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#082F49]">
      <style>{`
        @keyframes geo-ring-pulse { 0%{transform:scale(0.8);opacity:0.9} 100%{transform:scale(2.8);opacity:0} }
        .geo-target-icon{ background:transparent!important;border:none!important; }
        .geo-ring{ animation:geo-ring-pulse 1.6s ease-out infinite; }
      `}</style>

      <MapContainer center={[20, 10]} zoom={2} style={{ width: '100%', height: '100%' }} zoomControl={false} maxBounds={[[-90, -180], [90, 180]]} maxBoundsViscosity={1.0} minZoom={2}>
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" noWrap={true} />
        <MapController onMapClick={handleMapClick} boundsKey={boundsKey} boundsArr={boundsArr} />
        {guessLat !== null && guessLng !== null && guessIcon && (
          <Marker position={[guessLat, guessLng]} icon={guessIcon} zIndexOffset={100} />
        )}
        {roundEnd && targetIcon && (
          <Marker position={[target.lat, target.lng]} icon={targetIcon} zIndexOffset={200} />
        )}
        {roundEnd && guessLat !== null && guessLng !== null && (
          <Polyline positions={[[guessLat, guessLng], [target.lat, target.lng]]} pathOptions={{ color: '#FBBF24', dashArray: '8 6', weight: 2.5, opacity: 0.9 }} />
        )}
      </MapContainer>

      {/* HUD: top question bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4 pointer-events-none">
        <div className="rounded-[20px] p-3 md:p-4 flex items-center gap-3 pointer-events-auto" style={{ background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,1)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
          <div className="shrink-0 w-12 h-12 rounded-[14px] bg-gradient-to-br from-rose-400 to-orange-400 flex flex-col items-center justify-center text-white shadow-md">
            <span className="font-black text-base leading-none">{currentRound + 1}</span><span className="text-[9px] font-bold opacity-70">/10</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">{target.qTitle}</p>
            <p className="text-base md:text-lg font-black text-[#082F49] leading-snug">{target.qText}</p>
            {target.qDesc && !roundEnd && <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">💡 {target.qDesc}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">Điểm</p>
            <p className="text-xl font-black text-[#082F49] tabular-nums">{score.toLocaleString('vi-VN')}</p>
          </div>
        </div>
        <div className="flex justify-center gap-1.5 mt-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i < currentRound ? 'w-4 bg-emerald-400' : i === currentRound ? 'w-7 bg-rose-400' : 'w-2.5 bg-white/30'}`} />
          ))}
        </div>
      </div>

      {!roundEnd && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="px-5 py-2.5 rounded-full text-white font-bold text-sm flex items-center gap-2" style={{ background: 'rgba(8,47,73,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {guessLat ? <><div className="w-3 h-3 rounded-full bg-cyan-400 shrink-0" />Đã chọn vị trí — chờ xác nhận...</> : <><span>👆</span>Nhấp vào bản đồ để đánh dấu vị trí</>}
          </div>
        </div>
      )}

      {roundEnd && (
        <div className="absolute z-[1000] pointer-events-none" style={{ bottom: 'calc(min(340px, 46vh) + 8px)', left: '16px' }}>
          <div className="rounded-[14px] px-3 py-2 flex flex-col gap-1.5" style={{ background: 'rgba(8,47,73,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div className="flex items-center gap-2 text-xs text-white font-bold"><div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shrink-0" /> Vị trí bạn chọn</div>
            <div className="flex items-center gap-2 text-xs text-white font-bold"><div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shrink-0" /> Vị trí thực tế</div>
          </div>
        </div>
      )}

      {roundEnd && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] px-3 pb-3 md:px-6 md:pb-4">
          <div className="rounded-[28px] p-4 md:p-5 max-w-xl mx-auto" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)', border: '1.5px solid rgba(255,255,255,1)', boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${grade.badgeBg} ${grade.textColor} mb-1.5`}>{grade.label}</span>
                <p className={`text-3xl font-black tabular-nums leading-none ${grade.textColor}`}>+{roundScore.toLocaleString('vi-VN')}<span className="text-sm font-bold text-slate-400 ml-1">điểm</span></p>
                <p className="text-slate-400 font-bold text-xs mt-1">Sai lệch: <span className="text-rose-500 font-black">{roundDistance?.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} km</span></p>
              </div>
              <div className="w-px self-stretch bg-slate-100 mx-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5"><span className="text-lg">{cat.icon}</span><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{cat.label}</span></div>
                <p className="font-black text-[#082F49] text-lg leading-tight">{target.name}</p>
                {target.qDesc && <p className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-2">{target.qDesc}</p>}
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-3">
              <div className={`h-full rounded-full bg-gradient-to-r ${grade.barColor} transition-all duration-1000`} style={{ width: `${(roundScore / 1000) * 100}%` }} />
            </div>
            <div className="mb-3"><TargetInfoGrid target={target} /></div>
            <button onClick={nextRound} className="w-full py-3.5 rounded-[18px] bg-gradient-to-r from-[#082F49] to-[#0a3d62] text-white font-black text-base shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
              {currentRound >= 9 ? '🏆 Xem Tổng Kết' : `Câu ${currentRound + 2} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
