'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface EcoAttrs {
  iso3?: string;
  iso2?: string;
  region?: string;
  capitalCity?: string;
  incomeLevel?: string;
  incomeLevelCode?: string;
  gdpPerCapita?: number | null;
  gdpTotal?: number | null;
  population?: number | null;
  unemployment?: number | null;
  lifeExpectancy?: number | null;
  emoji?: string;
  color?: string;
  desc?: string;
}

interface EcoCountry {
  _id: string;
  id: string;
  name: string;
  lat: number;
  lng: number;
  attributes: EcoAttrs;
}

interface FormState {
  capitalCity: string;
  incomeLevelCode: string;
  incomeLevel: string;
  gdpPerCapita: string;
  gdpTotal: string;
  population: string;
  unemployment: string;
  lifeExpectancy: string;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const INCOME_OPTIONS = [
  { code: 'HIC', label: 'Phát triển cao (HIC)',   color: '#16a34a' },
  { code: 'UMC', label: 'Thu nhập trên TB (UMC)', color: '#0284c7' },
  { code: 'LMC', label: 'Đang phát triển (LMC)', color: '#d97706' },
  { code: 'LIC', label: 'Kém phát triển (LIC)',  color: '#dc2626' },
  { code: 'INX', label: 'Không phân loại',        color: '#94a3b8' },
];

const EMPTY_FORM: FormState = {
  capitalCity: '', incomeLevelCode: 'INX', incomeLevel: 'Không phân loại',
  gdpPerCapita: '', gdpTotal: '', population: '', unemployment: '', lifeExpectancy: '',
};

// ── Field component ────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', readonly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; readonly?: boolean;
}) {
  const base = `w-full text-[#082F49] text-sm font-medium bg-white/70 border border-white/80 rounded-2xl px-4 py-3 focus:outline-none focus:bg-white focus:border-[#06B6D4]/50 focus:ring-4 focus:ring-[#06B6D4]/10 transition-all placeholder-[#94A3B8] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${readonly ? 'opacity-60 cursor-not-allowed' : ''}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-extrabold text-[#334155] uppercase tracking-wider pl-1">{label}</label>
      <input
        className={base} type={type} value={value}
        readOnly={readonly} onChange={e => onChange?.(e.target.value)}
      />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function CountryEditor({ onClose, onSaved }: Props) {
  const [countries, setCountries] = useState<EcoCountry[]>([]);
  const [selected, setSelected] = useState<EcoCountry | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fetch World Bank economic data từ GeoFeature collection
  useEffect(() => {
    setLoading(true);
    fetch('/api/map/features?category=economic')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          const eco = data
            .filter(f => f.subCategory === 'country_economy')
            .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
          setCountries(eco);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const selectCountry = (c: EcoCountry) => {
    setSelected(c);
    const a = c.attributes ?? {};
    setForm({
      capitalCity:     a.capitalCity     ?? '',
      incomeLevelCode: a.incomeLevelCode ?? 'INX',
      incomeLevel:     a.incomeLevel     ?? 'Không phân loại',
      gdpPerCapita:    a.gdpPerCapita    != null ? String(a.gdpPerCapita)   : '',
      gdpTotal:        a.gdpTotal        != null ? String(a.gdpTotal)       : '',
      population:      a.population      != null ? String(a.population)     : '',
      unemployment:    a.unemployment    != null ? String(a.unemployment)   : '',
      lifeExpectancy:  a.lifeExpectancy  != null ? String(a.lifeExpectancy) : '',
    });
  };

  const setField = (key: keyof FormState, val: string) =>
    setForm(f => ({ ...f, [key]: val }));

  const handleIncomeChange = (code: string) => {
    const opt = INCOME_OPTIONS.find(o => o.code === code);
    setForm(f => ({ ...f, incomeLevelCode: code, incomeLevel: opt?.label ?? 'Không phân loại' }));
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const patch = {
        attributes: {
          ...selected.attributes,
          capitalCity:     form.capitalCity,
          incomeLevelCode: form.incomeLevelCode,
          incomeLevel:     form.incomeLevel,
          color:           INCOME_OPTIONS.find(o => o.code === form.incomeLevelCode)?.color ?? '#94a3b8',
          gdpPerCapita:    form.gdpPerCapita    ? Number(form.gdpPerCapita)    : null,
          gdpTotal:        form.gdpTotal        ? Number(form.gdpTotal)        : null,
          population:      form.population      ? Number(form.population)      : null,
          unemployment:    form.unemployment    ? Number(form.unemployment)    : null,
          lifeExpectancy:  form.lifeExpectancy  ? Number(form.lifeExpectancy)  : null,
        },
      };
      const res = await fetch(`/api/map/features/${selected._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) { alert('Lỗi khi lưu'); return; }
      const data = await res.json();
      setCountries(prev => prev.map(c => c._id === selected._id ? data.feature : c));
      setSelected(data.feature);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || !confirm(`Xoá ${selected.name} khỏi dữ liệu kinh tế?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/map/features/${selected._id}`, { method: 'DELETE' });
      setCountries(prev => prev.filter(c => c._id !== selected._id));
      setSelected(null);
      setForm(EMPTY_FORM);
      onSaved();
    } finally {
      setDeleting(false);
    }
  };

  const filtered = search
    ? countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.attributes?.iso3 ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[#082F49]/40 backdrop-blur-md" />
      <div className="absolute top-[10%] left-[20%] w-[40vw] h-[40vw] bg-[#06B6D4]/30 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[20%] w-[40vw] h-[40vw] bg-[#22C55E]/20 rounded-full blur-[100px] pointer-events-none" style={{ animation: 'pulse 4s infinite 2s' }} />

      <div
        className="relative w-full max-w-5xl h-[85vh] rounded-[32px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 1)',
          boxShadow: '0 30px 60px rgba(14, 165, 233, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-[32px] border-2 border-white/50 pointer-events-none z-20" />

        {/* Header */}
        <div className="relative z-30 flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-white/60 bg-white/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#06B6D4] to-blue-500 flex items-center justify-center text-white shadow-md">
              <Icon icon="mingcute:chart-bar-fill" width={22} />
            </div>
            <div>
              <p className="font-black text-[#082F49] text-xl leading-none">Dữ liệu Kinh tế Quốc gia</p>
              <p className="text-[#06B6D4] font-bold text-xs uppercase tracking-widest mt-1">
                {loading ? 'Đang tải...' : `${countries.length} quốc gia — World Bank`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/80 text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-sm font-bold shadow-sm border border-white transition-all"
          >✕</button>
        </div>

        {/* Body */}
        <div className="relative z-30 flex flex-1 overflow-hidden">

          {/* Left: search + list */}
          <div className="w-72 flex-shrink-0 border-r border-white/60 bg-white/20 flex flex-col p-4 gap-3">
            <input
              className="w-full px-4 py-2.5 rounded-2xl text-sm font-medium bg-white/80 border border-white/80 focus:outline-none focus:border-[#06B6D4]/50 focus:ring-4 focus:ring-[#06B6D4]/10 text-[#082F49] placeholder-[#94A3B8]"
              placeholder="Tìm quốc gia, mã ISO3..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {loading ? (
                <div className="flex items-center justify-center py-8 opacity-50">
                  <span className="text-sm font-medium text-[#082F49]">Đang tải dữ liệu...</span>
                </div>
              ) : filtered.map(c => {
                const code = c.attributes?.incomeLevelCode ?? 'INX';
                const dotColor = INCOME_OPTIONS.find(o => o.code === code)?.color ?? '#94a3b8';
                return (
                  <button
                    key={c._id}
                    onClick={() => selectCountry(c)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-[14px] text-left transition-all duration-200 border ${
                      selected?._id === c._id
                        ? 'text-[#082F49] bg-white border-white shadow-[0_4px_15px_rgba(14,165,233,0.1)]'
                        : 'text-[#334155] border-transparent hover:bg-white/60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                    <span className={`text-sm truncate ${selected?._id === c._id ? 'font-black' : 'font-semibold'}`}>
                      {c.name}
                    </span>
                    <span className="text-[10px] text-[#94A3B8] ml-auto font-mono flex-shrink-0">
                      {c.attributes?.iso3 ?? ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: edit form */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                <div className="w-24 h-24 rounded-[24px] bg-white/60 shadow-inner flex items-center justify-center">
                  <Icon icon="mingcute:chart-bar-fill" width={48} className="text-[#06B6D4]" />
                </div>
                <p className="text-base text-[#082F49] font-bold">Chọn một quốc gia để xem &amp; chỉnh sửa</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-white/80 shadow-sm mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                  <p className="text-xs font-black text-[#082F49] uppercase tracking-wider">
                    Đang sửa: {selected.name}
                  </p>
                </div>

                {/* Thông tin cơ bản */}
                <div>
                  <p className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-widest mb-3">Thông tin cơ bản</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Tên quốc gia" value={selected.name} readonly />
                    <Field label="Mã ISO3" value={selected.attributes?.iso3 ?? '—'} readonly />
                    <Field label="Khu vực" value={selected.attributes?.region ?? '—'} readonly />
                    <Field label="Thủ đô" value={form.capitalCity} onChange={v => setField('capitalCity', v)} />
                  </div>
                </div>

                {/* Mức thu nhập */}
                <div>
                  <p className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-widest mb-3">Mức thu nhập (World Bank)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {INCOME_OPTIONS.map(opt => (
                      <button
                        key={opt.code}
                        onClick={() => handleIncomeChange(opt.code)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all ${
                          form.incomeLevelCode === opt.code
                            ? 'border-[#06B6D4] bg-white shadow-[0_4px_12px_rgba(6,182,212,0.15)]'
                            : 'border-white/60 bg-white/40 hover:bg-white/70'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: opt.color }} />
                        <span className="text-xs font-bold text-[#082F49]">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chỉ số Kinh tế */}
                <div>
                  <p className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-widest mb-3">Chỉ số Kinh tế</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="GDP/đầu người (USD)"  value={form.gdpPerCapita}  onChange={v => setField('gdpPerCapita', v)}  type="number" />
                    <Field label="Tổng GDP (tỷ USD)"    value={form.gdpTotal}       onChange={v => setField('gdpTotal', v)}       type="number" />
                    <Field label="Dân số (người)"        value={form.population}     onChange={v => setField('population', v)}     type="number" />
                    <Field label="Thất nghiệp (%)"       value={form.unemployment}   onChange={v => setField('unemployment', v)}   type="number" />
                    <Field label="Tuổi thọ TB (năm)"     value={form.lifeExpectancy} onChange={v => setField('lifeExpectancy', v)} type="number" />
                    <Field label="Tọa độ (Lat, Lng)"     value={`${selected.lat}, ${selected.lng}`} readonly />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2 pb-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3.5 rounded-[16px] text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #06B6D4, #0284c7)', boxShadow: '0 10px 20px rgba(6,182,212,0.3)' }}
                  >
                    <Icon icon="mingcute:save-fill" width={16} />
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-6 py-3.5 rounded-[16px] text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 10px 20px rgba(239,68,68,0.3)' }}
                  >
                    <Icon icon="mingcute:delete-fill" width={16} />
                    {deleting ? '...' : 'Xoá'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
}
