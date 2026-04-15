'use client';

import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaCopy, FaCheck, FaPlay, FaStop, FaUsers, FaWifi } from 'react-icons/fa';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function LiveSession() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fakeStudents] = useState([
    { name: 'Nguyễn Trà My', avatar: '🧑‍🎓', joined: '1 giây trước' },
    { name: 'Lê Hoàng Anh', avatar: '👨‍🎓', joined: '5 giây trước' },
    { name: 'Phạm Thảo Vy', avatar: '👩‍🎓', joined: '12 giây trước' },
  ]);

  const joinUrl = roomCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${roomCode}` : '';

  const handleStartRoom = useCallback(() => {
    const code = generateRoomCode();
    setRoomCode(code);
    setIsLive(true);
  }, []);

  const handleStopRoom = useCallback(() => {
    setIsLive(false);
    setRoomCode(null);
  }, []);

  const handleCopy = useCallback(() => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomCode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg">
          <FaWifi />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49]">Phòng học Live</h2>
          <p className="text-sm text-[#94A3B8]">Tạo phòng, chia sẻ mã hoặc QR cho học sinh join ngay</p>
        </div>
      </div>

      {!isLive ? (
        /* Pre-start state */
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="text-7xl animate-bounce" style={{ animationDuration: '3s' }}>📡</div>
          <p className="text-[#334155] text-center max-w-xs font-medium">
            Chưa có phòng nào đang mở. Bấm bên dưới để tạo phòng học mới và chia sẻ cho học sinh.
          </p>
          <button
            onClick={handleStartRoom}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg shadow-[0_10px_25px_rgba(6,182,212,0.35)] hover:shadow-[0_15px_35px_rgba(6,182,212,0.5)] hover:-translate-y-1 transition-all duration-300"
          >
            <FaPlay /> Mở phòng học
          </button>
        </div>
      ) : (
        /* Active room */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Code + QR */}
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)] space-y-5">
            {/* Live badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ĐANG PHÁT SÓNG
              </span>
              <button
                onClick={handleStopRoom}
                className="flex items-center gap-2 text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
              >
                <FaStop /> Kết thúc
              </button>
            </div>

            {/* Room code */}
            <div className="text-center">
              <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-widest mb-2">Mã phòng</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-black text-[#082F49] tracking-[0.15em] font-mono">{roomCode}</span>
                <button
                  onClick={handleCopy}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-cyan-100 text-slate-400 hover:text-cyan-600 flex items-center justify-center transition-all"
                  title="Sao chép mã"
                >
                  {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                </button>
              </div>
              <p className="text-[#94A3B8] text-xs mt-2">Nhập trên <span className="font-bold text-cyan-600">geolearn.app/join</span></p>
            </div>

            <div className="flex items-center gap-3 text-[#94A3B8] text-xs">
              <div className="flex-1 h-px bg-slate-100"></div>
              <span className="font-semibold">hoặc quét QR</span>
              <div className="flex-1 h-px bg-slate-100"></div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-[20px] border border-slate-100 shadow-sm">
                <QRCodeSVG
                  value={joinUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#082F49"
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
            <p className="text-center text-[#94A3B8] text-xs">Học sinh quét bằng camera điện thoại</p>
          </div>

          {/* Right: Student list */}
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_10px_30px_rgba(14,165,233,0.08)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#082F49] flex items-center gap-2">
                <FaUsers className="text-cyan-500" /> Học sinh trong phòng
              </h3>
              <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-3 py-1 rounded-full">
                {fakeStudents.length} người
              </span>
            </div>

            <div className="space-y-3">
              {fakeStudents.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-[16px] border border-slate-100 hover:border-cyan-200 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-xl">
                    {s.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#082F49] text-sm truncate">{s.name}</p>
                    <p className="text-[#94A3B8] text-xs">Tham gia {s.joined}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                </div>
              ))}
            </div>

            {/* Chat preview */}
            <div className="mt-4 p-4 bg-blue-50/50 rounded-[16px] border border-blue-100/50">
              <p className="text-xs font-bold text-[#082F49] mb-2">💬 Chat Q&A</p>
              <div className="space-y-2 text-xs text-[#334155]">
                <p><span className="font-bold">Trà My:</span> Thầy ơi, đồng bằng sông Cửu Long rộng bao nhiêu ạ?</p>
                <p><span className="font-bold">Hoàng Anh:</span> Cho em hỏi câu 3 ạ 🙋</p>
              </div>
              <input
                type="text"
                placeholder="Nhắn tin cho cả lớp..."
                className="mt-3 w-full text-xs p-2 rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
