'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import Leaflet map to prevent SSR window is not defined
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });

import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// ── HA VERSINE ALGORITHM TO CALCULATE DISTANCE ────────
function calcDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Bán kính khối cầu Trái Đất (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

// ── GAME COMPONENT ──────────────────────────────────────────────────────────
export default function MapGuessingGame() {
  const [dbFeatures, setDbFeatures] = useState<any[]>([]);
  const [status, setStatus] = useState<'LOADING' | 'MENU' | 'PLAYING' | 'SUMMARY'>('LOADING');
  
  // Game State
  const [topic, setTopic] = useState<string>('all');
  const [queue, setQueue] = useState<any[]>([]); // 10 câu hỏi dc bốc
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  
  // Round State
  const [guessLat, setGuessLat] = useState<number | null>(null);
  const [guessLng, setGuessLng] = useState<number | null>(null);
  const [roundDistance, setRoundDistance] = useState<number | null>(null);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [roundEnd, setRoundEnd] = useState(false);
  const [redIcon, setRedIcon] = useState<any>(null);

  // Khởi chạy: Kéo Dữ liệu 1 lần duy nhất để làm Ngân hàng câu hỏi
  useEffect(() => {
    // Sửa lỗi Icon Leaflet trên Next.js Client
    import('leaflet').then(leaflet => {
      const L = leaflet.default;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
      
      setRedIcon(new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41], iconAnchor: [12, 41]
      }));
    });

    Promise.all([
      fetch('/api/map/features?category=physical').then(r=>r.json()),
      fetch('/api/map/features?category=economic').then(r=>r.json()),
    ]).then(([phys, econ]) => {
      // Làm phẳng attributes
      const m1 = phys.map((item:any) => ({ ...item, ...item.attributes }));
      const m2 = econ.map((item:any) => ({ ...item, ...item.attributes }));
      setDbFeatures([...m1, ...m2].filter(f => f.lat && f.lng));
      setStatus('MENU');
    });
  }, []);

  const startGame = (selectedTopic: string) => {
    setTopic(selectedTopic);
    let pool = dbFeatures;
    if (selectedTopic === 'mountain') pool = pool.filter(f => f.subCategory === 'mountain');
    if (selectedTopic === 'river') pool = pool.filter(f => f.subCategory === 'river');
    if (selectedTopic === 'country' || selectedTopic.startsWith('country_')) {
      pool = pool.filter(f => f.subCategory === 'country_economy');
      if (selectedTopic === 'country_pop') pool = pool.filter(f => f.population);
      if (selectedTopic === 'country_gdp') pool = pool.filter(f => f.gdpTotal);
      if (selectedTopic === 'country_life') pool = pool.filter(f => f.lifeExpectancy);
    }
    
    // Xáo trộn và bốc 10 câu
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const rawTargets = shuffled.slice(0, 10);
    
    // Tạo câu hỏi động (Dynamic Questions)
    const questions = rawTargets.map(target => {
      let qText = target.name;
      let qDesc = target.desc;
      let qTitle = "Tìm kiếm mục tiêu";

      if (selectedTopic === 'country_pop' && target.population) {
        qTitle = "Thử thách Dân Số";
        qText = `Quốc gia có dân số ~${(target.population / 1_000_000).toFixed(1)} triệu người`;
        qDesc = `Mức thu nhập: ${target.incomeLevel} | Khu vực: ${target.region}`;
      } else if (selectedTopic === 'country_gdp' && target.gdpTotal) {
        qTitle = "Thử thách Kinh Tế";
        qText = `Quốc gia có GDP đạt mức ~${target.gdpTotal.toLocaleString('vi-VN')} tỷ USD`;
        qDesc = `Mức thu nhập: ${target.incomeLevel} | Khu vực: ${target.region}`;
      } else if (selectedTopic === 'country_life' && target.lifeExpectancy) {
        qTitle = "Thử thách Chất Lượng Sống";
        qText = `Quốc gia có Tuổi thọ trung bình ${target.lifeExpectancy} tuổi`;
        qDesc = `GDP bình quân: ${target.gdpPerCapita?.toLocaleString('vi-VN')} USD | Khu vực: ${target.region}`;
      }
      return { ...target, qText, qDesc, qTitle };
    });

    setQueue(questions);
    setCurrentRound(0);
    setScore(0);
    setRoundEnd(false);
    setStatus('PLAYING');
  };

  const nextRound = () => {
    if (currentRound >= 9) {
      setStatus('SUMMARY');
    } else {
      setCurrentRound(c => c + 1);
      setGuessLat(null); setGuessLng(null);
      setRoundDistance(null);
      setRoundEnd(false);
    }
  };

  const target = queue[currentRound];

  // Logic Khi người dùng Click trên MapComponent -> Bắt tọa độ (Component MapLeaflet tự sinh sự kiện Click)
  const handleMapClick = (latlng: L.LatLng) => {
    if (roundEnd || !target) return;
    
    const lat = latlng.lat;
    const lng = latlng.lng;
    setGuessLat(lat);
    setGuessLng(lng);
    
    // Tính Distance (km)
    const dist = calcDistanceKM(lat, lng, target.lat, target.lng);
    setRoundDistance(dist);
    
    // Tính Điểm (Công thức: 1000 điểm nếu sai số < 50km, rớt dần về 0 nếu sai quá 5000km)
    let pts = 0;
    if (dist <= 50) pts = 1000;
    else if (dist > 5000) pts = 0;
    else {
      pts = Math.round(1000 * (1 - dist / 5000));
    }
    
    setRoundScore(pts);
    setScore(s => s + Math.max(0, pts));
    setRoundEnd(true);
  };

  // Component Map con nhận event (Sử dụng MapContainer context)
  const MapEvents = dynamic(() => import('react-leaflet').then(m => {
    return function MapEventsInner({ onMapClick }: { onMapClick: (ll: L.LatLng) => void }) {
      m.useMapEvents({ click(e) { onMapClick(e.latlng); } });
      return null;
    }
  }), { ssr: false });

  if (status === 'LOADING') return (
    <div className="flex h-screen items-center justify-center bg-[#F0F9FF]">
      <p className="text-xl font-bold text-cyan-600 animate-pulse">⏳ Đang tải Ngân hàng Câu hỏi...</p>
    </div>
  );

  if (status === 'MENU') return (
    <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-cyan-100 to-rose-50 p-6">
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-2xl border border-white max-w-lg w-full text-center">
        <h1 className="text-3xl font-black text-[#082F49] mb-2">Bút Toán Bản Đồ</h1>
        <p className="text-slate-500 font-medium mb-6">Bạn am hiểu Trái Đất đến mức nào? 10 câu hỏi đang chờ bạn!</p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => startGame('all')} className="col-span-2 py-4 bg-gradient-to-r from-rose-400 to-orange-400 text-white rounded-2xl font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-rose-200">
            🎲 Đấu Trường Ngẫu Nhiên (Mix)
          </button>
          
          <div className="col-span-2 text-left mt-2 pl-2 border-l-[3px] border-cyan-400">
            <p className="font-extrabold text-[#082F49] text-sm uppercase tracking-wider">Câu đố Lãnh thổ</p>
          </div>
          <button onClick={() => startGame('country')} className="py-2.5 bg-white text-slate-700 rounded-xl font-bold text-sm border border-slate-200 hover:bg-cyan-50 hover:text-cyan-600 transition-colors">
            Khám phá Quốc Gia
          </button>
          <button onClick={() => startGame('mountain')} className="py-2.5 bg-white text-slate-700 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-colors">
            Đỉnh Núi Kỷ Lục
          </button>
          
          <div className="col-span-2 text-left mt-2 pl-2 border-l-[3px] border-emerald-400">
            <p className="font-extrabold text-[#082F49] text-sm uppercase tracking-wider mb-2">Thử thách World Bank (Kinh tế)</p>
          </div>
          <button onClick={() => startGame('country_pop')} className="py-2.5 bg-white text-slate-700 rounded-xl font-bold text-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
            👥 Định vị Dân Số
          </button>
          <button onClick={() => startGame('country_gdp')} className="py-2.5 bg-white text-slate-700 rounded-xl font-bold text-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
            🏦 Tìm GDP Cường Quốc
          </button>
          <button onClick={() => startGame('country_life')} className="col-span-2 py-2.5 bg-white text-slate-700 rounded-xl font-bold text-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
            ❤️ Đoán Tuổi Thọ & Mức Sống
          </button>
        </div>
        <Link href="/arena" className="block mt-6 text-sm font-bold text-rose-500 hover:underline">← Trở về Sảnh</Link>
      </div>
    </div>
  );

  if (status === 'SUMMARY') return (
    <div className="flex flex-col h-screen items-center justify-center bg-gradient-to-br from-[#082f49] to-[#0f172a] p-6 text-white text-center relative overflow-hidden">
      {/* Pháo giấy CSS đơn giản */}
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-[url('https://c.tenor.com/_MhIt_rC_sIAAAAC/confetti.gif')] bg-cover mix-blend-screen" />
      
      <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[40px] border border-white/20 z-10 max-w-lg w-full">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-black text-rose-400 mb-2">Trận Đấu Kết Thúc</h2>
        <p className="text-slate-300 font-medium text-lg mb-8">Kỷ lục của bạn trong chủ đề {topic}</p>
        
        <div className="text-7xl font-black text-cyan-300 mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          {score}
        </div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-10">/ 10,000 Điểm tối đa</p>
        
        <div className="flex gap-4">
          <button onClick={() => setStatus('MENU')} className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all border border-white/10">Menu</button>
          <button onClick={() => startGame(topic)} className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/30">Chơi Lại</button>
        </div>
      </div>
    </div>
  );

  // PLAYING STATE
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#082F49]">
      {/* ── MAP CONTAINER (Esri World Imagery No Labels) ── */}
      <MapContainer 
        center={[20, 0]} zoom={3} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
        />
        <MapEvents onMapClick={handleMapClick} />
        
        {/* Draw Line and Markers when round ended */}
        {roundEnd && target && guessLat !== null && guessLng !== null && (
          <>
            {/* Điểm đoán của User */}
            <Marker position={[guessLat, guessLng]} />
            {/* Điểm của Target */}
            {redIcon && (
              <Marker position={[target.lat, target.lng]} icon={redIcon}>
                <Popup>{target.name}</Popup>
              </Marker>
            )}
            {/* Đường nối */}
            <Polyline positions={[[guessLat, guessLng], [target.lat, target.lng]]} 
              pathOptions={{ color: '#F43F5E', dashArray: '10 10', weight: 3 }} />
          </>
        )}
      </MapContainer>

      {/* ── GAME HUD (Top Center) ── */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center">
        <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-white/50 shadow-xl mb-3 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
            {currentRound + 1}/10
          </div>
          <div className="text-center px-4 w-full max-w-lg">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-0.5">{target?.qTitle}</p>
            <p className="text-lg md:text-xl font-black text-[#082F49]">{target?.qText}</p>
          </div>
          <div className="px-3 py-1 bg-slate-100 rounded-lg text-slate-600 font-bold text-sm border border-slate-200">
            {score} pts
          </div>
        </div>
        
        {/* Clue box for difficulty */}
        {target?.qDesc && !roundEnd && (
          <div className="bg-[#082F49]/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-cyan-100 text-sm mt-2 max-w-md text-center font-medium shadow-2xl leading-relaxed">
            💡 Gợi ý: {target.qDesc}
          </div>
        )}
      </div>

      {roundEnd && (
        <div className="absolute inset-0 z-[2000] bg-black/20 backdrop-blur-[2px] flex items-end justify-center pb-12 pointer-events-none">
          <div className="bg-white p-8 rounded-[32px] max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.3)] pointer-events-auto border-4 border-white transform translate-y-0 text-center animate-in slide-in-from-bottom-10 duration-300">
            
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Lượt {currentRound + 1}</p>
            <h2 className="text-4xl font-black text-[#082F49] mb-1">
              +{roundScore} ĐIỂM
            </h2>
            <p className="text-rose-500 font-extrabold text-lg flex items-center justify-center gap-2 mb-6">
              Nguyệt lệch: {roundDistance?.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} km
            </p>
            
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Đáp án Lịch sử</p>
              <p className="font-bold text-[#082F49]">{target.name} ({target.subCategory})</p>
            </div>

            <button onClick={nextRound} className="w-full py-4 rounded-2xl font-black text-lg bg-[#082F49] text-white hover:bg-[#061f30] transition-colors shadow-xl">
              {currentRound >= 9 ? 'KẾT THÚC' : 'CÂU TIẾP THEO'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
