'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  FaArrowLeft, FaSpinner, FaEdit, FaTrash, FaSave, FaTimes,
  FaExclamationTriangle, FaGlobeAsia, FaCheckCircle,
} from 'react-icons/fa';
import { Icon } from '@iconify/react';

/* ── helpers ── */
function flagEmoji(iso2: string) {
  if (!iso2 || iso2.length !== 2) return '🌐';
  return String.fromCodePoint(
    ...iso2.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)
  );
}

const INCOME_OPTIONS = [
  { value: 'HIC', label: 'Thu nhập cao (High income)', dot: '#F59E0B' },
  { value: 'UMC', label: 'Trên trung bình (Upper middle income)', dot: '#10B981' },
  { value: 'LMC', label: 'Dưới trung bình (Lower middle income)', dot: '#3B82F6' },
  { value: 'LIC', label: 'Thu nhập thấp (Low income)', dot: '#F43F5E' },
  { value: 'INX', label: 'Không phân loại', dot: '#94A3B8' },
];
const INCOME_PILL: Record<string, string> = {
  HIC: 'bg-amber-50 border border-amber-200 text-amber-700',
  UMC: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
  LMC: 'bg-blue-50 border border-blue-200 text-blue-700',
  LIC: 'bg-rose-50 border border-rose-200 text-rose-700',
  INX: 'bg-slate-50 border border-slate-200 text-slate-600',
};
const INCOME_DOT: Record<string, string> = {
  HIC: '#F59E0B', UMC: '#10B981', LMC: '#3B82F6', LIC: '#F43F5E', INX: '#94A3B8',
};

/* ── form field types ── */
interface EcoForm {
  capitalCity: string;
  incomeLevelCode: string;
  incomeLevel: string;
  gdpPerCapita: string;
  gdpTotal: string;
  population: string;
  unemployment: string;
  lifeExpectancy: string;
  // supplementary
  nameOfficial: string;
  area: string;
  tld: string;         // comma-separated
  callingCodes: string; // comma-separated
  unMember: boolean;
  currencies: string;  // free text, JSON display
}

/* ── ConfirmDialog ── */
function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#082F49]/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[rgba(255,255,255,0.85)] backdrop-blur-[24px] border border-white/80
        rounded-[32px] shadow-[0_20px_60px_rgba(8,47,73,0.2)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto bg-red-100 text-red-500">
            <FaExclamationTriangle className="text-xl" />
          </div>
          <p className="text-center font-bold text-[#082F49]">{message}</p>
          <div className="flex gap-3 pt-2">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-full border border-slate-200 text-sm font-bold text-[#334155] hover:bg-slate-50 transition-all">
              Huỷ
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold transition-all hover:from-red-400 hover:to-rose-400">
              Xoá
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── FormField components ── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-[#334155] mb-1">{children}</label>;
}
function ReadonlyField({ value }: { value: string }) {
  return (
    <div className="w-full px-3 py-2.5 rounded-[16px] border border-slate-100 bg-slate-50 text-sm text-[#334155] font-semibold min-h-[40px]">
      {value || <span className="text-[#94A3B8]">—</span>}
    </div>
  );
}
function InputField({ value, onChange, type = 'text', placeholder }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-[16px] border border-slate-200 bg-white text-sm
        text-[#082F49] font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
    />
  );
}

/* ══════════════════════════════════════════════════
   MAIN CLIENT COMPONENT
══════════════════════════════════════════════════ */
export default function CountryDetailClient({ id }: { id: string }) {
  const router = useRouter();

  const [country, setCountry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EcoForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCountry = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/map/features/${id}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Không tìm thấy'); return; }
      setCountry(data.feature);
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCountry(); }, [fetchCountry]);

  /* build form from country */
  const startEdit = () => {
    if (!country) return;
    const a = country.attributes ?? {};
    setForm({
      capitalCity: a.capitalCity ?? '',
      incomeLevelCode: a.incomeLevelCode ?? 'INX',
      incomeLevel: a.incomeLevel ?? '',
      gdpPerCapita: a.gdpPerCapita != null ? String(a.gdpPerCapita) : '',
      gdpTotal: a.gdpTotal != null ? String(a.gdpTotal) : '',
      population: a.population != null ? String(a.population) : '',
      unemployment: a.unemployment != null ? String(a.unemployment) : '',
      lifeExpectancy: a.lifeExpectancy != null ? String(a.lifeExpectancy) : '',
      nameOfficial: a.nameOfficial ?? '',
      area: a.area != null ? String(a.area) : '',
      tld: Array.isArray(a.tld) ? a.tld.join(', ') : (a.tld ?? ''),
      callingCodes: Array.isArray(a.callingCodes) ? a.callingCodes.join(', ') : (a.callingCodes ?? ''),
      unMember: a.unMember ?? true,
      currencies: Array.isArray(a.currencies)
        ? a.currencies.map((c: any) => `${c.code}${c.name ? ' (' + c.name + ')' : ''}`).join(', ')
        : '',
    });
    setEditing(true);
    setSaveError('');
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true); setSaveError('');
    try {
      const tldArr = form.tld.split(',').map(s => s.trim()).filter(Boolean);
      const callingArr = form.callingCodes.split(',').map(s => s.trim()).filter(Boolean);
      const incomeLabel = INCOME_OPTIONS.find(o => o.value === form.incomeLevelCode)?.label
        .split(' (')[0] ?? form.incomeLevelCode;

      const patch = {
        attributes: {
          ...(country?.attributes ?? {}),
          capitalCity: form.capitalCity,
          incomeLevelCode: form.incomeLevelCode,
          incomeLevel: incomeLabel,
          gdpPerCapita: form.gdpPerCapita !== '' ? parseFloat(form.gdpPerCapita) : undefined,
          gdpTotal: form.gdpTotal !== '' ? parseFloat(form.gdpTotal) : undefined,
          population: form.population !== '' ? parseFloat(form.population) : undefined,
          unemployment: form.unemployment !== '' ? parseFloat(form.unemployment) : undefined,
          lifeExpectancy: form.lifeExpectancy !== '' ? parseFloat(form.lifeExpectancy) : undefined,
          nameOfficial: form.nameOfficial,
          area: form.area !== '' ? parseFloat(form.area) : undefined,
          tld: tldArr,
          callingCodes: callingArr,
          unMember: form.unMember,
        },
      };

      const res = await fetch(`/api/map/features/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại');
      setCountry(data.feature);
      setEditing(false);
      showToast('✅ Đã lưu thay đổi!');
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/map/features/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Xoá thất bại');
      router.push('/admin?tab=map');
    } catch (err: any) {
      showToast(err.message, 'error');
      setDeleting(false);
    }
    setConfirmDelete(false);
  };

  /* ── render ── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#E0F2FE 0%,#FFFFFF 50%,#DCFCE7 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="text-4xl text-cyan-400 animate-spin" />
          <p className="text-[#94A3B8] font-semibold">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#E0F2FE 0%,#FFFFFF 50%,#DCFCE7 100%)' }}>
        <div className="text-center space-y-4">
          <p className="text-5xl">🌐</p>
          <p className="font-bold text-[#082F49] text-lg">{error || 'Không tìm thấy quốc gia'}</p>
          <Link href="/admin?tab=map"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-500 text-white font-bold text-sm">
            <FaArrowLeft className="text-xs" /> Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const a = country.attributes ?? {};
  const flag = flagEmoji(a.iso2);
  const incCode = a.incomeLevelCode ?? 'INX';

  return (
    <div className="min-h-screen"
      style={{ background: 'linear-gradient(135deg,#E0F2FE 0%,#FFFFFF 50%,#DCFCE7 100%)' }}>
      {/* ── sticky header ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-[24px] border-b border-white
        shadow-[0_4px_24px_rgba(14,165,233,0.10)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#94A3B8] hover:text-[#334155] font-bold text-sm transition-colors group shrink-0">
              <span className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                <FaArrowLeft className="text-xs" />
              </span>
              <span className="hidden sm:inline">Danh sách Quốc gia</span>
            </button>
            <span className="text-slate-300 font-bold shrink-0">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl leading-none shrink-0">{flag}</span>
              <div className="min-w-0">
                <p className="font-black text-[#082F49] text-sm leading-none truncate">{country.name}</p>
                <p className="text-[#94A3B8] text-[10px] font-semibold mt-0.5">{a.iso2} · {a.iso3}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setSaveError(''); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-sm font-bold text-[#334155] hover:bg-slate-50 transition-all">
                  <FaTimes className="text-xs" /> Huỷ
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black text-white transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#06B6D4,#0284c7)', boxShadow: '0 8px 20px rgba(6,182,212,0.35)' }}>
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave className="text-xs" />}
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </>
            ) : (
              <>
                <button onClick={startEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-200 bg-cyan-50 text-sm font-bold text-cyan-700 hover:bg-cyan-100 transition-all">
                  <FaEdit className="text-xs" /> Chỉnh sửa
                </button>
                <button onClick={() => setConfirmDelete(true)} disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-200 bg-rose-50 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-60">
                  {deleting ? <FaSpinner className="animate-spin text-xs" /> : <FaTrash className="text-xs" />}
                  Xoá
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-[20px] text-sm font-bold shadow-[0_8px_24px_rgba(0,0,0,0.12)] border ${
            toast.type === 'success'
              ? 'bg-[rgba(187,247,208,0.95)] border-emerald-200 text-[#16A34A]'
              : 'bg-[rgba(254,226,226,0.95)] border-red-200 text-[#DC2626]'
          }`}>{toast.msg}</div>
        )}

        {confirmDelete && (
          <ConfirmDialog
            message={`Xoá quốc gia "${country.name}"? Thao tác này không thể hoàn tác.`}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(false)}
          />
        )}

        {/* ── Hero card ── */}
        <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] px-6 py-5 shadow-sm flex items-center gap-5">
          <span className="text-6xl leading-none">{flag}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-[#082F49] leading-tight">{country.name}</h1>
            {a.nameOfficial && a.nameOfficial !== country.name && (
              <p className="text-[#94A3B8] text-sm font-semibold mt-0.5">{a.nameOfficial}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {a.iso2 && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.iso2}</span>
              )}
              {a.iso3 && (
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.iso3}</span>
              )}
              {incCode && (
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${INCOME_PILL[incCode] ?? INCOME_PILL['INX']}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: INCOME_DOT[incCode] ?? '#94A3B8' }} />
                  {INCOME_OPTIONS.find(o => o.value === incCode)?.label.split(' (')[0] ?? incCode}
                </span>
              )}
              {a.unMember === true && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">🇺🇳 LHQ</span>
              )}
            </div>
          </div>
        </div>

        {saveError && (
          <div className="bg-[rgba(254,226,226,0.9)] border border-red-200 text-red-700 text-sm font-bold px-5 py-3 rounded-[20px]">
            ❌ {saveError}
          </div>
        )}

        {/* ── 2-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Section: Địa lý & Hành chính ── */}
          <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-6 shadow-sm space-y-5">
            <h2 className="font-black text-[#082F49] flex items-center gap-2">
              <span><Icon icon="mingcute:map-line" width={22} /></span> Địa lý & Hành chính
            </h2>

            {/* Tên chính thức */}
            <div>
              <FieldLabel>Tên chính thức</FieldLabel>
              {editing ? (
                <InputField value={form!.nameOfficial} onChange={v => setForm(p => p && ({ ...p, nameOfficial: v }))} />
              ) : (
                <ReadonlyField value={a.nameOfficial ?? ''} />
              )}
            </div>

            {/* Thủ đô */}
            <div>
              <FieldLabel>Thủ đô</FieldLabel>
              {editing ? (
                <InputField value={form!.capitalCity} onChange={v => setForm(p => p && ({ ...p, capitalCity: v }))} placeholder="VD: Hanoi" />
              ) : (
                <ReadonlyField value={a.capitalCity ?? ''} />
              )}
            </div>

            {/* Khu vực / Tiểu vùng (readonly) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Khu vực</FieldLabel>
                <ReadonlyField value={a.region ?? ''} />
              </div>
              <div>
                <FieldLabel>Tiểu vùng</FieldLabel>
                <ReadonlyField value={a.subregion ?? ''} />
              </div>
            </div>

            {/* Diện tích */}
            <div>
              <FieldLabel>Diện tích (km²)</FieldLabel>
              {editing ? (
                <InputField value={form!.area} onChange={v => setForm(p => p && ({ ...p, area: v }))} type="number" placeholder="VD: 331212" />
              ) : (
                <ReadonlyField value={a.area != null ? Number(a.area).toLocaleString('vi-VN') + ' km²' : ''} />
              )}
            </div>

            {/* TLD */}
            <div>
              <FieldLabel>TLD (cách nhau bằng dấu phẩy)</FieldLabel>
              {editing ? (
                <InputField value={form!.tld} onChange={v => setForm(p => p && ({ ...p, tld: v }))} placeholder=".vn, .viet" />
              ) : (
                <ReadonlyField value={Array.isArray(a.tld) ? a.tld.join(', ') : (a.tld ?? '')} />
              )}
            </div>

            {/* Mã điện thoại */}
            <div>
              <FieldLabel>Mã điện thoại (cách nhau bằng dấu phẩy)</FieldLabel>
              {editing ? (
                <InputField value={form!.callingCodes} onChange={v => setForm(p => p && ({ ...p, callingCodes: v }))} placeholder="+84, +95" />
              ) : (
                <ReadonlyField value={Array.isArray(a.callingCodes) ? a.callingCodes.join(', ') : (a.callingCodes ?? '')} />
              )}
            </div>

            {/* Tiền tệ */}
            <div>
              <FieldLabel>Tiền tệ</FieldLabel>
              <ReadonlyField value={
                Array.isArray(a.currencies) && a.currencies.length > 0
                  ? a.currencies.map((c: any) => `${c.code}${c.name ? ' (' + c.name + ')' : ''}`).join(' · ')
                  : ''
              } />
            </div>

            {/* Thành viên LHQ */}
            <div>
              <FieldLabel>Thành viên Liên Hợp Quốc</FieldLabel>
              {editing ? (
                <div className="flex gap-3">
                  {[true, false].map(v => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setForm(p => p && ({ ...p, unMember: v }))}
                      className={`flex-1 py-2 rounded-full text-sm font-bold border transition-all ${
                        form!.unMember === v
                          ? v
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                      {v ? '✅ Có' : '❌ Không'}
                    </button>
                  ))}
                </div>
              ) : (
                <ReadonlyField value={a.unMember === true ? '✅ Có' : a.unMember === false ? '❌ Không' : ''} />
              )}
            </div>
          </div>

          {/* ── Section: Kinh tế ── */}
          <div className="bg-white/65 backdrop-blur-[24px] border border-white/80 rounded-[32px] p-6 shadow-sm space-y-5">
            <h2 className="font-black text-[#082F49] flex items-center gap-2">
              <span>💰</span> Kinh tế
            </h2>

            {/* Income level */}
            <div>
              <FieldLabel>Mức thu nhập</FieldLabel>
              {editing ? (
                <select
                  value={form!.incomeLevelCode}
                  onChange={e => setForm(p => p && ({ ...p, incomeLevelCode: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-[16px] border border-slate-200 bg-white text-sm
                    text-[#082F49] font-semibold outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 cursor-pointer">
                  {INCOME_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <div className="py-2.5">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full ${INCOME_PILL[incCode] ?? INCOME_PILL['INX']}`}>
                    <span className="w-2 h-2 rounded-full" style={{ background: INCOME_DOT[incCode] ?? '#94A3B8' }} />
                    {INCOME_OPTIONS.find(o => o.value === incCode)?.label ?? incCode}
                  </span>
                </div>
              )}
            </div>

            {/* GDP per capita */}
            <div>
              <FieldLabel>GDP / đầu người (USD)</FieldLabel>
              {editing ? (
                <InputField value={form!.gdpPerCapita} onChange={v => setForm(p => p && ({ ...p, gdpPerCapita: v }))} type="number" placeholder="VD: 3756" />
              ) : (
                <ReadonlyField value={a.gdpPerCapita != null ? '$' + Number(a.gdpPerCapita).toLocaleString('en-US') : ''} />
              )}
            </div>

            {/* Total GDP */}
            <div>
              <FieldLabel>Tổng GDP (USD)</FieldLabel>
              {editing ? (
                <InputField value={form!.gdpTotal} onChange={v => setForm(p => p && ({ ...p, gdpTotal: v }))} type="number" placeholder="VD: 409000000000" />
              ) : (
                <ReadonlyField value={a.gdpTotal != null ? '$' + Number(a.gdpTotal).toLocaleString('en-US') : ''} />
              )}
            </div>

            {/* Population */}
            <div>
              <FieldLabel>Dân số</FieldLabel>
              {editing ? (
                <InputField value={form!.population} onChange={v => setForm(p => p && ({ ...p, population: v }))} type="number" placeholder="VD: 98186856" />
              ) : (
                <ReadonlyField value={a.population != null ? Number(a.population).toLocaleString('vi-VN') + ' người' : ''} />
              )}
            </div>

            {/* Unemployment */}
            <div>
              <FieldLabel>Tỷ lệ thất nghiệp (%)</FieldLabel>
              {editing ? (
                <InputField value={form!.unemployment} onChange={v => setForm(p => p && ({ ...p, unemployment: v }))} type="number" placeholder="VD: 2.3" />
              ) : (
                <ReadonlyField value={a.unemployment != null ? Number(a.unemployment).toFixed(1) + '%' : ''} />
              )}
            </div>

            {/* Life expectancy */}
            <div>
              <FieldLabel>Tuổi thọ trung bình (năm)</FieldLabel>
              {editing ? (
                <InputField value={form!.lifeExpectancy} onChange={v => setForm(p => p && ({ ...p, lifeExpectancy: v }))} type="number" placeholder="VD: 73.4" />
              ) : (
                <ReadonlyField value={a.lifeExpectancy != null ? Number(a.lifeExpectancy).toFixed(1) + ' tuổi' : ''} />
              )}
            </div>

            {/* Readonly: ISO codes, region (for reference) */}
            <div className="mt-2 pt-4 border-t border-slate-100 space-y-3">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Thông tin tham chiếu (chỉ đọc)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>ISO2</FieldLabel>
                  <ReadonlyField value={a.iso2 ?? ''} />
                </div>
                <div>
                  <FieldLabel>ISO3</FieldLabel>
                  <ReadonlyField value={a.iso3 ?? ''} />
                </div>
              </div>
              <div>
                <FieldLabel>Toạ độ (lat, lng)</FieldLabel>
                <ReadonlyField value={`${country.lat ?? '—'}, ${country.lng ?? '—'}`} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom save bar when editing ── */}
        {editing && (
          <div className="sticky bottom-4 z-40">
            <div className="bg-white/90 backdrop-blur-[20px] border border-white/80 rounded-[28px] px-6 py-4
              shadow-[0_16px_48px_rgba(6,182,212,0.2)] flex items-center gap-4">
              <FaCheckCircle className="text-cyan-500 text-lg shrink-0" />
              <p className="font-bold text-[#082F49] text-sm flex-1">Chỉnh sửa đang bật — nhớ lưu trước khi rời trang.</p>
              <button onClick={() => { setEditing(false); setSaveError(''); }}
                className="px-4 py-2 rounded-full border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
                Huỷ
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#06B6D4,#0284c7)', boxShadow: '0 8px 20px rgba(6,182,212,0.35)' }}>
                {saving ? <FaSpinner className="animate-spin" /> : <FaSave className="text-xs" />}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
