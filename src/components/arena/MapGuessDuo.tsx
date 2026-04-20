'use client';
import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { calcDistanceKM, getGrade, getCat, TargetInfoGrid, MapContainer, TileLayer, Marker, Polyline, MapController } from '@/utils/map-guessing-utils';

export default function MapGuessDuo({ 
  username,
  roomCode,
  roomState,
  isHost
}: { 
  username: string;
  roomCode: string;
  roomState: any; // Pushed from page.tsx polling
  isHost: boolean;
}) {
  const [guessLat, setGuessLat] = useState<number | null>(null);
  const [guessLng, setGuessLng] = useState<number | null>(null);
  const [roundDistance, setRoundDistance] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState(0);
  const [myGuessSubmitted, setMyGuessSubmitted] = useState(false);

  const [guessIcon, setGuessIcon] = useState<any>(null);
  const [targetIcon, setTargetIcon] = useState<any>(null);

  // Remaining time derived from server's roundEndsAt
  const [timeLeft, setTimeLeft] = useState(12);

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

  const currentRound = roomState?.currentRound || 0;
  const target = roomState?.questions?.[currentRound];
  
  const myGuessesArr = isHost ? roomState?.hostGuesses : roomState?.guestGuesses;
  const oppGuessesArr = isHost ? roomState?.guestGuesses : roomState?.hostGuesses;
  
  const myRoundData = myGuessesArr?.[currentRound];
  const oppRoundData = oppGuessesArr?.[currentRound];

  // roundIsReveal MUST be a stable boolean (not object reference)
  // otherwise every poll cycle creates a new object ref, React re-runs the effect → timer resets every 1s!
  const roundIsReveal = typeof myRoundData?.score === 'number' && typeof oppRoundData?.score === 'number';

  // Reset local state when round changes
  useEffect(() => {
    setGuessLat(null);
    setGuessLng(null);
    setRoundDistance(null);
    setRoundScore(0);
    setMyGuessSubmitted(false);
  }, [currentRound]);

  // Sync guess if I already submitted in DB (rejoin or quick sync)
  useEffect(() => {
    if (myRoundData && !myGuessSubmitted) {
      setGuessLat(myRoundData.lat || null);
      setGuessLng(myRoundData.lng || null);
      setRoundDistance(myRoundData.dist || 0);
      setRoundScore(myRoundData.score || 0);
      setMyGuessSubmitted(true);
    }
  }, [myRoundData, myGuessSubmitted]);

  // Timer logic
  useEffect(() => {
    if (roomState?.status !== 'PLAYING' || !roomState?.roundEndsAt) return;
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((roomState.roundEndsAt - now) / 1000));
      setTimeLeft(diff);
      // Auto submit 0 if time runs out and haven't guessed locally, wait for server to do it, but we can prevent further clicks
      if (diff === 0 && !myGuessSubmitted) {
        setMyGuessSubmitted(true);
      }
    };
    updateTimer();
    const intv = setInterval(updateTimer, 500);
    return () => clearInterval(intv);
  }, [roomState?.roundEndsAt, roomState?.status, myGuessSubmitted]);

  const handleMapClick = async (latlng: any) => {
    if (myGuessSubmitted || roundIsReveal || timeLeft <= 0) return;
    
    // Calculate locally
    const dist = calcDistanceKM(latlng.lat, latlng.lng, target.lat, target.lng);
    const pts = dist <= 50 ? 1000 : dist > 5000 ? 0 : Math.round(1000 * (1 - dist / 5000));
    
    setGuessLat(latlng.lat); setGuessLng(latlng.lng);
    setRoundDistance(dist); setRoundScore(pts);
    setMyGuessSubmitted(true);

    try {
      await fetch('/api/arena/map-guessing/room/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           roomCode,
           action: 'SUBMIT_GUESS',
           payload: { lat: latlng.lat, lng: latlng.lng, dist, score: pts }
        })
      });
    } catch(e) {}
  };

  const handleNextRound = useCallback(async () => {
    if (!isHost) return;
    try {
      await fetch('/api/arena/map-guessing/room/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, action: 'NEXT_ROUND' })
      });
    } catch(e) {}
  }, [isHost, roomCode]);

  // Auto transition after 3s — roundIsReveal is stable boolean so timer won't reset on polls
  useEffect(() => {
    if (!roundIsReveal || !isHost) return;
    const t = setTimeout(() => handleNextRound(), 3000);
    return () => clearTimeout(t);
  }, [roundIsReveal, isHost, handleNextRound]);

  if (!target) return null;

  const boundsArr: [[number, number], [number, number]] | null = 
     roundIsReveal && target ? [
       [Math.min(target.lat, myRoundData?.lat || target.lat, oppRoundData?.lat || target.lat), 
        Math.min(target.lng, myRoundData?.lng || target.lng, oppRoundData?.lng || target.lng)],
       [Math.max(target.lat, myRoundData?.lat || target.lat, oppRoundData?.lat || target.lat), 
        Math.max(target.lng, myRoundData?.lng || target.lng, oppRoundData?.lng || target.lng)]
     ] : null;
  const boundsKey = boundsArr ? boundsArr.flat().join(',') : '';

  const grade = getGrade(roundScore);
  const cat = getCat(target.subCategory ?? '');

  const oppName = isHost ? roomState?.guest : roomState?.host;
  const myTotal = isHost ? roomState?.hostScore : roomState?.guestScore;
  const oppTotal = isHost ? roomState?.guestScore : roomState?.hostScore;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#082F49]">
      <style>{`
        @keyframes geo-ring-pulse { 0%{transform:scale(0.8);opacity:0.9} 100%{transform:scale(2.8);opacity:0} }
        .geo-target-icon{ background:transparent!important;border:none!important; }
        .geo-ring{ animation:geo-ring-pulse 1.6s ease-out infinite; }
      `}</style>
      <MapContainer 
        center={[20, 10]} 
        zoom={2} 
        style={{ width: '100%', height: '100%' }} 
        zoomControl={false}
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
        minZoom={2}
      >
        <TileLayer 
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" 
          noWrap={true}
        />
        <MapController onMapClick={handleMapClick} boundsKey={boundsKey} boundsArr={boundsArr} />
        
        {guessLat !== null && guessLng !== null && guessIcon && guessLat !== 0 && (
          <Marker position={[guessLat, guessLng]} icon={guessIcon} zIndexOffset={100} />
        )}
        {roundIsReveal && targetIcon && (
          <Marker position={[target.lat, target.lng]} icon={targetIcon} zIndexOffset={200} />
        )}
        {roundIsReveal && guessLat !== null && guessLng !== null && guessLat !== 0 && (
          <Polyline positions={[[guessLat, guessLng], [target.lat, target.lng]]} pathOptions={{ color: '#06B6D4', dashArray: '8 6', weight: 3, opacity: 0.9 }} />
        )}
        
        {/* Opponent's Reveal */}
        {roundIsReveal && oppRoundData && oppRoundData.lat !== 0 && (
           <>
             <Marker position={[oppRoundData.lat, oppRoundData.lng]} icon={guessIcon} zIndexOffset={90} />
             <Polyline positions={[[oppRoundData.lat, oppRoundData.lng], [target.lat, target.lng]]} pathOptions={{ color: '#F43F5E', dashArray: '8 6', weight: 2, opacity: 0.6 }} />
           </>
        )}
      </MapContainer>

      {/* TOP DUO HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-4xl px-4 pointer-events-none flex justify-between gap-4">
        {/* My Score */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[20px] p-3 flex items-center gap-3 border border-white flex-1 shadow-lg pointer-events-auto">
           <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-black text-xs shrink-0">Bạn</div>
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400">Điểm của bạn</p>
             <p className="text-xl font-black text-cyan-600 tabular-nums leading-none">{myTotal}</p>
           </div>
        </div>

        {/* Center Timer & Question */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[20px] p-3 border border-white flex-[2] text-center shadow-lg pointer-events-auto flex flex-col items-center justify-center">
           {!roundIsReveal && (
              <div className="flex gap-1 mb-1">
                 {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className={`h-1.5 w-6 rounded-full ${i < timeLeft ? 'bg-rose-500' : 'bg-slate-200'}`} />
                 ))}
              </div>
           )}
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Vòng {currentRound + 1}/10 {roundIsReveal && ' - Đã Kết Thúc'}</p>
           <p className="text-lg font-black text-[#082F49] leading-snug">{target.qText}</p>
        </div>

        {/* Opponent Score */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[20px] p-3 flex items-center justify-end gap-3 border border-white flex-1 shadow-lg pointer-events-auto text-right">
           <div>
             <p className="text-[10px] font-black uppercase text-slate-400">{oppName}</p>
             <p className="text-xl font-black text-rose-500 tabular-nums leading-none">{oppTotal}</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-black text-xs shrink-0">Đ.thủ</div>
        </div>
      </div>

      {!roundIsReveal && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none flex gap-2">
          {myGuessSubmitted ? (
            <div className="px-5 py-2.5 rounded-full bg-[#082F49]/85 backdrop-blur-md text-white font-bold text-sm border border-white/15">
              Đợi đối thủ hoặc hết giờ...
            </div>
          ) : (
            <div className="px-5 py-2.5 rounded-full bg-rose-500/85 backdrop-blur-md text-white font-bold text-sm border border-white/15 animate-bounce">
              ⌚ Còn {timeLeft} giây!
            </div>
          )}
        </div>
      )}

      {roundIsReveal && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] px-3 pb-3 md:px-6 md:pb-4">
          <div className="rounded-[28px] p-4 md:p-5 max-w-xl mx-auto bg-white/95 backdrop-blur-xl border-1.5 border-white shadow-[0_-4px_40px_rgba(0,0,0,0.18)]">
             <div className="mb-4">
                <p className="text-center font-black text-slate-400 text-xs uppercase tracking-widest mb-2">Kết quả Vòng {currentRound + 1}</p>
                <div className="flex justify-between items-center bg-slate-50 rounded-[14px] p-3">
                   <div className="text-center">
                     <p className="text-[10px] font-black text-cyan-600 block">Bạn</p>
                     <p className="text-lg font-black text-[#082F49] tabular-nums">+{myRoundData?.score || 0}</p>
                     <p className="text-[10px] text-slate-400">{myRoundData?.dist ? Math.round(myRoundData.dist) + ' km' : 'Bỏ lỡ'}</p>
                   </div>
                   <div className="w-px h-10 bg-slate-200"></div>
                   <div className="text-center">
                     <p className="text-[10px] font-black text-rose-500 block">Đối thủ</p>
                     <p className="text-lg font-black text-[#082F49] tabular-nums">+{oppRoundData?.score || 0}</p>
                     <p className="text-[10px] text-slate-400">{oppRoundData?.dist ? Math.round(oppRoundData.dist) + ' km' : 'Bỏ lỡ'}</p>
                   </div>
                </div>
             </div>

             <div className="mb-3"><TargetInfoGrid target={target} /></div>

             <div className="w-full h-10 rounded-[18px] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-300 to-emerald-400 opacity-50" style={{ animation: 'geo-timer-bar 3s linear forwards' }} />
                <span className="relative z-10 text-slate-500 font-black text-sm italic">
                  {currentRound >= 9 ? 'Đang tổng hợp kết quả...' : `Chuẩn bị Tới Câu ${currentRound + 2}...`}
                </span>
                <style>{`@keyframes geo-timer-bar { 0% { width: 0% } 100% { width: 100% } }`}</style>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}
