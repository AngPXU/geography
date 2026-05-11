'use client';

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
  incomeLevel?: string;
  incomeLevelCode?: string;
  gdpPerCapita?: number | null;
  gdpTotal?: number | null;
  population?: number | null;
  unemployment?: number | null;
  lifeExpectancy?: number | null;
  region?: string;
  capitalCity?: string;
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
      if (!f.lat || !f.lng || f.lat < -90 || f.lat > 90 || f.lng < -180 || f.lng > 180) return;
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
          ['3d',       '🌍', 'Quả cầu 3D'],
          ['2d',       '🗺️', 'Phẳng 2D'],
          ['columbus', '🧭', 'Columbus'],
        ] as [SceneMode, string, string][]).map(([id, icon, label]) => (
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
            {label}
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
        return (
          <div
            className="absolute z-[1000] w-72 bg-white/95 backdrop-blur-2xl border border-white rounded-[24px] shadow-[0_20px_40px_rgba(8,47,73,0.15)] overflow-hidden"
            style={{
              left: Math.min(infoPanel.x - (containerRef.current?.getBoundingClientRect().left ?? 0) + 12, (containerRef.current?.clientWidth ?? 800) - 300),
              top:  Math.min(infoPanel.y - (containerRef.current?.getBoundingClientRect().top ?? 0) - 20, (containerRef.current?.clientHeight ?? 600) - 400),
            }}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-white">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-3xl">{e.emoji || '🌐'}</span>
                  <p className="font-black text-[#082F49] text-base leading-tight mt-1">{e.name}</p>
                  {e.capitalCity && (
                    <p className="text-[10px] text-slate-400 font-medium">🏛️ {e.capitalCity}</p>
                  )}
                </div>
                <button
                  onClick={() => setInfoPanel(null)}
                  className="w-6 h-6 rounded-full bg-white/80 text-slate-400 hover:bg-rose-100 hover:text-rose-500 transition-colors text-xs flex items-center justify-center flex-shrink-0"
                >✕</button>
              </div>
            </div>

            {/* Body — giống InteractiveMap economic panel */}
            <div className="p-4 space-y-1.5">
              {e.incomeLevel && (
                <div className="flex items-center gap-2 rounded-[10px] px-3 py-1.5"
                  style={{ backgroundColor: incColor + '18' }}>
                  <span className="text-sm">📊</span>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: incColor }}>Mức phát triển</p>
                    <p className="text-xs font-bold text-[#082F49]">{e.incomeLevel}</p>
                  </div>
                </div>
              )}
              {e.gdpPerCapita != null && (
                <div className="flex items-center gap-2 bg-emerald-50 rounded-[10px] px-3 py-1.5">
                  <span className="text-sm">💵</span>
                  <div>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">GDP / Đầu người</p>
                    <p className="text-xs font-bold text-[#082F49]">{e.gdpPerCapita.toLocaleString('vi-VN')} USD</p>
                  </div>
                </div>
              )}
              {e.gdpTotal != null && (
                <div className="flex items-center gap-2 bg-green-50 rounded-[10px] px-3 py-1.5">
                  <span className="text-sm">🏦</span>
                  <div>
                    <p className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Tổng GDP</p>
                    <p className="text-xs font-bold text-[#082F49]">{e.gdpTotal.toLocaleString('vi-VN')} tỷ USD</p>
                  </div>
                </div>
              )}
              {e.population != null && (
                <div className="flex items-center gap-2 bg-violet-50 rounded-[10px] px-3 py-1.5">
                  <span className="text-sm">👥</span>
                  <div>
                    <p className="text-[9px] font-bold text-violet-500 uppercase tracking-wider">Dân số</p>
                    <p className="text-xs font-bold text-[#082F49]">{e.population.toLocaleString('vi-VN')} người</p>
                  </div>
                </div>
              )}
              {e.unemployment != null && (
                <div className="flex items-center gap-2 bg-orange-50 rounded-[10px] px-3 py-1.5">
                  <span className="text-sm">📉</span>
                  <div>
                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-wider">Tỷ lệ thất nghiệp</p>
                    <p className="text-xs font-bold text-[#082F49]">{e.unemployment}%</p>
                  </div>
                </div>
              )}
              {e.lifeExpectancy != null && (
                <div className="flex items-center gap-2 bg-rose-50 rounded-[10px] px-3 py-1.5">
                  <span className="text-sm">❤️</span>
                  <div>
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Tuổi thọ trung bình</p>
                    <p className="text-xs font-bold text-[#082F49]">{e.lifeExpectancy} tuổi</p>
                  </div>
                </div>
              )}
            </div>
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
