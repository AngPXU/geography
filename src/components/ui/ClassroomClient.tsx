'use client';

import { useState, useEffect } from 'react';
import {
  FaPlus, FaChalkboardTeacher, FaLock, FaLockOpen,
  FaUsers, FaBook, FaSignInAlt, FaTrash, FaArrowRight,
} from 'react-icons/fa';
import { ClassroomRoom } from './ClassroomRoom';
import { trackMission } from '@/utils/missionTracker';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassroomSummary {
  _id: string;
  name: string;
  code: string;
  subject?: string;
  teacherName: string;
  teacherAvatar?: string;
  rows: number;
  cols: number;
  participants: { studentId: string }[];
  passwordHash?: string;
  createdAt: string;
  onlineCount: number;
  teacherOnline: boolean;
}

interface FullClassroom extends ClassroomSummary {
  teacherId: string;
  participants: {
    studentId: string;
    studentName: string;
    studentAvatar?: string;
    seatRow: number;
    seatCol: number;
    lastSeen: string;
  }[];
  announcement?: string;
}

interface UserProfile {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  role: 1 | 2 | 3;
}

interface ClassroomClientProps {
  user: { name?: string | null; image?: string | null };
}

// ─── Create modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (c: ClassroomSummary) => void;
}) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Tên lớp học không được để trống'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/classroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, subject, description, password, rows, cols }),
    });
    const data = await res.json() as { classroom?: ClassroomSummary; error?: string };
    setLoading(false);
    if (!res.ok) { setError(data.error ?? 'Tạo thất bại'); return; }
    onCreate(data.classroom!);
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-2xl text-sm text-[#082F49] placeholder-[#94A3B8] bg-white/80 border border-[#BAE6FD] shadow-[0_2px_8px_rgba(14,165,233,0.08)] focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)] transition-all duration-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(8,47,73,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-[32px] p-7 shadow-2xl"
           style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
        <h2 className="text-xl font-bold text-[#082F49] mb-5 flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#06B6D4]"><FaChalkboardTeacher size={16} /></span>
          Tạo lớp học mới
        </h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-semibold" style={{ background: 'rgba(254,226,226,0.9)', color: '#DC2626' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Tên lớp học <span className="text-[#06B6D4]">*</span></label>
            <input placeholder="Ví dụ: Địa lý lớp 8A1" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Môn học</label>
            <input placeholder="Ví dụ: Địa lý lớp 8" value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Mô tả</label>
            <input placeholder="Mô tả ngắn về lớp học" value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Mật khẩu phòng <span className="text-[#94A3B8] font-normal">(để trống nếu không cần)</span></label>
            <input type="password" placeholder="Mật khẩu để vào phòng..." value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Số hàng</label>
              <select value={rows} onChange={(e) => setRows(Number(e.target.value))} className={inputCls + ' appearance-none'}>
                {[2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} hàng</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Số cột</label>
              <select value={cols} onChange={(e) => setCols(Number(e.target.value))} className={inputCls + ' appearance-none'}>
                {[2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>{n} cột</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-[#94A3B8] ml-1">Tổng số chỗ: <strong className="text-[#06B6D4]">{rows * cols}</strong></p>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-full font-semibold text-[#94A3B8] bg-white/50 backdrop-blur-md border border-white/80 hover:bg-white hover:text-[#082F49] transition-all duration-300">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-full font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE] disabled:opacity-60 transition-all duration-300 shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_30px_rgba(34,211,238,0.5)] border-[2px] border-[#06B6D4]">
              {loading ? 'Đang tạo...' : 'Tạo lớp học'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ClassroomClient({ user }: ClassroomClientProps) {
  // Current user profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Classrooms list
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // Active room view
  const [activeRoom, setActiveRoom] = useState<FullClassroom | null>(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Student join form
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d: { user?: UserProfile }) => { if (d.user) setProfile(d.user); })
      .finally(() => setProfileLoading(false));
  }, []);

  // ── Fetch classrooms ───────────────────────────────────────────────────────
  const fetchClassrooms = async () => {
    setListLoading(true);
    const r = await fetch('/api/classroom');
    const d = await r.json() as { classrooms?: ClassroomSummary[] };
    setClassrooms(d.classrooms ?? []);
    setListLoading(false);
  };

  useEffect(() => { fetchClassrooms(); }, []);

  // ── Enter a classroom (teacher) ────────────────────────────────────────────
  async function handleEnterRoom(id: string) {
    const r = await fetch(`/api/classroom/${id}`);
    const d = await r.json() as { classroom?: FullClassroom };
    if (d.classroom) setActiveRoom(d.classroom);
  }

  // ── Student join ───────────────────────────────────────────────────────────
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoinError(''); setJoinLoading(true);
    const res = await fetch('/api/classroom/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode.trim().toUpperCase(), password: joinPassword || undefined }),
    });
    const data = await res.json() as { classroom?: FullClassroom; error?: string };
    setJoinLoading(false);
    if (!res.ok) {
      if (res.status === 403 && data.error?.includes('mật khẩu')) setNeedsPassword(true);
      setJoinError(data.error ?? 'Tham gia thất bại');
      return;
    }
    await fetchClassrooms();
    setActiveRoom(data.classroom!);
    trackMission('join-classroom', 1);
  }

  // ── Re-enter existing room (student) ──────────────────────────────────────
  async function handleReEnter(id: string) {
    const r = await fetch(`/api/classroom/${id}`);
    const d = await r.json() as { classroom?: FullClassroom };
    if (d.classroom) setActiveRoom(d.classroom);
  }

  // ── Delete classroom ───────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    await fetch(`/api/classroom/${id}`, { method: 'DELETE' });
    setDeletingId(null);
    await fetchClassrooms();
  }

  // ── Handle leaving room ────────────────────────────────────────────────────
  async function handleLeaveRoom() {
    setActiveRoom(null);
    await fetchClassrooms();
  }

  // ── If in room: show room view ─────────────────────────────────────────────
  if (activeRoom && profile) {
    return (
      <ClassroomRoom
        key={activeRoom._id}
        classroom={activeRoom}
        currentUserId={profile._id}
        currentUserName={profile.fullName || profile.username}
        currentUserAvatar={profile.avatar}
        isTeacher={profile.role === 2 || profile.role === 1}
        onLeave={handleLeaveRoom}
      />
    );
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 rounded-full border-4 border-[#06B6D4]/30 border-t-[#06B6D4] animate-spin" />
      </div>
    );
  }

  const isTeacher = profile?.role === 2 || profile?.role === 1;
  const inputCls = 'w-full px-4 py-3 rounded-2xl text-sm text-[#082F49] placeholder-[#94A3B8] bg-white/80 border border-[#BAE6FD] shadow-[0_2px_8px_rgba(14,165,233,0.08)] focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)] transition-all duration-300';

  return (
    <>
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          onCreate={async (created) => {
            setShowCreateModal(false);
            await fetchClassrooms();
            await handleEnterRoom(created._id);
          }}
        />
      )}

      {/* Delete confirm overlay */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(8,47,73,0.4)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-[32px] p-6 w-full max-w-sm text-center shadow-2xl relative" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
            <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-[#082F49] mb-2">Xóa lớp học này?</h3>
            <p className="text-sm text-[#94A3B8] mb-5">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-2.5 rounded-full bg-white/50 backdrop-blur-md border border-white/80 text-sm font-semibold text-[#94A3B8] hover:bg-white hover:text-[#082F49] transition-colors">Hủy</button>
              <button onClick={() => handleDelete(deletingId)} className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold shadow-[0_10px_20px_rgba(239,68,68,0.3)] hover:bg-red-600 hover:shadow-[0_15px_30px_rgba(239,68,68,0.5)] transition-all">Xóa</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 pb-8">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#082F49] flex items-center gap-3">
              <span className="text-3xl">🏫</span>
              {isTeacher ? 'Lớp học của tôi' : 'Phòng học'}
            </h1>
            <p className="text-[#94A3B8] text-sm mt-1">
              {isTeacher ? 'Tạo và quản lý các lớp học của bạn' : 'Tham gia vào lớp học bằng mã phòng'}
            </p>
          </div>
          {isTeacher && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE] shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_30px_rgba(34,211,238,0.5)] transition-all duration-300 whitespace-nowrap hover:-translate-y-0.5 border-[2px] border-[#06B6D4]"
            >
              <FaPlus size={13} /> Tạo lớp học mới
            </button>
          )}
        </div>

        {/* ── Teacher: classroom cards ─────────────────────────────────── */}
        {isTeacher && (
          <div className="space-y-4">
            {listLoading ? (
              <div className="text-center py-16 text-[#94A3B8] text-sm">Đang tải...</div>
            ) : classrooms.length === 0 ? (
              <div className="text-center py-20 rounded-[32px] relative"
                   style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px dashed rgba(6,182,212,0.5)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
                <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
                <div className="text-6xl mb-4">🏫</div>
                <p className="font-bold text-[#082F49] mb-1">Chưa có lớp học nào</p>
                <p className="text-sm text-[#94A3B8] mb-5">Tạo lớp học đầu tiên để bắt đầu giảng dạy</p>
                <button onClick={() => setShowCreateModal(true)}
                  className="px-8 py-3 rounded-full font-bold text-white bg-[#06B6D4] hover:bg-[#22D3EE] transition-all duration-300 shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(34,211,238,0.5)] border-[2px] border-[#06B6D4]">
                  <FaPlus className="inline mr-2" size={12} /> Tạo lớp học
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classrooms.map((c) => (
                  <div key={c._id} className="rounded-[32px] overflow-hidden transition-all duration-300 hover:-translate-y-1 relative group"
                       style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
                    <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
                    
                    {/* Card top banner */}
                    <div className="px-6 py-4 relative overflow-hidden"
                         style={{ background: 'linear-gradient(135deg, #0369A1 0%, #06B6D4 100%)' }}>
                      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/5" />
                      <div className="relative z-10">
                        <p className="font-bold text-white text-base truncate">{c.name}</p>
                        <p className="text-white/60 text-xs mt-0.5">{c.subject || 'Chưa có môn học'}</p>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="px-6 py-4 space-y-3">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1.5 text-[#94A3B8]">
                          <FaUsers size={11} /> {c.participants.length}/{c.rows * c.cols} học sinh
                        </span>
                        <span className="flex items-center gap-1.5 text-[#94A3B8]">
                          {c.passwordHash ? <FaLock size={11} /> : <FaLockOpen size={11} />}
                          {c.passwordHash ? 'Có mật khẩu' : 'Mở'}
                        </span>
                      </div>
                      {/* Online status */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className={`flex items-center gap-1.5 font-semibold ${
                          c.teacherOnline ? 'text-[#22C55E]' : 'text-[#94A3B8]'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            c.teacherOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-[#CBD5E1]'
                          }`} />
                          Giáo viên {c.teacherOnline ? 'đang online' : 'offline'}
                        </span>
                        <span className={`flex items-center gap-1.5 font-semibold ${
                          c.onlineCount > 0 ? 'text-[#06B6D4]' : 'text-[#94A3B8]'
                        }`}>
                          <FaUsers size={10} />
                          {c.onlineCount} học sinh đang trong lớp
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#94A3B8]">Mã phòng:</span>
                          <code className="px-2 py-0.5 rounded-lg bg-[#E0F2FE] text-[#06B6D4] font-mono text-xs font-bold tracking-widest">
                            {c.code}
                          </code>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setDeletingId(c._id)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 transition-all duration-300">
                            <FaTrash size={11} />
                          </button>
                          <button onClick={() => handleEnterRoom(c._id)}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#06B6D4] text-white text-xs font-bold hover:bg-[#22D3EE] transition-all duration-300 shadow-[0_5px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_8px_20px_rgba(34,211,238,0.4)] border border-[#06B6D4]">
                            Vào lớp <FaArrowRight size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Student: join form + rejoined classrooms ─────────────────── */}
        {!isTeacher && (
          <div className="space-y-6">
            {/* Join form */}
            <div className="rounded-[32px] p-6 lg:p-8 relative"
                 style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
              <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20"></div>
              <h2 className="font-bold text-[#082F49] mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#06B6D4]"><FaSignInAlt size={13} /></span>
                Tham gia lớp học
              </h2>

              {joinError && (
                <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-semibold" style={{ background: 'rgba(254,226,226,0.9)', color: '#DC2626' }}>
                  {joinError}
                </div>
              )}

              <form onSubmit={handleJoin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Mã phòng học</label>
                  <input
                    placeholder="Nhập mã 6 ký tự..."
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
                    className={inputCls + ' uppercase tracking-[0.3em] font-mono font-bold text-center text-lg'}
                    maxLength={6}
                  />
                </div>
                {(needsPassword || joinPassword) && (
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">Mật khẩu phòng</label>
                    <input type="password" placeholder="Nhập mật khẩu..." value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} className={inputCls} />
                  </div>
                )}
                <button type="submit" disabled={joinLoading || joinCode.length < 6}
                  className="w-full py-4 rounded-full font-bold text-white bg-[#22C55E] hover:bg-[#4ADE80] disabled:opacity-50 transition-all duration-300 shadow-[0_10px_20px_rgba(34,197,94,0.3)] hover:shadow-[0_15px_30px_rgba(74,222,128,0.5)] flex items-center justify-center gap-2 border-[2px] border-[#22C55E]">
                  <FaSignInAlt size={13} />
                  {joinLoading ? 'Đang tham gia...' : 'Tham gia lớp học'}
                </button>
              </form>
            </div>

            {/* Joined classrooms */}
            {classrooms.length > 0 && (
              <div>
                <h2 className="font-bold text-[#082F49] mb-3 flex items-center gap-2">
                  <FaBook size={14} className="text-[#06B6D4]" /> Lớp học đã tham gia
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classrooms.map((c) => (
                    <div key={c._id} className="rounded-[32px] p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 relative group"
                         onClick={() => handleReEnter(c._id)}
                         style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)' }}>
                      <div className="absolute inset-0 rounded-[32px] border-2 border-white/40 pointer-events-none z-20 transition-all group-hover:border-cyan-300/50"></div>
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#06B6D4] to-[#0369A1] flex items-center justify-center text-white text-xl flex-shrink-0">
                        🏫
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#082F49] truncate">{c.name}</p>
                        <p className="text-xs text-[#94A3B8]">{c.teacherName} · {c.subject || 'Địa lý'}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className={`flex items-center gap-1 text-[10px] font-semibold ${
                            c.teacherOnline ? 'text-[#22C55E]' : 'text-[#94A3B8]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              c.teacherOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-[#CBD5E1]'
                            }`} />
                            GV {c.teacherOnline ? 'online' : 'offline'}
                          </span>
                          {c.onlineCount > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#06B6D4]">
                              <FaUsers size={8} /> {c.onlineCount} đang trong lớp
                            </span>
                          )}
                        </div>
                      </div>
                      <FaArrowRight size={13} className="text-[#06B6D4] flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
