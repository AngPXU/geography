'use client';

import { Icon } from '@iconify/react';
import React, { useEffect, useRef, useCallback, useState } from 'react';

// ─── Load Cesium script (tránh webpack bundle) ─────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).__cesiumScriptLoaded) { resolve(); return; }
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if ((window as any).Cesium) { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed: ${src}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = () => { (window as any).__cesiumScriptLoaded = true; resolve(); };
    s.onerror = () => reject(new Error(`Failed: ${src}`));
    document.head.appendChild(s);
  });
}
function loadStyle(href: string) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }
}

// ─── Màu marker theo mức thu nhập World Bank (giống InteractiveMap) ────────────
const INCOME_COLOR: Record<string, string> = {
  HIC: '#16a34a', // Xanh lá — Phát triển cao
  UMC: '#0284c7', // Xanh dương — Thu nhập trên TB
  LMC: '#d97706', // Vàng hổ phách — Đang phát triển
  LIC: '#dc2626', // Đỏ — Kém phát triển
  INX: '#94a3b8', // Xám — Không phân loại
};
const INCOME_LEGEND = [
  { code: 'HIC', label: 'Phát triển cao (HIC)' },
  { code: 'UMC', label: 'Thu nhập trên TB (UMC)' },
  { code: 'LMC', label: 'Đang phát triển (LMC)' },
  { code: 'LIC', label: 'Kém phát triển (LIC)' },
  { code: 'INX', label: 'Không phân loại' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface EconomyFeature {
  id: string;
  name: string;
  lat: number;
  lng: number;
  subCategory?: string;
  // identity
  iso2?: string;
  iso3?: string;
  nameOfficial?: string;
  tld?: string[];
  callingCodes?: string[];
  unMember?: boolean;
  flagImage?: string;
  images?: string[];
  // geography
  capitalCity?: string;
  region?: string;
  subregion?: string;
  area?: number | null;
  currencies?: string[];
  // economy
  incomeLevel?: string;
  incomeLevelCode?: string;
  gdpPerCapita?: number | null;
  gdpTotal?: number | null;
  population?: number | null;
  unemployment?: number | null;
  lifeExpectancy?: number | null;
  emoji?: string;
}

interface InfoPanel {
  item: EconomyFeature;
  x: number;
  y: number;
}

type SceneMode = '3d' | '2d' | 'columbus';

interface Props {
  className?: string;
}

export default function CesiumEconomicView({ className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const initRef      = useRef(false);
  const [sceneMode, setSceneMode] = useState<SceneMode>('2d');
  const [ready, setReady]         = useState(false);
  const [infoPanel, setInfoPanel] = useState<InfoPanel | null>(null);
  const [features, setFeatures]   = useState<EconomyFeature[]>([]);

  // ── Fetch economic features từ World Bank (giống InteractiveMap) ─────────────
  useEffect(() => {
    fetch('/api/map/features?category=economic')
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data)) {
          // Flatten attributes ra top-level, giống InteractiveMap: { ...item, ...item.attributes }
          const mapped: EconomyFeature[] = data.map(item => ({ ...item, ...item.attributes }));
          setFeatures(mapped.filter(f => f.subCategory === 'country_economy'));
        }
      })
      .catch(() => {});
  }, []);

  // ── Init Viewer ─────────────────────────────────────────────────────────────
  const initViewer = useCallback(async (mode: SceneMode) => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    (window as any).CESIUM_BASE_URL = '/cesium';
    loadStyle('/cesium/Widgets/widgets.css');
    await loadScript('/cesium/Cesium.js');

    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    const SCENE_MAP: Record<SceneMode, any> = {
      '3d':       Cesium.SceneMode.SCENE3D,
      '2d':       Cesium.SceneMode.SCENE2D,
      'columbus': Cesium.SceneMode.COLUMBUS_VIEW,
    };

    const viewer = new Cesium.Viewer(containerRef.current, {
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      sceneMode: SCENE_MAP[mode],
      animation: false,
      timeline: false,
      fullscreenButton: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      homeButton: false,
      sceneModePicker: false,
      geocoder: false,
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
    });

    // Áp dụng Google Maps Contour
    try {
      const models = Cesium.createDefaultImageryProviderViewModels();
      const target = models.find((m: any) => m.name === 'Google Maps Contour');
      if (target) {
        const provider = await Promise.resolve(target.creationCommand());
        viewer.imageryLayers.removeAll(false);
        viewer.imageryLayers.addImageryProvider(provider);
      }
    } catch (e) {
      console.warn('[CesiumEconomicView] Google Maps Contour not available, using default');
    }

    viewer.scene.globe.maximumScreenSpaceError = 2;
    viewer.scene.globe.tileCacheSize = 50;
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.skyAtmosphere.show = false;

    if (viewer.cesiumWidget?.creditContainer) {
      (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
    }

    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(10, 20, 25_000_000),
    });

    viewerRef.current = viewer;
    setReady(true);
  }, []);

  useEffect(() => {
    initViewer(sceneMode);
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  // ── Thêm markers khi features + viewer sẵn sàng ─────────────────────────────
  useEffect(() => {
    if (!ready || !viewerRef.current || features.length === 0) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    const viewer = viewerRef.current;

    const pointCollection = new Cesium.PointPrimitiveCollection();

    features.forEach(f => {
      if (f.lat == null || f.lng == null || f.lat < -90 || f.lat > 90 || f.lng < -180 || f.lng > 180) return;
      const hex = INCOME_COLOR[f.incomeLevelCode || 'INX'] || '#94a3b8';
      const color = Cesium.Color.fromCssColorString(hex);
      pointCollection.add({
        position: Cesium.Cartesian3.fromDegrees(f.lng, f.lat, 10000),
        pixelSize: 9,
        color: color.withAlpha(0.88),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        id: f,
      });
    });

    viewer.scene.primitives.add(pointCollection);
    viewer.scene.requestRender();

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (
        Cesium.defined(picked) &&
        picked.primitive instanceof Cesium.PointPrimitive &&
        picked.id
      ) {
        const rect = containerRef.current?.getBoundingClientRect();
        setInfoPanel({
          item: picked.id as EconomyFeature,
          x: click.position.x + (rect?.left ?? 0),
          y: click.position.y + (rect?.top ?? 0),
        });
      } else {
        setInfoPanel(null);
      }
      viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => { try { handler.destroy(); } catch (_) {} };
  }, [ready, features]);

  // ── Chuyển cảnh ─────────────────────────────────────────────────────────────
  const switchScene = (mode: SceneMode) => {
    if (!viewerRef.current || !ready) return;
    setSceneMode(mode);
    setInfoPanel(null);
    switch (mode) {
      case '3d':       viewerRef.current.scene.morphTo3D(1.5); break;
      case '2d':       viewerRef.current.scene.morphTo2D(1.5); break;
      case 'columbus': viewerRef.current.scene.morphToColumbusView(1.5); break;
    }
    setTimeout(() => viewerRef.current?.scene.requestRender(), 100);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Cesium container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* ── Nút chuyển chế độ (top-left) ── */}
      <div className="absolute top-4 left-4 z-[999] flex gap-1 p-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[18px] shadow-lg">
        {([
          ['3d',       <Icon key="3d" icon="material-symbols:3d-rounded" width={30} />],
          ['2d',       <Icon key="2d" icon="material-symbols:2d-rounded" width={30} />],
          ['columbus', <Icon key="col" icon="material-symbols:map-sharp" width={30} />],
        ] as [SceneMode, React.ReactNode][]).map(([id, icon]) => (
          <button
            key={id}
            onClick={() => switchScene(id)}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-[12px] text-[10px] font-bold transition-all ${
              sceneMode === id
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
                : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
            }`}
          >
            <span className="text-base">{icon}</span>
          </button>
        ))}
      </div>

      {/* ── Legend: Mức thu nhập World Bank (top-right) ── */}
      <div className="absolute top-4 right-4 z-[999] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[18px] shadow-lg px-3 py-2.5 flex flex-col gap-1.5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mức phát triển</p>
        {INCOME_LEGEND.map(t => (
          <div key={t.code} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
            <span style={{ background: INCOME_COLOR[t.code] }} className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" />
            {t.label}
          </div>
        ))}
      </div>

      {/* ── Info Panel ── */}
      {infoPanel && (() => {
        const e = infoPanel.item;
        const incColor = INCOME_COLOR[e.incomeLevelCode || 'INX'] || '#94a3b8';
        const cx = infoPanel.x - (containerRef.current?.getBoundingClientRect().left ?? 0);
        const cy = infoPanel.y - (containerRef.current?.getBoundingClientRect().top ?? 0);
        const panelW = 480;
        const panelH = 620;
        const cw = containerRef.current?.clientWidth ?? 800;
        const ch = containerRef.current?.clientHeight ?? 600;
        const actualW = Math.min(panelW, cw - 16);
        const left = Math.max(8, Math.min(cx + 14, cw - actualW - 8));

        const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
          <div className="flex flex-col gap-0.5">
            <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-[#94A3B8]">{icon} {label}</p>
            <p className="text-[11px] font-bold text-[#082F49] leading-snug">{value}</p>
          </div>
        );

        return (
          <div
            className="absolute z-[1000] overflow-hidden overflow-y-auto"
            style={{
              width: actualW,
              maxHeight: ch - 16,
              left,
              top:  Math.max(4, Math.min(cy - 20, ch - panelH - 8)),
              background: 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 1)',
              boxShadow: '0 20px 50px rgba(14, 165, 233, 0.18), inset 0 1px 0 rgba(255,255,255,1)',
              borderRadius: 24,
            }}
          >
            {/* Header */}
            <div className="border-b border-white/70" style={{ background: 'rgba(255,255,255,0.6)' }}>
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      {e.flagImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={e.flagImage} alt={`Cờ ${e.name}`} className="w-14 h-9 rounded-[8px] object-cover flex-shrink-0 shadow-sm border border-white/80" />
                      ) : (
                        <span className="text-2xl leading-none flex-shrink-0">{e.emoji || '\uD83C\uDF10'}</span>
                      )}
                      <div className="min-w-0">
                        <p className="font-black text-[#082F49] text-base leading-tight">{e.name}</p>
                        {e.nameOfficial && e.nameOfficial !== e.name && (
                          <p className="text-[10px] text-[#94A3B8] font-medium leading-tight mt-0.5 truncate">{e.nameOfficial}</p>
                        )}
                      </div>
                    </div>
                    {/* Badge row */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {e.iso2 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white border border-slate-200 text-slate-500 shadow-sm">{e.iso2}</span>
                      )}
                      {e.iso3 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white border border-slate-200 text-slate-500 shadow-sm">{e.iso3}</span>
                      )}
                      {e.tld && e.tld.length > 0 && e.tld.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] shadow-sm">🌐 {t}</span>
                      ))}
                      {e.callingCodes && e.callingCodes.length > 0 && e.callingCodes.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] shadow-sm">📞 {c}</span>
                      ))}
                      {e.unMember === true && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] shadow-sm">🇺🇳 LHQ</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setInfoPanel(null)}
                    className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                  >✕</button>
                </div>
              </div>
            </div>

            {/* Mức phát triển — full width banner */}
            {e.incomeLevel && (
              <div className="mx-4 mt-3 flex items-center gap-2.5 rounded-[12px] px-3 py-2" style={{ background: incColor + '18', border: `1px solid ${incColor}30` }}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: incColor }} />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: incColor }}>Mức phát triển kinh tế</p>
                  <p className="text-[11px] font-black text-[#082F49]">{e.incomeLevel}</p>
                </div>
              </div>
            )}

            {/* 2 columns */}
            <div className="grid grid-cols-2 gap-x-4 px-4 pb-4 mt-3">

              {/* Cột trái: Địa lý & Hành chính */}
              <div className="space-y-2.5">
                <p className="flex items-center gap-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest pb-1 border-b border-slate-100"><Icon icon="mingcute:map-line" width={14} /> Địa lý & Hành chính</p>
                {e.capitalCity && <Row icon={<Icon icon="mingcute:city-line" width={12} />} label="Thủ đô" value={e.capitalCity} />}
                {e.region      && <Row icon={<Icon icon="mingcute:earth-line" width={12} />} label="Khu vực" value={e.region} />}
                {e.subregion && e.subregion !== e.region && <Row icon={<Icon icon="mingcute:location-line" width={12} />} label="Tiểu vùng" value={e.subregion} />}
                {e.area != null && <Row icon={<Icon icon="mingcute:ruler-line" width={12} />} label="Diện tích" value={`${Number(e.area).toLocaleString('vi-VN')} km²`} />}
                {e.currencies && e.currencies.length > 0 && (
                  <Row icon={<Icon icon="mingcute:exchange-dollar-line" width={12} />} label="Tiền tệ" value={e.currencies.join(' · ')} />
                )}
              </div>

              {/* Cột phải: Kinh tế */}
              <div className="space-y-2.5">
                <p className="flex items-center gap-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest pb-1 border-b border-slate-100"><Icon icon="mingcute:bank-line" width={14} /> Kinh tế</p>
                {e.gdpPerCapita  != null && <Row icon={<Icon icon="mingcute:currency-dollar-line" width={12} />} label="GDP / Đầu người"  value={`${Number(e.gdpPerCapita).toLocaleString('vi-VN')} USD`} />}
                {e.gdpTotal      != null && <Row icon={<Icon icon="mingcute:bank-card-line" width={12} />} label="Tổng GDP"         value={`${Number(e.gdpTotal).toLocaleString('vi-VN')} tỷ USD`} />}
                {e.population    != null && <Row icon={<Icon icon="mingcute:group-2-line" width={12} />} label="Dân số"           value={e.population >= 1_000_000 ? `${(e.population / 1_000_000).toFixed(1)} triệu` : Number(e.population).toLocaleString('vi-VN')} />}
                {e.unemployment  != null && <Row icon={<Icon icon="mingcute:trending-down-line" width={12} />} label="Thất nghiệp"      value={`${e.unemployment}%`} />}
                {e.lifeExpectancy != null && <Row icon={<Icon icon="mingcute:heart-line" width={12} />} label="Tuổi thọ TB"     value={`${e.lifeExpectancy} tuổi`} />}
              </div>
            </div>

            {/* Gallery ảnh quốc gia */}
            {Array.isArray(e.images) && e.images.filter(Boolean).length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">🖼️ Hình ảnh</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {e.images.filter(Boolean).map((url: string, i: number) => (
                    <div key={i} className="flex-shrink-0 w-32 h-20 rounded-[14px] overflow-hidden border border-slate-100 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${e.name} ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#082F49]/90 z-[998]">
          <span className="text-5xl mb-4 animate-[spin_3s_linear_infinite]">🏭</span>
          <p className="text-lg font-black text-white">Đang tải Bản đồ Kinh tế...</p>
          <p className="text-sm text-slate-300 mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      )}
    </div>
  );
}
