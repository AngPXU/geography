import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export interface LeaderboardUser {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  score: number;
}

interface LeaderboardSummaryProps {
  topExpUsers: LeaderboardUser[];
  topPetUsers: LeaderboardUser[];
}

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-white flex items-center justify-center font-black shadow-lg border-2 border-white text-sm">1</div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white flex items-center justify-center font-black shadow-lg border-2 border-white text-sm">2</div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 text-white flex items-center justify-center font-black shadow-lg border-2 border-white text-sm">3</div>;
  return <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-black border-2 border-white text-sm">{rank}</div>;
};

const UserCard = ({ user, rank, unit, icon, colorClass }: { user: LeaderboardUser, rank: number, unit: string, icon: string, colorClass: string }) => {
  const displayName = user.fullName || user.username.charAt(0).toUpperCase() + user.username.slice(1);

  return (
    <div className={`flex items-center gap-4 p-3 md:p-4 rounded-[20px] bg-white/60 backdrop-blur-md border border-white/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group`}>
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-slate-300' : rank === 3 ? 'bg-orange-400' : 'bg-slate-200'}`} />

      <div className="flex-shrink-0 relative">
        <RankBadge rank={rank} />
      </div>

      <div className="relative shrink-0 ml-1">
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt={displayName} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-black text-lg ring-2 ring-white shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[#082F49] font-bold text-base truncate group-hover:text-cyan-600 transition-colors">{displayName}</p>
        <p className="text-slate-400 text-xs font-medium truncate">@{user.username}</p>
      </div>

      <div className="flex flex-col items-end shrink-0 pl-2">
        <span className={`font-black text-lg md:text-xl leading-none ${colorClass}`}>{user.score.toLocaleString('vi-VN')}</span>
        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1 mt-1">
          {unit} <Icon icon={icon} width={14} className={colorClass} />
        </span>
      </div>
    </div>
  );
};

export function LeaderboardSummary({ topExpUsers, topPetUsers }: LeaderboardSummaryProps) {
  return (
    <section className="py-24 relative overflow-hidden bg-transparent">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-100/40 to-transparent rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>

      <div className="w-[95%] md:w-[90%] max-w-[1400px] mx-auto relative z-10">

        {/* Section Header */}
        <div className="text-center md:text-left mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 font-bold text-xs uppercase tracking-widest mb-4 border border-amber-100 shadow-sm">
              <Icon icon="material-symbols:trophy-rounded" width={16} /> Bảng Vàng Vinh Danh
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#082F49] tracking-tight">
              Đấu Trường <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Kỷ Lục</span>
            </h2>
            <p className="text-slate-500 font-medium mt-4 max-w-xl text-lg">
              Vinh danh những nhà thám hiểm xuất sắc nhất. Tham gia làm bài tập và chăm sóc thú cưng để ghi tên mình lên bảng vàng!
            </p>
          </div>
          <div className="shrink-0">
            <Link href="/leaderboard" className="h-12 px-6 rounded-full bg-white/50 backdrop-blur-md border-[2px] border-white/80 text-[#082F49] shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:bg-white hover:border-white hover:shadow-[0_12px_24px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 font-bold">
              Xem toàn bộ <Icon icon="material-symbols:arrow-forward-rounded" width={20} />
            </Link>
          </div>
        </div>

        {/* Leaderboards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Top EXP Panel */}
          <div className="rounded-[32px] p-6 md:p-8 relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
            }}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Icon icon="material-symbols:star-rounded" width={120} />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-200">
                <Icon icon="material-symbols:local-fire-department-rounded" width={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#082F49] tracking-tight">Top Học Tập</h3>
                <p className="text-sm font-bold text-cyan-500">Xếp hạng theo EXP</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 relative z-10">
              {topExpUsers.length > 0 ? topExpUsers.map((user, index) => (
                <UserCard key={user._id} user={user} rank={index + 1} unit="EXP" icon="material-symbols:star-rounded" colorClass="text-cyan-500" />
              )) : (
                <p className="text-center text-slate-400 py-8 font-medium">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          {/* Top Pet Panel */}
          <div className="rounded-[32px] p-6 md:p-8 relative overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)'
            }}
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Icon icon="material-symbols:pets" width={120} />
            </div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Icon icon="material-symbols:pets" width={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-[#082F49] tracking-tight">Top Nuôi Thú</h3>
                <p className="text-sm font-bold text-emerald-500">Xếp hạng theo Cấp độ Pet</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 relative z-10">
              {topPetUsers.length > 0 ? topPetUsers.map((user, index) => (
                <UserCard key={user._id} user={user} rank={index + 1} unit="Level" icon="material-symbols:favorite-rounded" colorClass="text-emerald-500" />
              )) : (
                <p className="text-center text-slate-400 py-8 font-medium">Chưa có dữ liệu</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
