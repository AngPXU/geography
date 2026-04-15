'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCamera, FaEdit, FaSave, FaTimes,
  FaMapMarkerAlt, FaGraduationCap, FaUser, FaLock, FaGlobe,
  FaChevronDown, FaEye, FaEyeSlash, FaCheckCircle, FaCompass,
} from 'react-icons/fa';

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminUnit = { code: number; name: string };

type ProfileData = {
  username: string;
  email?: string;
  avatar?: string;
  role: 1 | 2 | 3;
  fullName?: string;
  className?: string;
  school?: string;
  province?: AdminUnit;
  ward?: AdminUnit;
  address?: string;
  createdAt: string;
};

type FormState = {
  fullName: string;
  className: string;
  school: string;
  email: string;
  address: string;
  province: AdminUnit | null;
  ward: AdminUnit | null;
  avatar: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<number, string> = {
  1: 'Quản trị viên',
  2: 'Giáo viên',
  3: 'Học sinh',
};

const ROLE_BADGE: Record<number, string> = {
  1: 'bg-purple-100 text-purple-700',
  2: 'bg-cyan-100 text-[#0284C7]',
  3: 'bg-emerald-100 text-[#16A34A]',
};

// ─── Helper sub-components ────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl p-6"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,1)',
        boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="w-8 h-8 rounded-xl bg-[#E0F2FE] text-[#06B6D4] flex items-center justify-center">
          {icon}
        </span>
        <h2 className="text-sm font-bold text-[#082F49] tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, empty = '—' }: { label: string; value?: string; empty?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${value ? 'text-[#082F49]' : 'text-[#CBD5E1] italic font-normal'}`}>
        {value || empty}
      </p>
    </div>
  );
}

function GlassInput({
  label,
  id,
  value,
  onChange,
  placeholder,
  disabled,
  type = 'text',
}: {
  label: string;
  id: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 rounded-2xl text-sm text-[#082F49] placeholder-[#94A3B8]
                   bg-white/80 border border-[#BAE6FD]
                   shadow-[0_2px_8px_rgba(14,165,233,0.1)]
                   focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]
                   disabled:bg-white/40 disabled:text-[#94A3B8] disabled:cursor-not-allowed
                   transition-all duration-300"
      />
    </div>
  );
}

function GlassSelect({
  label,
  id,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-2.5 pr-12 rounded-2xl text-sm text-[#082F49]
                     bg-white/80 border border-[#BAE6FD] appearance-none
                     shadow-[0_2px_8px_rgba(14,165,233,0.1)]
                     focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {children}
        </select>
        <div className="absolute right-0 top-0 h-full flex items-center px-3 pointer-events-none border-l border-[#BAE6FD]">
          <FaChevronDown className="text-[#06B6D4]" size={11} />
        </div>
      </div>
    </div>
  );
}

function PwInput({
  id,
  label,
  value,
  onChange,
  show,
  setShow,
  hint,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#334155] mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-12 rounded-2xl text-sm text-[#082F49] placeholder-[#94A3B8]
                     bg-white/80 border border-[#BAE6FD]
                     shadow-[0_2px_8px_rgba(14,165,233,0.1)]
                     focus:outline-none focus:border-[#06B6D4] focus:shadow-[0_0_0_3px_rgba(6,182,212,0.15)]
                     transition-all duration-300"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#06B6D4] transition-colors"
        >
          {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </button>
      </div>
      {hint && <p className="text-[10px] text-[#94A3B8] mt-1 ml-1">{hint}</p>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileClient() {
  const router = useRouter();

  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState | null>(null);

  // Address dropdowns
  const [provinces, setProvinces] = useState<AdminUnit[]>([]);
  const [wards, setWards] = useState<AdminUnit[]>([]);

  // Password change
  const [pwOpen, setPwOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState('');

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geo coords from IP
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number; country: string; city: string } | null>(null);

  // Status
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Fetch profile ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((data: { user?: ProfileData; error?: string }) => {
        if (data.user) setProfile(data.user);
        else setError('Không thể tải thông tin cá nhân');
      })
      .catch(() => setError('Không thể tải thông tin cá nhân'))
      .finally(() => setFetchLoading(false));
  }, []);

  // ── Fetch geo coords from IP ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/user/geo')
      .then((r) => r.json())
      .then((d: { lat?: number; lon?: number; country?: string; city?: string; error?: string }) => {
        if (d.lat !== undefined && d.lon !== undefined) {
          setGeoCoords({ lat: d.lat, lon: d.lon, country: d.country ?? '', city: d.city ?? '' });
        }
      })
      .catch(() => {});
  }, []);

  // ── Fetch provinces ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then((r) => r.json())
      .then((data: AdminUnit[]) => setProvinces(data))
      .catch(() => {});
  }, []);

  // ── Fetch wards when province changes (edit mode) ──────────────────────────
  const editProvCode = form?.province?.code;
  useEffect(() => {
    if (!editProvCode) { setWards([]); return; }
    fetch(`https://provinces.open-api.vn/api/v2/p/${editProvCode}?depth=2`)
      .then((r) => r.json())
      .then((data: { wards?: AdminUnit[] }) => setWards(data.wards ?? []))
      .catch(() => {});
  }, [editProvCode]);

  // ── Fetch wards for view mode ──────────────────────────────────────────────
  const viewProvCode = profile?.province?.code;
  useEffect(() => {
    if (!viewProvCode || editing) return;
    fetch(`https://provinces.open-api.vn/api/v2/p/${viewProvCode}?depth=2`)
      .then((r) => r.json())
      .then((data: { wards?: AdminUnit[] }) => setWards(data.wards ?? []))
      .catch(() => {});
  }, [viewProvCode, editing]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function startEditing() {
    if (!profile) return;
    setForm({
      fullName: profile.fullName ?? '',
      className: profile.className ?? '',
      school: profile.school ?? '',
      email: profile.email ?? '',
      address: profile.address ?? '',
      province: profile.province ?? null,
      ward: profile.ward ?? null,
      avatar: profile.avatar ?? '',
    });
    setEditing(true);
    setError('');
    setSuccess('');
  }

  function cancelEditing() {
    setEditing(false);
    setForm(null);
    setError('');
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const SIZE = 256;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setForm((f) => (f ? { ...f, avatar: dataUrl } : f));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          className: form.className,
          school: form.school,
          email: form.email,
          address: form.address,
          province: form.province,
          ward: form.ward,
          avatar: form.avatar || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Cập nhật thất bại');
      } else {
        const updated = await fetch('/api/user/profile').then((r) =>
          r.json() as Promise<{ user: ProfileData }>,
        );
        setProfile(updated.user);
        setEditing(false);
        setForm(null);
        setSuccess('Thông tin đã được cập nhật thành công!');
        router.refresh();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange() {
    setPwError('');
    if (!currentPw) { setPwError('Vui lòng nhập mật khẩu hiện tại'); return; }
    if (!newPw) { setPwError('Vui lòng nhập mật khẩu mới'); return; }
    const pwValid =
      newPw.length >= 8 &&
      /[A-Z]/.test(newPw) &&
      /[a-z]/.test(newPw) &&
      /[0-9]/.test(newPw) &&
      /[^A-Za-z0-9]/.test(newPw);
    if (!pwValid) {
      setPwError('Mật khẩu mới cần: ≥8 ký tự, có hoa, thường, số và ký tự đặc biệt');
      return;
    }
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwError(data.error ?? 'Đổi mật khẩu thất bại');
      } else {
        setPwOpen(false);
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
        setSuccess('Mật khẩu đã được thay đổi thành công!');
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch {
      setPwError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  }

  // ── Loading / error states ─────────────────────────────────────────────────

  if (fetchLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#06B6D4]/30 border-t-[#06B6D4] animate-spin" />
        <p className="text-[#94A3B8] text-sm">Đang tải thông tin...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-32 text-[#94A3B8]">
        Không thể tải thông tin. Vui lòng thử lại.
      </div>
    );
  }

  const displayAvatar = editing && form?.avatar ? form.avatar : profile.avatar;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-12">

      {/* ── Toast notifications ─────────────────────────────────────────── */}
      {success && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold transition-all duration-300"
          style={{
            background: 'rgba(187,247,208,0.9)',
            color: '#16A34A',
            border: '1px solid rgba(134,239,172,0.5)',
            boxShadow: '0 4px 16px rgba(34,197,94,0.1)',
          }}
        >
          <FaCheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-semibold"
          style={{
            background: 'rgba(254,226,226,0.9)',
            color: '#DC2626',
            border: '1px solid rgba(252,165,165,0.5)',
          }}
        >
          <FaTimes size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Hero Card ───────────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0369A1 0%, #06B6D4 45%, #22C55E 100%)',
          boxShadow: '0 24px 64px rgba(6,182,212,0.3)',
        }}
      >
        {/* Map-grid decorative overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/5" />
        {/* Compass rose watermark */}
        <div className="absolute bottom-14 right-6 text-white/10 text-[80px] select-none pointer-events-none">
          ✦
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-8">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/70"
              style={{ boxShadow: '0 0 0 6px rgba(255,255,255,0.15), 0 12px 40px rgba(0,0,0,0.25)' }}
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                  <span className="text-5xl">🌍</span>
                </div>
              )}
            </div>
            {editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-[#06B6D4] hover:scale-110 hover:bg-[#E0F2FE] transition-all duration-200"
                title="Đổi ảnh đại diện"
              >
                <FaCamera size={14} />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name & badges */}
          <div className="text-center md:text-left flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">
              {profile.fullName || profile.username}
            </h1>
            <p className="text-white/60 text-sm mb-3">@{profile.username}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-sm border border-white/20">
                {ROLE_LABEL[profile.role]}
              </span>
              {profile.school && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white/90 backdrop-blur-sm flex items-center gap-1 border border-white/20">
                  <FaGraduationCap size={10} /> {profile.school}
                </span>
              )}
              {profile.className && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white/90 backdrop-blur-sm border border-white/20">
                  Lớp {profile.className}
                </span>
              )}
            </div>
            {/* Geo decoration */}
            <p className="text-white/40 text-[11px] mt-3 font-mono flex items-center justify-center md:justify-start gap-1.5">
              <FaCompass size={10} />
              {geoCoords
                ? `${Math.abs(geoCoords.lat).toFixed(1)}°${geoCoords.lat >= 0 ? 'N' : 'S'} · ${Math.abs(geoCoords.lon).toFixed(1)}°${geoCoords.lon >= 0 ? 'E' : 'W'} · ${geoCoords.city ? geoCoords.city + ', ' : ''}${geoCoords.country}`
                : '··· · ··· · ···'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
            {!editing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/35 text-white font-semibold backdrop-blur-sm text-sm transition-all duration-300 border border-white/25"
              >
                <FaEdit size={13} /> Chỉnh sửa
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-[#0369A1] font-bold text-sm hover:bg-[#E0F2FE] transition-all duration-300 shadow-md disabled:opacity-60"
                >
                  <FaSave size={13} /> {saving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-all duration-300 border border-white/20"
                >
                  <FaTimes size={13} /> Hủy
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-4 border-t border-white/15">
          {[
            { icon: '🌍', label: 'Vùng khám phá', value: '1' },
            { icon: '🏆', label: 'Điểm cao nhất', value: '—' },
            { icon: '⚡', label: 'Lượt quiz', value: '0' },
            { icon: '🔥', label: 'Chuỗi ngày', value: '0' },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-4 gap-0.5 hover:bg-white/5 transition-colors">
              <span className="text-xl mb-0.5">{s.icon}</span>
              <span className="text-white font-bold text-base leading-none">{s.value}</span>
              <span className="text-white/50 text-[9px] uppercase tracking-wide text-center leading-tight px-1 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Thông tin cá nhân ─────────────────────────────────────────────── */}
      <SectionCard icon={<FaUser size={13} />} title="Thông tin cá nhân">
        {editing && form ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Họ và tên"
              id="fullName"
              value={form.fullName}
              onChange={(v) => setForm((f) => (f ? { ...f, fullName: v } : f))}
              placeholder="Nguyễn Văn An"
            />
            <div>
              <p className="text-xs font-semibold text-[#334155] mb-1.5 ml-1">Vai trò</p>
              <span className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-bold ${ROLE_BADGE[profile.role]}`}>
                {ROLE_LABEL[profile.role]}
              </span>
              <p className="text-[10px] text-[#94A3B8] mt-1 ml-1">Không thể tự thay đổi vai trò</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoRow label="Họ và tên" value={profile.fullName} empty="Chưa cập nhật" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#94A3B8] mb-1">Vai trò</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${ROLE_BADGE[profile.role]}`}>
                {ROLE_LABEL[profile.role]}
              </span>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Học tập ───────────────────────────────────────────────────────── */}
      <SectionCard icon={<FaGraduationCap size={13} />} title="Thông tin học tập">
        {editing && form ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Lớp"
              id="className"
              value={form.className}
              onChange={(v) => setForm((f) => (f ? { ...f, className: v } : f))}
              placeholder="Ví dụ: 8A1"
            />
            <GlassInput
              label="Trường"
              id="school"
              value={form.school}
              onChange={(v) => setForm((f) => (f ? { ...f, school: v } : f))}
              placeholder="Tên trường của bạn"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoRow label="Lớp" value={profile.className} empty="Chưa cập nhật" />
            <InfoRow label="Trường" value={profile.school} empty="Chưa cập nhật" />
          </div>
        )}
      </SectionCard>

      {/* ── Tài khoản ─────────────────────────────────────────────────────── */}
      <SectionCard icon={<FaGlobe size={13} />} title="Tài khoản">
        {editing && form ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassInput
              label="Tên đăng nhập (không thể thay đổi)"
              id="username-display"
              value={profile.username}
              disabled
            />
            <GlassInput
              label="Email"
              id="email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => (f ? { ...f, email: v } : f))}
              placeholder="example@email.com"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoRow label="Tên đăng nhập" value={profile.username} />
            <InfoRow label="Email" value={profile.email} empty="Chưa thêm email" />
          </div>
        )}
      </SectionCard>

      {/* ── Địa chỉ ───────────────────────────────────────────────────────── */}
      <SectionCard icon={<FaMapMarkerAlt size={13} />} title="Địa chỉ">
        {editing && form ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassSelect
                label="Tỉnh / Thành phố"
                id="province"
                value={String(form.province?.code ?? '')}
                onChange={(v) => {
                  const p = provinces.find((x) => String(x.code) === v) ?? null;
                  setForm((f) => (f ? { ...f, province: p, ward: null } : f));
                }}
              >
                <option value="">-- Chọn tỉnh / thành phố --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={String(p.code)}>{p.name}</option>
                ))}
              </GlassSelect>
              <GlassSelect
                label="Xã / Phường"
                id="ward"
                value={String(form.ward?.code ?? '')}
                onChange={(v) => {
                  const w = wards.find((x) => String(x.code) === v) ?? null;
                  setForm((f) => (f ? { ...f, ward: w } : f));
                }}
                disabled={!form.province || wards.length === 0}
              >
                <option value="">-- Chọn xã / phường --</option>
                {wards.map((w) => (
                  <option key={w.code} value={String(w.code)}>{w.name}</option>
                ))}
              </GlassSelect>
            </div>
            <GlassInput
              label="Địa chỉ hiện tại"
              id="address"
              value={form.address}
              onChange={(v) => setForm((f) => (f ? { ...f, address: v } : f))}
              placeholder="Số nhà, tên đường, khu vực..."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoRow label="Tỉnh / Thành phố" value={profile.province?.name} empty="Chưa cập nhật" />
            <InfoRow label="Xã / Phường" value={profile.ward?.name} empty="Chưa cập nhật" />
            {profile.address && (
              <div className="md:col-span-2">
                <InfoRow label="Địa chỉ hiện tại" value={profile.address} />
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Bảo mật ───────────────────────────────────────────────────────── */}
      <SectionCard icon={<FaLock size={13} />} title="Bảo mật">
        <button
          onClick={() => { setPwOpen((o) => !o); setPwError(''); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 ${
            pwOpen
              ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30'
              : 'bg-white/60 text-[#334155] border border-[#BAE6FD] hover:border-[#06B6D4]/50 hover:text-[#06B6D4]'
          }`}
        >
          <FaLock size={11} />
          {pwOpen ? 'Đóng' : 'Đổi mật khẩu'}
          <FaChevronDown
            size={10}
            className={`transition-transform duration-300 ${pwOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {pwOpen && (
          <div className="mt-5 space-y-4 pt-5 border-t border-[#E0F2FE]">
            {pwError && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-semibold"
                style={{ background: 'rgba(254,226,226,0.8)', color: '#DC2626' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#F87171] flex-shrink-0" />
                {pwError}
              </div>
            )}
            <PwInput
              id="cur-pw"
              label="Mật khẩu hiện tại"
              value={currentPw}
              onChange={setCurrentPw}
              show={showCurrentPw}
              setShow={setShowCurrentPw}
              placeholder="Nhập mật khẩu hiện tại"
            />
            <PwInput
              id="new-pw"
              label="Mật khẩu mới"
              value={newPw}
              onChange={setNewPw}
              show={showNewPw}
              setShow={setShowNewPw}
              placeholder="Tối thiểu 8 ký tự"
              hint="Phải có: chữ hoa, chữ thường, chữ số và ký tự đặc biệt (!@#$...)"
            />
            <PwInput
              id="confirm-pw"
              label="Xác nhận mật khẩu mới"
              value={confirmPw}
              onChange={setConfirmPw}
              show={showConfirmPw}
              setShow={setShowConfirmPw}
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              onClick={handlePasswordChange}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl font-bold text-white text-sm bg-[#06B6D4] hover:bg-[#22D3EE] disabled:opacity-60 transition-all duration-300 shadow-md"
            >
              {saving ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <p className="text-center text-[#94A3B8] text-xs py-2">
        🌏 Tham gia GeoLearn từ{' '}
        {new Date(profile.createdAt).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}
