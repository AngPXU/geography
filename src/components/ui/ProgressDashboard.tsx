'use client';

import { useState } from 'react';
import { FaChartBar, FaExclamationTriangle, FaMedal, FaSearch } from 'react-icons/fa';

interface Student {
  id: number;
  name: string;
  avatar: string;
  lessonsCompleted: number;
  totalLessons: number;
  avgScore: number;
  quizzesDone: number;
  lastActive: string;
  trend: 'up' | 'down' | 'stable';
  needsHelp: boolean;
}

const STUDENTS: Student[] = [
  { id: 1, name: 'Nguyễn Trà My',    avatar: '🧑‍🎓', lessonsCompleted: 12, totalLessons: 14, avgScore: 92, quizzesDone: 18, lastActive: 'Hôm nay',     trend: 'up',     needsHelp: false },
  { id: 2, name: 'Lê Hoàng Anh',     avatar: '👨‍🎓', lessonsCompleted: 10, totalLessons: 14, avgScore: 78, quizzesDone: 14, lastActive: 'Hôm nay',     trend: 'stable', needsHelp: false },
  { id: 3, name: 'Phạm Thảo Vy',     avatar: '👩‍🎓', lessonsCompleted: 5,  totalLessons: 14, avgScore: 55, quizzesDone: 6,  lastActive: '3 ngày trước', trend: 'down',   needsHelp: true  },
  { id: 4, name: 'Trần Minh Khoa',   avatar: '🧒',   lessonsCompleted: 11, totalLessons: 14, avgScore: 85, quizzesDone: 16, lastActive: 'Hôm qua',     trend: 'up',     needsHelp: false },
  { id: 5, name: 'Võ Thanh Hằng',    avatar: '👧',   lessonsCompleted: 4,  totalLessons: 14, avgScore: 48, quizzesDone: 5,  lastActive: '5 ngày trước', trend: 'down',   needsHelp: true  },
  { id: 6, name: 'Đỗ Quang Trung',   avatar: '👦',   lessonsCompleted: 13, totalLessons: 14, avgScore: 95, quizzesDone: 19, lastActive: 'Hôm nay',     trend: 'up',     needsHelp: false },
  { id: 7, name: 'Bùi Khánh Linh',   avatar: '👩‍💻',  lessonsCompleted: 9,  totalLessons: 14, avgScore: 72, quizzesDone: 12, lastActive: 'Hôm qua',     trend: 'stable', needsHelp: false },
  { id: 8, name: 'Cao Nhật Huy',     avatar: '🧑',   lessonsCompleted: 3,  totalLessons: 14, avgScore: 42, quizzesDone: 4,  lastActive: '1 tuần trước', trend: 'down',   needsHelp: true  },
];

const TREND_CONFIG = {
  up:     { icon: '↗', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  down:   { icon: '↘', color: 'text-red-400',     bg: 'bg-red-50'     },
  stable: { icon: '→', color: 'text-blue-400',    bg: 'bg-blue-50'    },
};

export function ProgressDashboard() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'needsHelp'>('all');

  const filtered = STUDENTS.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : s.needsHelp;
    return matchSearch && matchFilter;
  });

  const classAvg = Math.round(STUDENTS.reduce((a, s) => a + s.avgScore, 0) / STUDENTS.length);
  const needsHelpCount = STUDENTS.filter(s => s.needsHelp).length;
  const topStudent = [...STUDENTS].sort((a, b) => b.avgScore - a.avgScore)[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg">
          <FaChartBar />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#082F49]">Theo dõi tiến độ</h2>
          <p className="text-sm text-[#94A3B8]">Thống kê học tập của từng học sinh trong lớp</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[20px] p-4 shadow-[0_8px_24px_rgba(14,165,233,0.06)] text-center">
          <p className="text-3xl font-black text-[#082F49]">{STUDENTS.length}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-1">Học sinh</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[20px] p-4 shadow-[0_8px_24px_rgba(14,165,233,0.06)] text-center">
          <p className="text-3xl font-black text-emerald-500">{classAvg}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-1">Điểm TB lớp</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[20px] p-4 shadow-[0_8px_24px_rgba(14,165,233,0.06)] text-center">
          <p className="text-3xl font-black text-red-400">{needsHelpCount}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-1">Cần hỗ trợ</p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[20px] p-4 shadow-[0_8px_24px_rgba(14,165,233,0.06)] text-center">
          <p className="text-xl font-black text-amber-500 truncate">{topStudent.name.split(' ').pop()}</p>
          <p className="text-xs text-[#94A3B8] font-semibold mt-1">🏆 Dẫn đầu</p>
        </div>
      </div>

      {/* Needs help alert */}
      {needsHelpCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50/80 backdrop-blur-md border border-red-100 rounded-[16px]">
          <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-600">{needsHelpCount} học sinh cần được quan tâm thêm</p>
            <p className="text-xs text-red-400 mt-0.5">
              {STUDENTS.filter(s => s.needsHelp).map(s => s.name.split(' ').pop()).join(', ')} — điểm thấp hoặc không hoạt động nhiều ngày.
            </p>
          </div>
        </div>
      )}

      {/* Filters & search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm học sinh..."
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-slate-200 bg-white/80 focus:outline-none focus:border-emerald-400 text-sm transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === 'all' ? 'bg-emerald-500 text-white shadow-md' : 'bg-white/80 text-slate-400 border border-slate-200 hover:bg-white'}`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('needsHelp')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === 'needsHelp' ? 'bg-red-400 text-white shadow-md' : 'bg-white/80 text-slate-400 border border-slate-200 hover:bg-white'}`}
          >
            ⚠️ Cần hỗ trợ
          </button>
        </div>
      </div>

      {/* Student table */}
      <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Học sinh</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Bài học</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Điểm TB</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">Quiz</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">Xu hướng</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider hidden lg:table-cell">Hoạt động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(s => {
                const trend = TREND_CONFIG[s.trend];
                const progress = (s.lessonsCompleted / s.totalLessons) * 100;
                return (
                  <tr key={s.id} className={`hover:bg-slate-50/50 transition-colors ${s.needsHelp ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{s.avatar}</span>
                        <div>
                          <p className="font-bold text-[#082F49]">{s.name}</p>
                          {s.needsHelp && (
                            <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                              <FaExclamationTriangle className="text-[8px]" /> Cần hỗ trợ
                            </span>
                          )}
                          {!s.needsHelp && s.avgScore >= 90 && (
                            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                              <FaMedal className="text-[8px]" /> Xuất sắc
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-[#082F49]">{s.lessonsCompleted}/{s.totalLessons}</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-black text-lg ${s.avgScore >= 80 ? 'text-emerald-500' : s.avgScore >= 60 ? 'text-amber-500' : 'text-red-400'}`}>
                        {s.avgScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="font-semibold text-[#334155]">{s.quizzesDone}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-full ${trend.bg} ${trend.color}`}>
                        {trend.icon}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="text-xs text-[#94A3B8] font-medium">{s.lastActive}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[#94A3B8]">
              <p className="text-4xl mb-2">🔍</p>
              <p className="font-semibold">Không tìm thấy học sinh</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
