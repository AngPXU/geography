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

type SceneMode = '3d' | '2d' | 'columbus';

interface Props {
  className?: string;
}

export default function CesiumOceanView({ className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const initRef      = useRef(false);
  const [sceneMode, setSceneMode] = useState<SceneMode>('2d');
  const [ready, setReady]         = useState(false);
  const [bathyReady, setBathyReady] = useState(false);

  const initViewer = useCallback(async () => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    (window as any).CESIUM_BASE_URL = '/cesium';
    loadStyle('/cesium/Widgets/widgets.css');
    await loadScript('/cesium/Cesium.js');

    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // ── 1. Terrain: Độ sâu toàn cầu (World Bathymetry từ Cesium ion) ───────────
    let terrain: any;
    try {
      const bathyProvider = await Cesium.createWorldBathymetryAsync({
        requestVertexNormals: true, // bật đường đồng mức & shading
      });
      terrain = new Cesium.Terrain(bathyProvider);
      setBathyReady(true);
    } catch (e) {
      // Fallback nếu ion không khả dụng
      console.warn('[CesiumOceanView] World Bathymetry unavailable, using Ellipsoid');
      terrain = undefined;
    }

    const viewer = new Cesium.Viewer(containerRef.current, {
      ...(terrain ? { terrain } : { terrainProvider: new Cesium.EllipsoidTerrainProvider() }),
      sceneMode: Cesium.SceneMode.SCENE2D,
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
      requestRenderMode: false, // tắt requestRenderMode để terrain bathymetry render liên tục
    });

    // ── 2. Imagery: Esri World Ocean Base ────────────────────────────────────────
    try {
      viewer.imageryLayers.removeAll(false);
      viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
          credit: '© Esri, GEBCO, NOAA, National Geographic',
          maximumLevel: 13,
        })
      );
    } catch (e) {
      console.warn('[CesiumOceanView] Esri Ocean imagery failed');
    }

    // ── 3. Cài đặt render ────────────────────────────────────────────────────────
    viewer.scene.globe.maximumScreenSpaceError = 2;
    // Bật đường đồng mức độ sâu (depth contours) qua Globe shader
    viewer.scene.globe.showGroundAtmosphere = true;
    viewer.scene.fog.enabled = true;
    viewer.scene.skyAtmosphere.show = true;

    if (viewer.cesiumWidget?.creditContainer) {
      (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
    }

    // Nhìn toàn cầu ở chế độ 2D
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(10, 20, 25_000_000),
    });

    viewerRef.current = viewer;
    setReady(true);
  }, []);

  useEffect(() => {
    initViewer();
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        initRef.current = false;
      }
    };
  }, []);

  // ── Chuyển cảnh ─────────────────────────────────────────────────────────────
  const switchScene = (mode: SceneMode) => {
    if (!viewerRef.current || !ready) return;
    setSceneMode(mode);
    switch (mode) {
      case '3d':       viewerRef.current.scene.morphTo3D(1.5); break;
      case '2d':       viewerRef.current.scene.morphTo2D(1.5); break;
      case 'columbus': viewerRef.current.scene.morphToColumbusView(1.5); break;
    }
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
                ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-md'
                : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="text-base">{icon}</span>
          </button>
        ))}
      </div>

      {/* ── Legend (bottom-left) ── */}
      <div className="absolute bottom-6 left-4 z-[999] bg-white/80 backdrop-blur-xl border border-white/60 rounded-[18px] shadow-lg px-4 py-3 flex flex-col gap-1.5 max-w-[220px]">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Độ sâu đại dương</p>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{
          background: 'linear-gradient(to right, #08306b, #2171b5, #6baed6, #c6dbef, #f7fbff)',
        }} />
        <div className="flex justify-between text-[9px] font-bold text-slate-500">
          <span>−10.000m</span>
          <span>0m</span>
        </div>
        {bathyReady && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
            <span className="text-[9px] font-bold text-blue-600">Độ sâu toàn cầu (Cesium ion)</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
          <span className="text-[9px] font-bold text-teal-600">Esri World Ocean Base</span>
        </div>
      </div>

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1f3c]/92 z-[998]">
          <span className="text-5xl mb-4 animate-[spin_3s_linear_infinite]">🌊</span>
          <p className="text-lg font-black text-white">Đang tải Bản đồ Đại dương...</p>
          <p className="text-sm text-slate-300 mt-2">Đang kết nối dữ liệu độ sâu Cesium ion</p>
        </div>
      )}
    </div>
  );
}
