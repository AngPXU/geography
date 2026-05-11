'use client';

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
  'Asia':      '#06B6D4',
  'Europe':    '#8B5CF6',
  'Americas':  '#F97316',
  'Africa':    '#F59E0B',
  'Oceania':   '#10B981',
  'Antarctic': '#94A3B8',
};
const DEFAULT_COLOR = '#64748B';

interface Country {
  cca2: string;
  nameCommon: string;
  nameOfficial: string;
  capital: string;
  capitalLat: number;
  capitalLng: number;
  centerLat: number;
  centerLng: number;
  flag: string;
  region: string;
  subregion: string;
  population: number;
  area: number;
  languages?: string;
  currencies?: string;
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
  const viewerRef    = useRef<any>(null);
  const initRef      = useRef(false);
  const [sceneMode, setSceneMode]   = useState<SceneMode>(initialScene);
  const [ready, setReady]           = useState(false);
  const [infoPanel, setInfoPanel]   = useState<InfoPanel | null>(null);
  const [countries, setCountries]   = useState<Country[]>([]);

  // ── Fetch countries ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/map/countries')
      .then(r => r.json())
      .then(d => { if (d.seeded && d.countries) setCountries(d.countries); })
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
      if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

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

    return () => { try { handler.destroy(); } catch (_) {} };
  }, [ready, countries]);

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
          ['3d',       '🌍', 'Quả cầu 3D'],
          ['2d',       '🗺️', 'Phẳng 2D'],
          ['columbus', '🧭', 'Columbus'],
        ] as [SceneMode, string, string][]).map(([id, icon, label]) => (
          <button
            key={id}
            onClick={() => switchScene(id)}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-[12px] text-[10px] font-bold transition-all ${
              sceneMode === id
                ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md'
                : 'text-slate-500 hover:bg-cyan-50 hover:text-cyan-600'
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
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
      {infoPanel && (
        <div
          className="absolute z-[1000] w-72 bg-white/95 backdrop-blur-2xl border border-white rounded-[24px] shadow-[0_20px_40px_rgba(8,47,73,0.15)] overflow-hidden"
          style={{
            left: Math.min(infoPanel.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + 12, (containerRef.current?.clientWidth ?? 800) - 300),
            top:  Math.min(infoPanel.y - (containerRef.current?.getBoundingClientRect().top ?? 0) - 20, (containerRef.current?.clientHeight ?? 600) - 320),
          }}
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-cyan-50 to-sky-50 border-b border-white">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-3xl">{infoPanel.country.flag}</span>
                <p className="font-black text-[#082F49] text-base leading-tight mt-1">{infoPanel.country.nameCommon}</p>
                <p className="text-[10px] text-slate-400 font-medium">{infoPanel.country.subregion || infoPanel.country.region}</p>
              </div>
              <button
                onClick={() => setInfoPanel(null)}
                className="w-6 h-6 rounded-full bg-white/80 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors text-xs flex items-center justify-center flex-shrink-0"
              >✕</button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 rounded-[12px] px-3 py-2">
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Thủ đô</p>
                <p className="text-xs font-bold text-[#082F49]">{infoPanel.country.capital || '—'}</p>
              </div>
              <div className="bg-emerald-50 rounded-[12px] px-3 py-2">
                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Châu lục</p>
                <p className="text-xs font-bold text-[#082F49]">{infoPanel.country.region}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-violet-50 rounded-[12px] px-3 py-2">
                <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Dân số</p>
                <p className="text-xs font-bold text-[#082F49]">{fmt(infoPanel.country.population)}</p>
              </div>
              <div className="bg-amber-50 rounded-[12px] px-3 py-2">
                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Diện tích</p>
                <p className="text-xs font-bold text-[#082F49]">{fmt(infoPanel.country.area)} km²</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-[12px] px-3 py-2">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ngôn ngữ</p>
              <p className="text-xs font-medium text-[#334155]">{parseLangs(infoPanel.country.languages)}</p>
            </div>
            <p className="text-[10px] text-slate-400 text-center">Tên chính thức: {infoPanel.country.nameOfficial}</p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#082F49]/90 backdrop-blur-sm z-50">
          <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">🌍</span>
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
