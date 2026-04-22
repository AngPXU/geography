'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { TOPIC_MODES } from '@/utils/map-guessing-utils';
import MapGuessDuo from '@/components/arena/MapGuessDuo';

export default function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const roomCode = unwrappedParams.roomCode.toUpperCase();
  const [roomState, setRoomState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sessionUser, setSessionUser] = useState<string | null>(null);

  // Keep a ref to always have latest sessionUser without triggering effect re-runs
  const sessionUserRef = React.useRef<string | null>(null);
  useEffect(() => { sessionUserRef.current = sessionUser; }, [sessionUser]);

  // Ref to track if component has been "truly" mounted long enough
  // This prevents React StrictMode's artificial mount→unmount→mount from deleting the room
  const trulyMountedRef = React.useRef(false);
  useEffect(() => {
    // Only mark as truly mounted after 600ms — StrictMode's fake unmount happens within ms
    const t = setTimeout(() => { trulyMountedRef.current = true; }, 600);
    return () => {
      clearTimeout(t);
      trulyMountedRef.current = false;
    };
  }, [roomCode]);

  // Auto-leave when navigating away or closing tab
  useEffect(() => {
    if (!roomCode) return;

    const leaveUrl = '/api/arena/map-guessing/room/leave';
    const sendLeave = () => {
      // Only fire if we've been in room for > 600ms (i.e., not a StrictMode fake unmount)
      if (!trulyMountedRef.current) return;
      const body = JSON.stringify({ roomCode, username: sessionUserRef.current });
      navigator.sendBeacon(leaveUrl, new Blob([body], { type: 'application/json' }));
    };

    window.addEventListener('beforeunload', sendLeave);
    return () => {
      window.removeEventListener('beforeunload', sendLeave);
      sendLeave();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode]); // roomCode only — sessionUser accessed via ref

  // Poll room state
  useEffect(() => {
    // Get user session to identify who we are
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => { if (d.user) setSessionUser(d.user.username); });

    const intv = setInterval(async () => {
      try {
        const res = await fetch(`/api/arena/map-guessing/room/state?code=${roomCode}`);
        const data = await res.json();
        if (data.success && data.state) {
          setRoomState(data.state);
        } else if (res.status === 404 || !data.success) {
          // Room not found or we are not in it (unauthorized), kick out
          router.push('/arena');
        }
      } catch(e) {}
      setLoading(false);
    }, 1000);

    return () => clearInterval(intv);
  }, [roomCode, router]);

  if (loading || !roomState || !sessionUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#E0F2FE] to-[#DCFCE7]">
        <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isHost = roomState.host === sessionUser;

  const handleStart = async () => {
    try {
      await fetch('/api/arena/map-guessing/room/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, action: 'START_GAME' })
      });
    } catch(e) {}
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    alert('Đã copy mã phòng!');
  };

  const handleLeave = async () => {
    try {
      await fetch('/api/arena/map-guessing/room/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode })
      });
    } catch(e) {}
    router.push('/arena');
  };

  const handleChangeTopic = async (topic: string) => {
    try {
      const { buildQuestions } = await import('@/utils/map-guessing-utils');
      const [physReq, econReq] = await Promise.all([
        fetch('/api/map/features?category=physical'),
        fetch('/api/map/features?category=economic')
      ]);
      const phys = await physReq.json();
      const econ = await econReq.json();
      const all = [
        ...phys.map((f: any) => ({ ...f, ...f.attributes })),
        ...econ.map((f: any) => ({ ...f, ...f.attributes })),
      ].filter((f: any) => f.lat && f.lng);
      
      const questions = buildQuestions(topic, all);

      await fetch('/api/arena/map-guessing/room/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, topic, questions })
      });
    } catch(e) {}
  };

  // If PLAYING, transition to Mapbox Arena
  if (roomState.status === 'PLAYING') {
    return <MapGuessDuo roomCode={roomCode} isHost={isHost} roomState={roomState} username={sessionUser} />;
  }

  if (roomState.status === 'SUMMARY') {
     const myTotal = isHost ? roomState?.hostScore : roomState?.guestScore;
     const oppTotal = isHost ? roomState?.guestScore : roomState?.hostScore;
     
     let myLabel = "Hòa Nhau";
     let myIcon = "🤝";
     let myGrad = "bg-white/10";
     let expMsg = "Không ai được EXP";
     
     if (myTotal > oppTotal) {
         myLabel = "Chiến Thắng!";
         myIcon = "👑";
         myGrad = "bg-gradient-to-b from-yellow-500/20 to-transparent border border-yellow-500/50";
         expMsg = "🎉 Bạn được cộng +50 EXP!";
     } else if (oppTotal > myTotal) {
         myLabel = "Thất Bại";
         myIcon = "💀";
         expMsg = "Đối thủ nhận +50 EXP!";
     }

     return (
      <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Liquid Mesh Gradient Nền */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
        </div>
        <div className={`w-full max-w-2xl rounded-[32px] p-8 text-center relative z-10 ${myLabel === 'Chiến Thắng!' ? 'shadow-[0_0_50px_rgba(234,179,8,0.2)]' : ''}`}
             style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
          <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
          <div className="text-7xl mb-3 animate-bounce relative z-30">{myIcon}</div>
          <p className={`font-black text-4xl mb-2 relative z-30 ${myLabel === 'Chiến Thắng!' ? 'text-amber-500' : 'text-slate-500'}`}>{myLabel}</p>
          <p className="text-[#06B6D4] font-bold mb-8 uppercase tracking-widest text-sm relative z-30">{expMsg}</p>
          
          <div className="flex items-center justify-center gap-6 mb-8 relative z-30">
             <div className={`flex-1 rounded-[32px] p-6 text-center ${myGrad}`}>
                <p className="text-slate-500 font-bold mb-2 uppercase tracking-widest text-xs">Bạn</p>
                <p className={`text-5xl font-black tabular-nums ${myLabel === 'Chiến Thắng!' ? 'text-amber-600' : 'text-[#082F49]'}`}>{myTotal}</p>
             </div>
             <div className="text-slate-400 font-black text-3xl italic">VS</div>
             <div className="flex-1 rounded-[32px] bg-white/50 p-6 text-center border border-white/80">
                <p className="text-slate-500 font-bold mb-2 uppercase tracking-widest text-xs">Phòng {roomState.guest || roomState.host}</p>
                <p className="text-5xl font-black text-[#082F49] tabular-nums">{oppTotal}</p>
             </div>
          </div>

          <button onClick={handleLeave} className="w-full py-4 rounded-full bg-white/50 hover:bg-white text-slate-500 font-black transition-all border border-white/80 shadow-sm relative z-30">Trở Về Arena</button>
        </div>
      </div>
     )
  }

  // WAITING (LOBBY UI)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E0F2FE] via-[#FFFFFF] to-[#DCFCE7] p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
      {/* Liquid Mesh Gradient Nền */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/20 rounded-full blur-[120px] animate-[liquid-blob_15s_infinite]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#22C55E]/20 rounded-full blur-[120px] animate-[liquid-blob_20s_infinite_reverse]"></div>
      </div>
      
      <div className="w-full max-w-6xl rounded-[40px] p-8 md:p-12 relative z-10"
           style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
        <div className="absolute inset-0 rounded-[40px] border-2 border-white/40 pointer-events-none z-20"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
           <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                 Đang trong phòng chờ
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-[#082F49] flex items-center gap-4">
                 Sảnh {roomCode}
                 {roomState.isPrivate && <span className="text-sm px-3 py-1 bg-slate-100 rounded-full border border-slate-200">🔒 Phòng kín</span>}
              </h1>
           </div>
           <div className="flex gap-3 relative z-30">
              <button onClick={handleCopy} className="px-5 py-2.5 bg-white/50 backdrop-blur-md text-[#082F49] font-bold rounded-full hover:bg-white transition border border-white/80 text-sm flex items-center gap-2">
                 📋 <span>Copy Mã</span>
              </button>
              <button onClick={handleLeave} className="px-5 py-2.5 bg-rose-50 text-rose-600 font-bold rounded-full hover:bg-rose-100 transition border border-rose-200 text-sm">
                 Rời phòng
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           
           {/* Section 1: Settings */}
           <div className="rounded-[32px] p-6 relative z-30"
                style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
              <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center text-lg shadow-sm">⚙️</div>
                 <h2 className="text-xl font-black text-[#082F49]">Cài đặt trận đấu</h2>
              </div>
              
              <div className="mb-6">
                 <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">Chủ đề (Topic)</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TOPIC_MODES.map(m => (
                       <button
                         key={m.key}
                         disabled={!isHost}
                         onClick={() => handleChangeTopic(m.key)}
                         className={`p-3 rounded-2xl border-2 text-left transition-all ${roomState.topic === m.key ? 'border-cyan-400 bg-cyan-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'} ${!isHost ? 'opacity-80 cursor-not-allowed' : ''}`}
                       >
                         <span className="text-xl leading-none">{m.icon}</span>
                         <p className={`font-black mt-2 text-sm ${roomState.topic === m.key ? 'text-cyan-700' : 'text-slate-600'}`}>{m.label}</p>
                       </button>
                    ))}
                 </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start">
                 <span className="text-amber-500 font-black">ℹ️</span>
                 <p className="text-xs font-bold text-amber-700 leading-relaxed">
                   {isHost 
                     ? 'Bạn là chủ phòng. Bạn có thể thay đổi luật và chủ đề chơi. Hãy đợi đối thủ vào để bắt đầu trận.' 
                     : 'Bạn là khách. Chủ phòng sẽ quyết định khi nào trận đấu bắt đầu. Vui lòng chờ...'}
                 </p>
              </div>
           </div>

           {/* Section 2: Players */}
           <div className="flex flex-col gap-6 relative z-30">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-lg shadow-sm">👥</div>
                 <h2 className="text-xl font-black text-[#082F49]">Người chơi</h2>
              </div>

              {/* Host Slot */}
              <div className="flex items-center gap-4 rounded-[32px] p-4 relative overflow-hidden"
                   style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
                 <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
                 <div className="absolute top-0 bottom-0 left-0 w-2 bg-[#06B6D4]" />
                 <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white">
                    {roomState.host[0]}
                 </div>
                 <div>
                    <span className="text-[10px] items-center gap-1 inline-flex bg-cyan-100 text-cyan-600 font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-1">
                       👑 Chủ phòng
                    </span>
                    <p className="font-black text-lg text-[#082F49]">{roomState.host}</p>
                 </div>
              </div>

              {/* Guest Slot */}
              {roomState.guest ? (
                <div className="flex items-center gap-4 rounded-[32px] p-4 relative overflow-hidden"
                     style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 10px 30px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
                   <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
                   <div className="absolute top-0 bottom-0 left-0 w-2 bg-emerald-400" />
                   <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white">
                      {roomState.guest[0]}
                   </div>
                   <div>
                      <span className="text-[10px] items-center gap-1 inline-flex bg-emerald-100 text-emerald-600 font-black px-2 py-0.5 rounded-full uppercase tracking-widest mb-1">
                         ⚔️ Đối thủ
                      </span>
                      <p className="font-black text-lg text-[#082F49]">{roomState.guest}</p>
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-white/30 rounded-[32px] border-2 border-dashed border-white/80 p-4 relative overflow-hidden">
                   <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center shadow-inner border-2 border-slate-100 animate-pulse">
                      
                   </div>
                   <div>
                      <p className="font-black text-sm text-slate-400">ĐANG CHỜ...</p>
                      <p className="text-xs font-bold text-slate-300 mt-0.5">Đợi ít nhất 1 người chơi kết nối</p>
                   </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-auto pt-4">
                 <button 
                   disabled={!isHost || !roomState.guest} 
                   onClick={handleStart}
                   className={`w-full py-5 rounded-full font-black text-lg transition-all shadow-[0_10px_20px_rgba(6,182,212,0.3)] ${isHost && roomState.guest ? 'bg-[#06B6D4] hover:bg-[#22D3EE] text-white hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(34,211,238,0.5)] border-[2px] border-[#06B6D4]' : 'bg-white/50 text-slate-400 shadow-none cursor-not-allowed hidden md:block border border-white/80'}`}
                 >
                   {isHost ? (roomState.guest ? 'XÁC NHẬN BẮT ĐẦU 🚀' : 'ĐỢI ĐỐI THỦ...') : 'ĐANG ĐỢI CHỦ PHÒNG BẮT ĐẦU... ⏳'}
                 </button>

                 {!isHost && (
                    <div className="w-full py-5 rounded-full font-black text-sm bg-amber-50 text-amber-600 text-center animate-pulse border border-amber-200 shadow-sm mt-3">
                       Vui lòng đợi 👑 {roomState.host} bắt đầu trận đấu!
                    </div>
                 )}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
