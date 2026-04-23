'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FaArrowLeft, FaEdit, FaTrash, FaShieldAlt, FaSpinner,
  FaTimes, FaExclamationTriangle, FaGraduationCap, FaSchool,
  FaMapMarkerAlt, FaCalendarAlt, FaFire, FaStar,
  FaEye, FaEyeSlash, FaLock, FaPaw, FaMedal,
} from 'react-icons/fa';
import { getPetInfo } from '@/utils/petSystem';
import { BADGES, checkUnlocked } from '@/data/badges';

const ROLE_LABEL: Record<number, { label: string; cls: string }> = {
  1: { label: 'Admin',     cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  2: { label: 'Giáo viên', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  3: { label: 'Học sinh',  cls: 'bg-sky-100 text-sky-700 border-sky-200' },
};

const PROVIDER_INFO: Record<string, { label: string; color: string }> = {
  google:      { label: 'Google',      color: 'bg-red-50 text-red-600 border-red-200' },
  facebook:    { label: 'Facebook',    color: 'bg-blue-50 text-blue-600 border-blue-200' },
  credentials: { label: 'Tài khoản',  color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

interface FullUser {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  provider: string;
  role: number;
  fullName?: string;
  className?: string;
  school?: string;
  province?: { code: number; name: string };
  ward?: { code: number; name: string };
  address?: string;
  exp: number;
  streak: number;
  streakLastDate?: string;
  studyTimeToday?: number;
  studyTimeDate?: string;
  petExp: number;
  coins: number;
  createdAt: string;
  updatedAt: string;
}

function formatStudyTime(seconds: number): string {
  if (!seconds) return '0 phút';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}g ${m}p`;
  return `${m} phút`;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="text-[#94A3B8] text-sm mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">{label}</p>
        <p className="text-[#334155] font-semibold text-sm mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

/* ── Admin Password Confirm Modal ──────────────────────────────── */
function AdminPasswordModal({ userId, onClose, onRevealed }: {
  userId: string;
  onClose: () => void;
  onRevealed: (hash: string) => void;
}) {
  const [pwd, setPwd]       = useState('');
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.trim()) { setError('Vui lòng nhập mật khẩu của bạn'); return; }
    setLoading(true); setError('');
    const res  = await fetch(`/api/admin/users/${userId}/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPassword: pwd }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Xác thực thất bại'); return; }
    onRevealed(data.passwordHash);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-[20px] border border-white
        rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-amber-50 to-orange-50">
          <h3 className="font-black text-[#082F49] text-base flex items-center gap-2">
            <FaLock className="text-amber-500" /> Xác thực Admin
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200
            flex items-center justify-center text-slate-500">
            <FaTimes className="text-xs" />
          </button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          <p className="text-sm text-[#334155] font-semibold">
            Nhập mật khẩu của tài khoản admin đang đăng nhập để xem thông tin nhạy cảm.
          </p>
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-[12px] bg-red-50 border
              border-red-200 text-red-600 text-sm font-semibold">
              <FaExclamationTriangle className="shrink-0 text-xs" /> {error}
            </div>
          )}
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              autoFocus
              placeholder="Mật khẩu của bạn"
              className="w-full rounded-[14px] border-2 border-slate-200 focus:border-amber-400
                bg-white/80 px-4 py-2.5 pr-11 text-sm text-[#082F49] font-medium outline-none
                transition-all placeholder:text-[#94A3B8]"
            />
            <button type="button" onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155]
                transition-colors">
              {show ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
            </button>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-amber-500 to-orange-500
                text-white text-sm font-bold hover:from-amber-400 hover:to-orange-400 transition-all
                flex items-center justify-center gap-2 disabled:opacity-50">
              {loading && <FaSpinner className="animate-spin text-xs" />}
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Password Reveal Row ────────────────────────────────────────── */
function PasswordRevealRow({ userId, provider }: { userId: string; provider: string }) {
  const [revealed, setRevealed]   = useState(false);
  const [hash, setHash]           = useState('');
  const [showModal, setShowModal] = useState(false);

  // Only credentials accounts have passwords
  if (provider !== 'credentials') {
    return (
      <div className="flex items-start gap-3 py-2.5 border-b border-slate-50">
        <span className="text-[#94A3B8] text-sm mt-0.5 shrink-0">🔑</span>
        <div className="min-w-0 flex-1">
          <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">Mật khẩu</p>
          <p className="text-[#94A3B8] text-sm font-semibold mt-0.5 italic">
            Không có (đăng nhập qua {provider})
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 border-b border-slate-50">
        <span className="text-[#94A3B8] text-sm shrink-0">🔑</span>
        <div className="min-w-0 flex-1">
          <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">Mật khẩu (DB)</p>
          <div className="flex items-center gap-2 mt-1">
            <input
              readOnly
              type={revealed ? 'text' : 'password'}
              value={revealed ? hash : '••••••••••••'}
              className="flex-1 min-w-0 rounded-[10px] border border-slate-200 bg-slate-50
                px-3 py-1.5 text-xs font-mono text-[#334155] outline-none tracking-widest
                overflow-hidden text-ellipsis"
            />
            <button
              title={revealed ? 'Ẩn' : 'Hiện mật khẩu (yêu cầu xác thực)'}
              onClick={() => {
                if (revealed) { setRevealed(false); setHash(''); }
                else { setShowModal(true); }
              }}
              className={`shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center
                text-sm border transition-all
                ${ revealed
                  ? 'bg-amber-50 border-amber-200 text-amber-500 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-[#94A3B8] hover:border-amber-300 hover:text-amber-500'
                }`}>
              {revealed ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {revealed && (
            <p className="text-[10px] text-[#94A3B8] mt-1.5 font-medium">
              * Đây là chuỗi hash bcrypt, không phải mật khẩu gốc.
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <AdminPasswordModal
          userId={userId}
          onClose={() => setShowModal(false)}
          onRevealed={h => { setHash(h); setRevealed(true); }}
        />
      )}
    </>
  );
}

/* ── Role Modal ─────────────────────────────────────────────────── */
function RoleModal({ user, onClose, onSaved }: {
  user: FullUser;
  onClose: () => void;
  onSaved: (newRole: number) => void;
}) {
  const [role, setRole]     = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res  = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');
      onSaved(role);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-[20px] border border-white
        rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100
          bg-gradient-to-r from-violet-50 to-purple-50">
          <h3 className="font-black text-[#082F49] text-lg">✏️ Phân quyền</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200
            flex items-center justify-center text-slate-500">
            <FaTimes className="text-xs" />
          </button>
        </div>
        <form onSubmit={handle} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-[12px] bg-red-50 border
              border-red-200 text-red-600 text-sm font-semibold">
              <FaExclamationTriangle className="shrink-0" /> {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            {([1, 2, 3] as const).map(r => {
              const info = ROLE_LABEL[r];
              return (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-[14px] border-2 text-left
                    font-bold transition-all text-sm
                    ${role === r
                      ? 'border-violet-400 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-slate-50 text-[#334155] hover:border-slate-300'
                    }`}>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                    ${role === r ? 'border-violet-500 bg-violet-500' : 'border-slate-300'}`}>
                    {role === r && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${info.cls}`}>{info.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
                text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
            <button type="submit" disabled={saving || role === user.role}
              className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-violet-500 to-purple-500
                text-white text-sm font-bold disabled:opacity-50 transition-all
                flex items-center justify-center gap-2">
              {saving && <FaSpinner className="animate-spin text-xs" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirm ─────────────────────────────────────────────── */
function DeleteConfirm({ username, onClose, onDeleted }: {
  username: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState('');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-[20px] border border-white
        rounded-[24px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] p-6 text-center">
        <div className="w-14 h-14 rounded-full mx-auto bg-red-100 flex items-center justify-center text-2xl mb-4">
          <FaExclamationTriangle className="text-red-500" />
        </div>
        {error && <p className="text-red-600 text-sm font-semibold mb-3">{error}</p>}
        <p className="text-[#082F49] font-bold text-base mb-1">Xoá tài khoản?</p>
        <p className="text-[#94A3B8] text-sm mb-6">
          Tài khoản <span className="font-black text-[#082F49]">{username}</span> sẽ bị xoá vĩnh viễn.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-[12px] border border-slate-200 text-sm font-bold
              text-[#334155] hover:bg-slate-50 transition-all">Huỷ</button>
          <button
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              setError('');
              try { onDeleted(); }
              catch { setError('Lỗi khi xoá'); setDeleting(false); }
            }}
            className="flex-1 py-2.5 rounded-[12px] bg-gradient-to-r from-red-500 to-rose-500
              text-white text-sm font-bold hover:from-red-400 hover:to-rose-400 transition-all
              flex items-center justify-center gap-2 disabled:opacity-50">
            {deleting && <FaSpinner className="animate-spin text-xs" />}
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page component ────────────────────────────────────────── */
export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [userId, setUserId]     = useState('');
  const [user, setUser]         = useState<FullUser | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [roleModal, setRoleModal]     = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    params.then(p => setUserId(p.id));
  }, [params]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setUser(data.user);
      } finally { setLoading(false); }
    })();
  }, [userId]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    const res  = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Xoá thất bại', 'error'); setDeleteModal(false); return; }
    showToast('Đã xoá tài khoản!', 'error');
    setTimeout(() => router.push('/admin?tab=users'), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%)' }}>
        <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: 'linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%)' }}>
        <div className="text-6xl">👤</div>
        <p className="text-[#082F49] font-black text-xl">Không tìm thấy người dùng</p>
        <Link href="/admin" className="text-cyan-600 font-bold hover:underline">← Quay lại Admin</Link>
      </div>
    );
  }

  const roleInfo     = ROLE_LABEL[user.role]     ?? { label: '?', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
  const providerInfo = PROVIDER_INFO[user.provider] ?? PROVIDER_INFO.credentials;
  const level        = Math.floor(user.exp / 100) + 1;
  const expInLevel   = user.exp % 100;

  // Pet info
  const petInfo = getPetInfo(user.petExp ?? 0);
  const petLevel = petInfo.currentLevel.level;
  const petStageName = petInfo.currentLevel.stageName;
  const isMaxPet = petInfo.isMaxLevel;

  // Badge count
  const unlockedBadgeCount = BADGES.filter(b =>
    checkUnlocked(b, user.exp, user.streak, 0, 0, 0, 0, petLevel)
  ).length;

  return (
    <>
      <style>{`body { background: linear-gradient(135deg, #E0F2FE 0%, #FFFFFF 50%, #DCFCE7 100%); }`}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[14px] text-sm font-bold
          shadow-lg border transition-all
          ${toast.type === 'success'
            ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
            : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>
          {toast.msg}
        </div>
      )}

      <div className="min-h-screen">
        {/* ── Topbar ── */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-[24px] border-b border-white
          shadow-[0_4px_24px_rgba(14,165,233,0.10)]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
            <Link href="/admin"
              className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold text-sm">
              <FaArrowLeft className="text-xs" />
              <span className="hidden sm:inline">Danh sách người dùng</span>
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-amber-400 to-orange-500
                flex items-center justify-center text-white shadow-md">
                <FaShieldAlt className="text-sm" />
              </div>
              <p className="font-black text-[#082F49] text-sm">Chi tiết người dùng</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-violet-50 border
                  border-violet-200 text-violet-700 text-sm font-bold hover:bg-violet-100 transition-all">
                <FaEdit className="text-xs" /> Phân quyền
              </button>
              <button onClick={() => setDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-[12px] bg-red-50 border
                  border-red-200 text-red-600 text-sm font-bold hover:bg-red-100 transition-all">
                <FaTrash className="text-xs" /> Xoá
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* ── Hero card ── */}
          <div className="rounded-[24px] p-6 md:p-8 flex flex-col sm:flex-row items-start gap-6"
            style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}>
            {/* Avatar */}
            <div className="w-24 h-24 rounded-[22px] bg-gradient-to-br from-cyan-400 to-blue-500
              flex items-center justify-center text-white text-4xl font-black shadow-lg shrink-0 overflow-hidden">
              {user.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : user.username.charAt(0).toUpperCase()}
            </div>

            {/* Basic info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-[#082F49]">{user.username}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.cls}`}>
                  {roleInfo.label}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${providerInfo.color}`}>
                  {providerInfo.label}
                </span>
              </div>
              {user.fullName && (
                <p className="text-[#334155] font-semibold text-base mb-1">{user.fullName}</p>
              )}
              {user.email && (
                <p className="text-[#94A3B8] text-sm font-medium">{user.email}</p>
              )}
              {/* Level progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-black text-[#082F49]">Cấp {level}</p>
                  <p className="text-xs font-bold text-[#94A3B8]">{expInLevel}/100 EXP</p>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500
                    transition-all duration-500" style={{ width: `${expInLevel}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <FaStar className="text-amber-400" />, label: 'Tổng EXP', value: (user.exp ?? 0).toLocaleString(), bg: 'bg-amber-50' },
              { icon: <FaFire className="text-orange-400" />, label: 'Chuỗi ngày', value: `${user.streak ?? 0} ngày`, bg: 'bg-orange-50' },
              { icon: <FaPaw className="text-emerald-500" />, label: 'Level Thú Cưng', value: `Lv.${petLevel} · ${petStageName}`, bg: 'bg-emerald-50' },
              { icon: <FaMedal className="text-violet-500" />, label: 'Huy hiệu', value: `${unlockedBadgeCount}/${BADGES.length} huy hiệu`, bg: 'bg-violet-50' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-[18px] p-4 border border-white/60
                shadow-[0_4px_16px_rgba(14,165,233,0.06)]`}>
                <div className="text-xl mb-2">{s.icon}</div>
                <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">{s.label}</p>
                <p className="text-[#082F49] text-xl font-black mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* ── Detail grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Personal info */}
            <div className="rounded-[24px] p-6"
              style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}>
              <h2 className="font-black text-[#082F49] text-base mb-4 flex items-center gap-2">
                <FaGraduationCap className="text-cyan-500" /> Thông tin học tập
              </h2>
              <InfoRow icon={<FaGraduationCap />} label="Họ và tên"   value={user.fullName} />
              <InfoRow icon={<FaSchool />}        label="Lớp"         value={user.className} />
              <InfoRow icon={<FaSchool />}        label="Trường"      value={user.school} />
              {!user.fullName && !user.className && !user.school && (
                <p className="text-[#94A3B8] text-sm font-semibold text-center py-4">Chưa cập nhật</p>
              )}
            </div>

            {/* Location */}
            <div className="rounded-[24px] p-6"
              style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}>
              <h2 className="font-black text-[#082F49] text-base mb-4 flex items-center gap-2">
                <FaMapMarkerAlt className="text-emerald-500" /> Địa chỉ
              </h2>
              <InfoRow icon={<FaMapMarkerAlt />} label="Tỉnh/Thành"  value={user.province?.name} />
              <InfoRow icon={<FaMapMarkerAlt />} label="Phường/Xã"   value={user.ward?.name} />
              <InfoRow icon={<FaMapMarkerAlt />} label="Địa chỉ"     value={user.address} />
              {!user.province && !user.ward && !user.address && (
                <p className="text-[#94A3B8] text-sm font-semibold text-center py-4">Chưa cập nhật</p>
              )}
            </div>

            {/* Account info */}
            <div className="rounded-[24px] p-6"
              style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}>
              <h2 className="font-black text-[#082F49] text-base mb-4 flex items-center gap-2">
                <FaCalendarAlt className="text-violet-500" /> Tài khoản
              </h2>
              <InfoRow icon="🆔"           label="ID"              value={user._id} />
              <InfoRow icon="👤"           label="Tên đăng nhập"   value={user.username} />
              <PasswordRevealRow userId={user._id} provider={user.provider} />
              <InfoRow icon="📧"           label="Email"           value={user.email} />
              <InfoRow icon="🔗"           label="Đăng nhập qua"   value={providerInfo.label} />
              <InfoRow icon={<FaCalendarAlt />} label="Ngày tạo"   value={new Date(user.createdAt).toLocaleString('vi-VN')} />
              <InfoRow icon={<FaCalendarAlt />} label="Cập nhật"   value={new Date(user.updatedAt).toLocaleString('vi-VN')} />
            </div>

            {/* Activity + Pet */}
            <div className="rounded-[24px] p-6"
              style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}>
              <h2 className="font-black text-[#082F49] text-base mb-4 flex items-center gap-2">
                <FaFire className="text-orange-400" /> Hoạt động
              </h2>
              <InfoRow icon={<FaStar />}   label="Tổng EXP"          value={(user.exp ?? 0).toLocaleString() + ' EXP'} />
              <InfoRow icon={<FaFire />}   label="Chuỗi ngày hiện tại" value={`${user.streak ?? 0} ngày liên tiếp`} />
              <InfoRow icon="📅"           label="Ngày streak gần nhất" value={user.streakLastDate || undefined} />
              <InfoRow icon="⏱️"           label="Học hôm nay"          value={formatStudyTime(user.studyTimeToday ?? 0)} />
              <InfoRow icon="📅"           label="Ngày học gần nhất"    value={user.studyTimeDate || undefined} />
              <InfoRow icon="🏆"           label="Cấp độ người dùng"   value={`Cấp ${level} (${user.exp ?? 0} EXP)`} />
            </div>

            {/* Pet & Badges */}
            <div className="rounded-[24px] p-6"
              style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,1)', boxShadow: '0 10px 30px rgba(14,165,233,0.08)' }}>
              <h2 className="font-black text-[#082F49] text-base mb-4 flex items-center gap-2">
                <FaPaw className="text-emerald-500" /> Thú Cưng &amp; Huy Hiệu
              </h2>
              {/* Pet info */}
              <div className="flex items-center gap-3 p-3 rounded-[16px] bg-emerald-50 border border-emerald-100 mb-3">
                <span className="text-2xl">🐾</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">Thú cưng</p>
                  <p className="text-[#082F49] font-black text-sm">Lv.{petLevel} · {petStageName}{isMaxPet ? ' 🌟 MAX' : ''}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="flex-1 h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: isMaxPet ? '100%' : `${petInfo.progressPercent}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 shrink-0">
                      {user.petExp ?? 0} EXP
                    </span>
                  </div>
                </div>
              </div>
              {/* Coins */}
              <InfoRow icon="🪙" label="Xu hiện có" value={`${(user.coins ?? 0).toLocaleString()} xu`} />
              {/* Badges */}
              <div className="mt-3 flex items-center justify-between p-3 rounded-[16px] bg-violet-50 border border-violet-100">
                <div className="flex items-center gap-2">
                  <FaMedal className="text-violet-500 text-lg" />
                  <div>
                    <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-wide">Huy hiệu mở khoá</p>
                    <p className="text-[#082F49] font-black text-sm">{unlockedBadgeCount} / {BADGES.length} huy hiệu</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
                  {BADGES.filter(b => checkUnlocked(b, user.exp, user.streak, 0, 0, 0, 0, petLevel))
                    .slice(0, 6).map(b => (
                      <span key={b.id} title={b.name} className="text-base">{b.icon}</span>
                    ))}
                  {unlockedBadgeCount > 6 && (
                    <span className="text-xs font-bold text-violet-600">+{unlockedBadgeCount - 6}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {roleModal && (
        <RoleModal
          user={user}
          onClose={() => setRoleModal(false)}
          onSaved={newRole => {
            setUser(u => u ? { ...u, role: newRole } : u);
            showToast('✅ Đã cập nhật vai trò!');
          }}
        />
      )}
      {deleteModal && (
        <DeleteConfirm
          username={user.username}
          onClose={() => setDeleteModal(false)}
          onDeleted={handleDelete}
        />
      )}
    </>
  );
}
