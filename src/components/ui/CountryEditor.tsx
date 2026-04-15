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
  const base = "w-full text-sm text-[#082F49] font-medium bg-white/60 border border-white/80 rounded-2xl px-3 py-2 focus:outline-none focus:border-[#06B6D4]/60 transition-all placeholder-[#94A3B8]";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">{label}</label>
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(8,47,73,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[85vh] rounded-3xl flex flex-col overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,1)',
          boxShadow: '0 30px 80px rgba(14,165,233,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0 rounded-t-3xl"
          style={{ background: 'linear-gradient(135deg, #06B6D4ee, #0369A1cc)' }}
        >
          <div>
            <p className="font-extrabold text-white text-base">✏️ Quản lý Quốc gia</p>
            <p className="text-white/70 text-[11px]">{countries.length} quốc gia đang có</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/40 flex items-center justify-center text-sm font-bold transition-all"
          >✕</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Country list */}
          <div className="w-52 flex-shrink-0 border-r border-white/50 flex flex-col">
            <button
              onClick={newCountry}
              className="mx-3 my-2 py-2 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}
            >
              + Thêm quốc gia mới
            </button>
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
              {countries.map((c) => (
                <button
                  key={c._id}
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-left transition-all duration-200 ${
                    selected?._id === c._id
                      ? 'text-white shadow-md'
                      : 'text-[#334155] hover:bg-white/60'
                  }`}
                  style={selected?._id === c._id
                    ? { background: `linear-gradient(135deg, ${c.color}dd, ${c.color}99)` }
                    : {}
                  }
                >
                  <span className="text-base flex-shrink-0">{c.flag ?? '🌍'}</span>
                  <span className="text-xs font-semibold truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Edit form */}
          <div className="flex-1 overflow-y-auto p-5">
            {!(selected || isNew) ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 opacity-40">
                <span className="text-5xl">🌍</span>
                <p className="text-sm text-[#94A3B8] font-semibold">Chọn một quốc gia để chỉnh sửa</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-extrabold text-[#082F49] mb-1">
                  {isNew ? '🆕 Thêm quốc gia mới' : `Chỉnh sửa: ${selected?.name}`}
                </p>

                {/* Basic info */}
                <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Vĩ độ (lat)" value={form.lat} onChange={(v) => setField('lat', parseFloat(v) || 0)} />
                  <Field label="Kinh độ (lng)" value={form.lng} onChange={(v) => setField('lng', parseFloat(v) || 0)} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide">Màu điểm</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.color}
                        onChange={(e) => setField('color', e.target.value)}
                        className="w-10 h-10 rounded-xl border border-white/80 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-[#334155]">{form.color}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Field label="Mô tả" value={form.description} onChange={(v) => setField('description', v)} textarea />

                {/* Fun fact */}
                <Field label="Sự thật thú vị (Fun Fact)" value={form.funFact ?? ''} onChange={(v) => setField('funFact', v)} textarea />

                {/* Images */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide block">Ảnh minh hoạ (URL)</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 text-sm text-[#082F49] font-medium bg-white/60 border border-white/80 rounded-2xl px-3 py-2 focus:outline-none focus:border-[#06B6D4]/60 transition-all placeholder-[#94A3B8]"
                      placeholder="https://..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addImage()}
                    />
                    <button
                      onClick={addImage}
                      className="px-4 py-2 rounded-2xl bg-[#E0F2FE] text-[#06B6D4] text-xs font-bold border border-[#BAE6FD] hover:bg-[#BAE6FD] transition-all"
                    >
                      + Thêm
                    </button>
                  </div>

                  {form.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {form.images.map((url, i) => (
                        <div key={i} className="relative group rounded-2xl overflow-hidden aspect-video">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #06B6D4, #0369A1)', boxShadow: '0 6px 20px rgba(6,182,212,0.35)' }}
                  >
                    {saving ? 'Đang lưu...' : '💾 Lưu'}
                  </button>
                  {!isNew && selected && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-5 py-2.5 rounded-2xl text-sm font-bold text-[#DC2626] border border-red-200 bg-red-50 hover:bg-red-100 transition-all disabled:opacity-60"
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
