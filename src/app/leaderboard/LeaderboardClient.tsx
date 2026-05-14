'use client';
import React, { useState } from 'react';
import { Icon } from '@iconify/react';

export interface LeaderboardUser {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  score: number;
}

interface LeaderboardClientProps {
  topExpUsers: LeaderboardUser[];
  topPetUsers: LeaderboardUser[];
}

export function LeaderboardClient({ topExpUsers, topPetUsers }: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<'exp' | 'pet'>('exp');
  
  const currentData = activeTab === 'exp' ? topExpUsers : topPetUsers;
  const top3 = currentData.slice(0, 3);
  const rest = currentData.slice(3);

  const unit = activeTab === 'exp' ? 'EXP' : 'Level';
  const unitIcon = activeTab === 'exp' ? 'material-symbols:star-rounded' : 'material-symbols:favorite-rounded';
  const unitColor = activeTab === 'exp' ? 'text-cyan-500' : 'text-emerald-500';

  // Component render từng bạn trong Top 3 (Bục vinh quang)
  const PodiumCard = ({ user, rank }: { user: LeaderboardUser, rank: 1 | 2 | 3 }) => {
    if (!user) return null;
    const isGold = rank === 1;
    const isSilver = rank === 2;
    
    // Config colors & sizes based on rank
    const height = isGold ? 'h-48 md:h-56' : isSilver ? 'h-40 md:h-48' : 'h-32 md:h-40';
    const bg = isGold ? 'bg-gradient-to-t from-yellow-300 to-yellow-100/50' 
             : isSilver ? 'bg-gradient-to-t from-slate-300 to-slate-100/50' 
             : 'bg-gradient-to-t from-orange-300 to-orange-100/50';
    const borderColor = isGold ? 'border-yellow-400' : isSilver ? 'border-slate-400' : 'border-orange-400';
    const crownColor = isGold ? 'text-yellow-500' : isSilver ? 'text-slate-400' : 'text-orange-500';
    const avatarSize = isGold ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-20 md:h-20';
    const displayName = user.fullName || user.username.charAt(0).toUpperCase() + user.username.slice(1);

    return (
      <div className="flex flex-col items-center justify-end flex-1 min-w-0 px-1 relative z-10">
        {/* Crown & Avatar */}
        <div className="flex flex-col items-center relative z-20 hover:-translate-y-2 transition-transform duration-300">
          <div className={`absolute -top-6 ${crownColor} drop-shadow-md animate-bounce`}>
            {isGold ? <Icon icon="material-symbols:kid-star" width={40} /> : <Icon icon="material-symbols:kid-star" width={28} />}
          </div>
          
          <div className={`${avatarSize} rounded-full overflow-hidden border-4 ${borderColor} bg-white shadow-xl mb-3 relative z-10`}>
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-black text-3xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs text-white ${isGold ? 'bg-yellow-500' : isSilver ? 'bg-slate-400' : 'bg-orange-500'} border-2 border-white`}>
              {rank}
            </div>
          </div>

          <p className={`font-black truncate max-w-full text-center px-2 ${isGold ? 'text-xl text-[#082F49]' : 'text-lg text-slate-700'}`}>
            {displayName}
          </p>
          <p className={`font-bold mt-1 flex items-center gap-1 ${unitColor}`}>
            {user.score.toLocaleString('vi-VN')} {unit}
          </p>
        </div>

        {/* Podium Base */}
        <div className={`w-full ${height} ${bg} rounded-t-2xl mt-4 border-t-4 border-x-2 ${borderColor} shadow-inner flex justify-center pt-4 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
            <span className={`text-5xl md:text-7xl font-black opacity-20 relative z-10 ${crownColor}`}>{rank}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* ── Tab Switcher ── */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center p-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/80 shadow-[0_8px_16px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => setActiveTab('exp')}
            className={`px-6 py-3 rounded-full flex items-center gap-2 font-bold text-sm transition-all duration-300 ${
              activeTab === 'exp' 
                ? 'bg-[#06B6D4] text-white shadow-[0_4px_12px_rgba(6,182,212,0.3)]' 
                : 'text-[#082F49] hover:bg-white/60'
            }`}
          >
            <Icon icon="material-symbols:local-fire-department-rounded" width={20} />
            Top Học Tập (EXP)
          </button>
          <button
            onClick={() => setActiveTab('pet')}
            className={`px-6 py-3 rounded-full flex items-center gap-2 font-bold text-sm transition-all duration-300 ${
              activeTab === 'pet' 
                ? 'bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]' 
                : 'text-[#082F49] hover:bg-white/60'
            }`}
          >
            <Icon icon="material-symbols:pets-rounded" width={20} />
            Top Nuôi Thú (Cấp độ)
          </button>
        </div>
      </div>

      {/* ── Bục Vinh Quang (Top 3) ── */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center h-[380px] md:h-[450px] mb-16 max-w-3xl mx-auto px-4 relative">
            {/* Hào quang nền */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gradient-to-t from-cyan-100/50 to-transparent rounded-[100%] blur-3xl pointer-events-none"></div>
            
            {top3[1] && <PodiumCard user={top3[1]} rank={2} />}
            {top3[0] && <PodiumCard user={top3[0]} rank={1} />}
            {top3[2] && <PodiumCard user={top3[2]} rank={3} />}
        </div>
      )}

      {/* ── Danh sách Top 4 -> 50 ── */}
      {rest.length > 0 && (
        <div className="bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[32px] p-6 md:p-8 shadow-[0_20px_40px_rgba(14,165,233,0.05)] mb-20">
          <h3 className="text-xl font-black text-[#082F49] mb-6 flex items-center gap-2">
            <Icon icon="material-symbols:format-list-numbered-rounded" width={24} className="text-slate-400" />
            Bảng Xếp Hạng Chi Tiết
          </h3>
          
          <div className="flex flex-col gap-3">
            {rest.map((user, index) => {
              const rank = index + 4; // Vì đã lấy top 3 ra
              const displayName = user.fullName || user.username.charAt(0).toUpperCase() + user.username.slice(1);
              
              return (
                <div key={user._id} className="flex items-center justify-between p-4 rounded-[20px] bg-white/40 hover:bg-white border border-transparent hover:border-cyan-100 transition-all duration-300 group">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-8 text-center font-black text-slate-400 group-hover:text-cyan-500 transition-colors">
                      {rank}
                    </span>
                    
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div className="truncate">
                      <p className="font-bold text-[#082F49] truncate text-base">{displayName}</p>
                      <p className="text-xs text-slate-400 font-medium truncate">@{user.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-4">
                    <span className={`font-black text-lg ${unitColor}`}>{user.score.toLocaleString('vi-VN')}</span>
                    <Icon icon={unitIcon} width={18} className={unitColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentData.length === 0 && (
        <div className="text-center py-20 text-slate-400 font-medium">
          Chưa có dữ liệu xếp hạng nào.
        </div>
      )}

    </div>
  );
}
