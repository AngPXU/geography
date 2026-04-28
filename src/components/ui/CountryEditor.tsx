'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CountryData } from './EarthGlobe';

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const EMPTY: Omit<CountryData, '_id'> = {
  name: '', capital: '', population: '', description: '',
  color: '#06B6D4', lat: 0, lng: 0, images: [],
  flag: '', area: '', language: '', currency: '', continent: '', funFact: '',
};

// ── Single field row ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, textarea = false }: {
  label: string; value: string | number; onChange: (v: string) => void; textarea?: boolean;
}) {
  const base = "w-full text-[#082F49] text-sm font-medium bg-white/70 border border-white/80 rounded-2xl px-4 py-3 focus:outline-none focus:bg-white focus:border-[#06B6D4]/50 focus:ring-4 focus:ring-[#06B6D4]/10 transition-all placeholder-[#94A3B8] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-extrabold text-[#334155] uppercase tracking-wider pl-1">{label}</label>
      {textarea ? (
        <textarea className={`${base} resize-none`} rows={3} value={value as string} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={base} value={value as string} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

export function CountryEditor({ onClose, onSaved }: Props) {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [selected, setSelected] = useState<CountryData | null>(null);
  const [form, setForm] = useState<Omit<CountryData, '_id'>>(EMPTY);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetch('/api/countries')
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []));
  }, []);

  const selectCountry = (c: CountryData) => {
    setIsNew(false);
    setSelected(c);
    setForm({
      name: c.name, capital: c.capital, population: c.population,
      description: c.description, color: c.color, lat: c.lat, lng: c.lng,
      images: [...(c.images ?? [])],
      flag: c.flag ?? '', area: c.area ?? '', language: c.language ?? '',
      currency: c.currency ?? '', continent: c.continent ?? '', funFact: c.funFact ?? '',
    });
    setNewImageUrl('');
  };

  const newCountry = () => {
    setIsNew(true);
    setSelected(null);
    setForm({ ...EMPTY, images: [] });
    setNewImageUrl('');
  };

  const setField = (key: keyof typeof form, val: string | number | string[]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const addImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setField('images', [...(form.images ?? []), url]);
    setNewImageUrl('');
  };

  const removeImage = (idx: number) =>
    setField('images', form.images.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const res = await fetch('/api/countries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) { alert('Lỗi khi tạo quốc gia'); return; }
        const data = await res.json();
        const created = data.country;
        setCountries((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'vi')));
        setSelected(created);
        setIsNew(false);
      } else if (selected) {
        const res = await fetch(`/api/countries/${selected._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) { alert('Lỗi khi lưu'); return; }
        const data = await res.json();
        setCountries((prev) => prev.map((c) => (c._id === selected._id ? data.country : c)));
        setSelected(data.country);
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected || !confirm(`Xoá ${selected.name}?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/countries/${selected._id}`, { method: 'DELETE' });
      setCountries((prev) => prev.filter((c) => c._id !== selected._id));
      setSelected(null);
      setForm({ ...EMPTY, images: [] });
      onSaved();
    } finally {
      setDeleting(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      onClick={onClose}
    >
      {/* Liquid background for modal */}
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
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-[32px] border-2 border-white/50 pointer-events-none z-20"></div>

        {/* Modal header */}
        <div className="relative z-30 flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-white/60 bg-white/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#06B6D4] to-blue-500 flex items-center justify-center text-white shadow-md">
              <span className="text-lg">🗺️</span>
            </div>
            <div>
              <p className="font-black text-[#082F49] text-xl leading-none">Quản lý Quốc gia</p>
              <p className="text-[#06B6D4] font-bold text-xs uppercase tracking-widest mt-1">{countries.length} quốc gia đang có</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/80 text-slate-500 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center text-sm font-bold shadow-sm border border-white transition-all"
          >✕</button>
        </div>

        {/* Body */}
        <div className="relative z-30 flex flex-1 overflow-hidden">

          {/* Left: Country list */}
          <div className="w-64 flex-shrink-0 border-r border-white/60 bg-white/20 flex flex-col p-4 gap-3">
            <button
              onClick={newCountry}
              className="w-full py-3 rounded-[16px] text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 10px 20px rgba(34,197,94,0.3)' }}
            >
              <span className="text-lg leading-none">+</span> Thêm quốc gia
            </button>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {countries.map((c) => (
                <button
                  key={c._id}
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-left transition-all duration-300 border ${
                    selected?._id === c._id
                      ? 'text-[#082F49] bg-white border-white shadow-[0_4px_15px_rgba(14,165,233,0.1)]'
                      : 'text-[#334155] border-transparent hover:bg-white/60'
                  }`}
                >
                  <span className="text-2xl drop-shadow-sm flex-shrink-0">{c.flag ?? '🌍'}</span>
                  <span className={`text-sm truncate ${selected?._id === c._id ? 'font-black' : 'font-semibold'}`}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Edit form */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            {!(selected || isNew) ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                <div className="w-24 h-24 rounded-[24px] bg-white/60 shadow-inner flex items-center justify-center text-6xl">🌍</div>
                <p className="text-base text-[#082F49] font-bold">Chọn một quốc gia để chỉnh sửa</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-white/80 shadow-sm mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></span>
                  <p className="text-xs font-black text-[#082F49] uppercase tracking-wider">
                    {isNew ? 'Thêm mới quốc gia' : `Đang sửa: ${selected?.name}`}
                  </p>
                </div>

                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tên quốc gia" value={form.name} onChange={(v) => setField('name', v)} />
                  <Field label="Cờ (emoji)" value={form.flag ?? ''} onChange={(v) => setField('flag', v)} />
                  <Field label="Thủ đô" value={form.capital} onChange={(v) => setField('capital', v)} />
                  <Field label="Dân số" value={form.population} onChange={(v) => setField('population', v)} />
                  <Field label="Diện tích" value={form.area ?? ''} onChange={(v) => setField('area', v)} />
                  <Field label="Châu lục" value={form.continent ?? ''} onChange={(v) => setField('continent', v)} />
                  <Field label="Ngôn ngữ" value={form.language ?? ''} onChange={(v) => setField('language', v)} />
                  <Field label="Tiền tệ" value={form.currency ?? ''} onChange={(v) => setField('currency', v)} />
                </div>

                {/* Coordinates + Color */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-[24px] bg-white/40 border border-white/80">
                  <Field label="Vĩ độ (lat)" value={form.lat} onChange={(v) => setField('lat', parseFloat(v) || 0)} />
                  <Field label="Kinh độ (lng)" value={form.lng} onChange={(v) => setField('lng', parseFloat(v) || 0)} />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-extrabold text-[#334155] uppercase tracking-wider pl-1">Màu điểm</label>
                    <div className="flex items-center gap-3 bg-white/70 px-2 py-1.5 rounded-2xl border border-white/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setField('color', e.target.value)}
                        className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent p-0 overflow-hidden"
                      />
                      <span className="text-sm font-bold text-[#082F49] uppercase">{form.color}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Field label="Mô tả" value={form.description} onChange={(v) => setField('description', v)} textarea />

                {/* Fun fact */}
                <Field label="Sự thật thú vị (Fun Fact)" value={form.funFact ?? ''} onChange={(v) => setField('funFact', v)} textarea />

                {/* Images */}
                <div className="space-y-3 p-5 rounded-[24px] bg-white/40 border border-white/80">
                  <label className="text-[11px] font-extrabold text-[#334155] uppercase tracking-wider pl-1 block">Ảnh minh hoạ (URL)</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-[#082F49] text-sm font-medium bg-white/70 border border-white/80 rounded-2xl px-4 py-3 focus:outline-none focus:bg-white focus:border-[#06B6D4]/50 focus:ring-4 focus:ring-[#06B6D4]/10 transition-all placeholder-[#94A3B8] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                      placeholder="Dán link ảnh vào đây..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addImage()}
                    />
                    <button
                      onClick={addImage}
                      className="px-6 py-3 rounded-2xl bg-white text-[#06B6D4] text-sm font-black shadow-sm hover:shadow-md hover:-translate-y-0.5 border border-white transition-all"
                    >
                      + Thêm
                    </button>
                  </div>

                  {form.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {form.images.map((url, i) => (
                        <div key={i} className="relative group rounded-2xl overflow-hidden aspect-video border-2 border-white shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`img-${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button
                               onClick={() => removeImage(i)}
                               className="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                             >✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-4 pt-6 pb-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-4 rounded-full text-base font-black text-white transition-all hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0"
                    style={{ background: 'linear-gradient(135deg, #06B6D4, #0369A1)', boxShadow: '0 10px 25px rgba(6,182,212,0.4)' }}
                  >
                    {saving ? 'Đang xử lý...' : '💾 Lưu Quốc Gia'}
                  </button>
                  {!isNew && selected && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-8 py-4 rounded-full text-base font-black text-red-600 bg-white border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm disabled:opacity-60"
                    >
                      {deleting ? '...' : '🗑️ Xoá'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
