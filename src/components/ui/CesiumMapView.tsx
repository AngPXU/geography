'use client';

import { Icon } from '@iconify/react';
import React, { useEffect, useRef, useCallback, useState } from 'react';

// ─── Load Cesium from pre-built script (avoids webpack SyntaxError) ────────────
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

// ─── Màu chấm theo châu lục ────────────────────────────────────────────────────
const REGION_COLOR: Record<string, string> = {
  'Asia': '#06B6D4',
  'Europe': '#8B5CF6',
  'Americas': '#F97316',
  'Africa': '#F59E0B',
  'Oceania': '#10B981',
  'Antarctic': '#94A3B8',
};
const DEFAULT_COLOR = '#64748B';

interface Country {
  cca2: string;
  cca3?: string;
  nameCommon: string;
  nameOfficial: string;
  capital: string;
  capitalLat: number;
  capitalLng: number;
  centerLat: number;
  centerLng: number;
  flag: string;
  flagPng?: string;
  tld?: string[];
  callingCodes?: string[];
  region: string;
  subregion: string;
  population: number;
  area: number;
  languages?: string;
  currencies?: string;
  unMember?: boolean;
  images?: string[];
}

interface InfoPanel {
  country: Country;
  x: number;
  y: number;
}

type SceneMode = '3d' | '2d' | 'columbus';

interface CesiumMapViewProps {
  initialScene?: SceneMode;
  className?: string;
}

export default function CesiumMapView({ initialScene = '3d', className = '' }: CesiumMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const initRef = useRef(false);
  const [sceneMode, setSceneMode] = useState<SceneMode>(initialScene);
  const [ready, setReady] = useState(false);
  const [infoPanel, setInfoPanel] = useState<InfoPanel | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);

  // ── Fetch countries ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/map/countries')
      .then(r => r.json())
      .then(d => { if (d.seeded && d.countries) setCountries(d.countries); })
      .catch(() => { });
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
      '3d': Cesium.SceneMode.SCENE3D,
      '2d': Cesium.SceneMode.SCENE2D,
      'columbus': Cesium.SceneMode.COLUMBUS_VIEW,
    };

    const viewer = new Cesium.Viewer(containerRef.current, {
      // EllipsoidTerrainProvider: không stream terrain 3D, nhẹ hơn rất nhiều
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
      sceneMode: SCENE_MAP[mode],
      animation: false,
      timeline: false,
      fullscreenButton: false,
      baseLayerPicker: false,        // tắt picker tích hợp — giảm lag
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
      homeButton: false,
      sceneModePicker: false,
      geocoder: false,
      // Chỉ render khi có thay đổi (thay vì 60fps liên tục)
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
    });

    // Áp dụng Google Maps Satellite làm imagery mặc định
    try {
      const models = Cesium.createDefaultImageryProviderViewModels();
      const gmSat = models.find((m: any) => m.name === 'Google Maps Satellite');
      if (gmSat) {
        const providerOrPromise = gmSat.creationCommand();
        const provider = await Promise.resolve(providerOrPromise);
        viewer.imageryLayers.removeAll(false);
        viewer.imageryLayers.addImageryProvider(provider);
      }
    } catch (e) {
      console.warn('[CesiumMapView] Could not apply Google Maps Satellite, using default');
    }

    // Giữ độ phân giải tile ở mức sắc nét (default = 2)
    viewer.scene.globe.maximumScreenSpaceError = 2;
    // Giới hạn tile đồng thời — giảm băng thông
    viewer.scene.globe.tileCacheSize = 50;
    // Tắt atmosphere và fog khi ở chế độ 2D để nhẹ hơn
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.fog.enabled = false;
    viewer.scene.skyAtmosphere.show = false;

    // Ẩn credit bar
    if (viewer.cesiumWidget?.creditContainer) {
      (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
    }

    // Vị trí ban đầu
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
  }, []); // init 1 lần

  // ── Thêm markers khi countries + viewer sẵn sàng ────────────────────────────
  useEffect(() => {
    if (!ready || !viewerRef.current || countries.length === 0) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    const viewer = viewerRef.current;

    // Dùng PointPrimitiveCollection thay vì viewer.entities
    // Batch render tất cả ~190 điểm trong 1 GPU draw call duy nhất
    const pointCollection = new Cesium.PointPrimitiveCollection();

    countries.forEach(c => {
      const lat = c.capitalLat || c.centerLat;
      const lng = c.capitalLng || c.centerLng;
      // Bỏ qua tọa độ không hợp lệ
      if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

      const hex = REGION_COLOR[c.region] || DEFAULT_COLOR;
      const color = Cesium.Color.fromCssColorString(hex);

      pointCollection.add({
        position: Cesium.Cartesian3.fromDegrees(lng, lat, 10000),
        pixelSize: 8,
        color: color.withAlpha(0.9),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1.5,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        id: c, // lưu country data, lấy lại khi click
      });
    });

    viewer.scene.primitives.add(pointCollection);
    // Request 1 frame để render points sau khi thêm
    viewer.scene.requestRender();

    // ── Click handler dùng PointPrimitive API ────────────────────────────────
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const picked = viewer.scene.pick(click.position);
      if (
        Cesium.defined(picked) &&
        picked.primitive instanceof Cesium.PointPrimitive &&
        picked.id
      ) {
        const data: Country = picked.id;
        const rect = containerRef.current?.getBoundingClientRect();
        setInfoPanel({
          country: data,
          x: click.position.x + (rect?.left ?? 0),
          y: click.position.y + (rect?.top ?? 0),
        });
      } else {
        setInfoPanel(null);
      }
      viewer.scene.requestRender();
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return () => { try { handler.destroy(); } catch (_) { } };
  }, [ready, countries]);

  // ── Chuyển cảnh ─────────────────────────────────────────────────────────────
  const switchScene = (mode: SceneMode) => {
    if (!viewerRef.current || !ready) return;
    setSceneMode(mode);
    setInfoPanel(null);
    switch (mode) {
      case '3d': viewerRef.current.scene.morphTo3D(1.5); break;
      case '2d': viewerRef.current.scene.morphTo2D(1.5); break;
      case 'columbus': viewerRef.current.scene.morphToColumbusView(1.5); break;
    }
    // Kích hoạt render sau khi đổi cảnh
    setTimeout(() => viewerRef.current?.scene.requestRender(), 100);
  };

  // ── Helpers hiển thị ─────────────────────────────────────────────────────────
  const fmt = (n?: number | null) =>
    n ? n.toLocaleString('vi-VN') : '—';

  const parseLangs = (raw?: string) => {
    if (!raw) return '—';
    try { return Object.values(JSON.parse(raw)).join(', '); } catch { return raw; }
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Cesium container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* ── Nút chuyển chế độ (top-left) ── */}
      <div className="absolute top-4 left-4 z-[999] flex gap-1 p-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[18px] shadow-lg">
        {([
          ['3d', <Icon key="3d" icon="material-symbols:3d-rounded" width={30} />],
          ['2d', <Icon key="2d" icon="material-symbols:2d-rounded" width={30} />],
          ['columbus', <Icon key="col" icon="material-symbols:map-sharp" width={30} />],
        ] as [SceneMode, React.ReactNode][]).map(([id, icon]) => (
          <button
            key={id}
            onClick={() => switchScene(id)}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-[12px] text-[10px] font-bold transition-all ${sceneMode === id
              ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md'
              : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-600'
              }`}
          >
            <span className="text-base">{icon}</span>
          </button>
        ))}
      </div>

      {/* ── Legend (top-right) ── */}
      <div className="absolute top-4 right-4 z-[999] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[18px] shadow-lg px-3 py-2 flex flex-col gap-1">
        {Object.entries(REGION_COLOR).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
            <span style={{ background: color }} className="w-2.5 h-2.5 rounded-full inline-block" />
            {region}
          </div>
        ))}
      </div>

      {/* ── Info Panel (popup khi click marker) ── */}
      {infoPanel && (() => {
        const c = infoPanel.country;
        const cx = infoPanel.x - (containerRef.current?.getBoundingClientRect().left ?? 0);
        const cy = infoPanel.y - (containerRef.current?.getBoundingClientRect().top ?? 0);
        const panelW = 420;
        const cw = containerRef.current?.clientWidth ?? 800;
        const ch = containerRef.current?.clientHeight ?? 600;
        const actualW = Math.min(panelW, cw - 16);
        const left = Math.max(8, Math.min(cx + 14, cw - actualW - 8));

        const parsedCurrencies: string[] = (() => {
          try {
            const obj = typeof c.currencies === 'string' ? JSON.parse(c.currencies) : c.currencies;
            return Object.entries(obj ?? {}).map(([code, val]: [string, any]) =>
              `${val?.name ?? code}${val?.symbol ? ' (' + val.symbol + ')' : ''}`
            );
          } catch { return []; }
        })();

        const parsedLangs: string[] = (() => {
          try {
            const obj = typeof c.languages === 'string' ? JSON.parse(c.languages) : c.languages;
            return Object.values(obj ?? {}) as string[];
          } catch { return []; }
        })();

        const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
          <div className="flex flex-col gap-0.5">
            <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-[#94A3B8]">{icon} {label}</p>
            <p className="text-[11px] font-bold text-[#082F49] leading-snug">{value}</p>
          </div>
        );

        const regionColor = REGION_COLOR[c.region] || DEFAULT_COLOR;

        return (
          <div
            className="absolute z-[1000] overflow-hidden overflow-y-auto"
            style={{
              width: actualW,
              maxHeight: ch - 16,
              left,
              top: Math.max(4, Math.min(cy - 20, ch - 500)),
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
                      {c.flagPng ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.flagPng} alt={`Cờ ${c.nameCommon}`} className="w-14 h-9 rounded-[8px] object-cover flex-shrink-0 shadow-sm border border-white/80" />
                      ) : (
                        <span className="text-3xl leading-none flex-shrink-0">{c.flag}</span>
                      )}
                      <div className="min-w-0">
                        <p className="font-black text-[#082F49] text-base leading-tight">{c.nameCommon}</p>
                        {c.nameOfficial && c.nameOfficial !== c.nameCommon && (
                          <p className="text-[10px] text-[#94A3B8] font-medium leading-tight mt-0.5">{c.nameOfficial}</p>
                        )}
                      </div>
                    </div>
                    {/* Badge row */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white border border-slate-200 text-slate-500 shadow-sm">{c.cca2}</span>
                      {c.cca3 && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-white border border-slate-200 text-slate-500 shadow-sm">{c.cca3}</span>
                      )}
                      {c.tld && c.tld.length > 0 && c.tld.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] shadow-sm">🌐 {t}</span>
                      ))}
                      {c.callingCodes && c.callingCodes.length > 0 && c.callingCodes.map((code, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] shadow-sm">📞 {code}</span>
                      ))}
                      {c.unMember && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] shadow-sm">🇺🇳 LHQ</span>
                      )}
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm border"
                        style={{ background: regionColor + '18', borderColor: regionColor + '40', color: regionColor }}
                      >{c.region}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setInfoPanel(null)}
                    className="w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                  >✕</button>
                </div>
              </div>
            </div>

            {/* 2 columns */}
            <div className="grid grid-cols-2 gap-x-4 px-4 pb-4 pt-3">
              {/* Cột trái: Địa lý & Hành chính */}
              <div className="space-y-2.5">
                <p className="flex items-center gap-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest pb-1 border-b border-slate-100"><Icon icon="mingcute:map-line" width={14} /> Địa lý & Hành chính</p>
                {c.capital && <Row icon={<Icon icon="mingcute:city-line" width={12} />} label="Thủ đô" value={c.capital} />}
                {c.subregion && <Row icon={<Icon icon="mingcute:location-line" width={12} />} label="Tiểu vùng" value={c.subregion} />}
                {c.area > 0 && <Row icon={<Icon icon="mingcute:ruler-line" width={12} />} label="Diện tích" value={`${Number(c.area).toLocaleString('vi-VN')} km²`} />}
                {parsedCurrencies.length > 0 && (
                  <Row icon={<Icon icon="mingcute:exchange-dollar-line" width={12} />} label="Tiền tệ" value={parsedCurrencies.join(' · ')} />
                )}
              </div>

              {/* Cột phải: Dân số & Ngôn ngữ */}
              <div className="space-y-2.5">
                <p className="flex items-center gap-1 text-[9px] font-black text-[#94A3B8] uppercase tracking-widest pb-1 border-b border-slate-100"><Icon icon="mingcute:group-2-line" width={14} /> Dân số & Văn hóa</p>
                {c.population > 0 && (
                  <Row icon={<Icon icon="mingcute:group-2-line" width={12} />} label="Dân số" value={
                    c.population >= 1_000_000
                      ? `${(c.population / 1_000_000).toFixed(1)} triệu`
                      : Number(c.population).toLocaleString('vi-VN')
                  } />
                )}
                {parsedLangs.length > 0 && (
                  <Row icon={<Icon icon="mingcute:translate-2-line" width={12} />} label="Ngôn ngữ" value={parsedLangs.join(', ')} />
                )}
              </div>
            </div>

            {/* Tên chính thức — full width footer */}
            {c.nameOfficial && c.nameOfficial !== c.nameCommon && (
              <div className="mx-4 mb-3 px-3 py-2 rounded-[12px] bg-slate-50 border border-slate-100">
                <p className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest text-[#94A3B8]"><Icon icon="mingcute:tag-line" width={12} /> Tên chính thức</p>
                <p className="text-[11px] font-bold text-[#334155] mt-0.5">{c.nameOfficial}</p>
              </div>
            )}

            {/* Gallery ảnh quốc gia */}
            {Array.isArray(c.images) && c.images.filter(Boolean).length > 0 && (
              <div className="px-4 pb-4">
                <p className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest mb-2">🖼️ Hình ảnh</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {c.images.filter(Boolean).map((url: string, i: number) => (
                    <div key={i} className="flex-shrink-0 w-32 h-20 rounded-[14px] overflow-hidden border border-slate-100 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${c.nameCommon} ${i + 1}`} className="w-full h-full object-cover" />
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#082F49]/90 backdrop-blur-sm z-50">
          <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]"><Icon icon="gis:map-book" width={80} color="#fff" /></span>
          <p className="text-xl font-black text-white">Đang khởi tạo Bản đồ Cesium...</p>
          <p className="text-sm text-slate-300 mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      )}

      <style>{`
        .cesium-viewer-bottom { display: none !important; }
        .cesium-widget-credits { display: none !important; }
      `}</style>
    </div>
  );
}
