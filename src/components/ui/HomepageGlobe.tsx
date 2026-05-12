'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Icon } from '@iconify/react';

// ─── Script / Style loaders ───────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CountryData {
  _id: string;
  name: string;
  capital: string;
  population: string;
  description: string;
  color: string;
  lat: number;
  lng: number;
  images: string[];
  flag?: string;
  area?: string;
  language?: string;
  currency?: string;
  continent?: string;
  funFact?: string;
}

// ─── ImageSlideshow ───────────────────────────────────────────────────────────
function ImageSlideshow({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;

  const prev = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i === 0 ? images.length - 1 : i - 1)); };
  const next = (e: React.MouseEvent) => { e.stopPropagation(); setIdx(i => (i === images.length - 1 ? 0 : i + 1)); };

  return (
    <div className="relative w-full h-36 rounded-2xl overflow-hidden group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[idx]} alt={`slide-${idx}`} className="w-full h-full object-cover transition-all duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      {images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm text-[#082F49] font-bold flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 text-base leading-none">‹</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm text-[#082F49] font-bold flex items-center justify-center hover:bg-white transition-all opacity-0 group-hover:opacity-100 text-base leading-none">›</button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── StatCell ─────────────────────────────────────────────────────────────────
function StatCell({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl p-2.5 flex items-start gap-2" style={{ background: 'rgba(248,250,252,0.8)' }}>
      <span className="text-sm mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-[#94A3B8] font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-[11px] font-bold text-[#082F49] leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── CountryInfoPanel ─────────────────────────────────────────────────────────
function CountryInfoPanel({ country, onClose }: { country: CountryData; onClose: () => void }) {
  return (
    <div
      className="fixed z-50 inset-x-3 bottom-3 md:inset-auto md:right-5 md:top-1/2 md:-translate-y-1/2 md:w-80 max-h-[85vh] overflow-y-auto rounded-3xl cursor-auto"
      style={{
        background: 'rgba(255,255,255,0.90)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,1)',
        boxShadow: '0 20px 60px rgba(14,165,233,0.20)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        className="relative h-14 rounded-t-3xl flex items-center px-5 gap-3 flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${country.color}ee, ${country.color}99)` }}
      >
        <span className="text-3xl drop-shadow">{country.flag ?? '🌍'}</span>
        <div>
          <p className="font-extrabold text-white text-base leading-tight drop-shadow">{country.name}</p>
          {country.continent && <p className="text-white/80 text-[10px] font-semibold">{country.continent}</p>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/25 text-white hover:bg-white/40 flex items-center justify-center transition-all font-bold text-xs"
        >✕</button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <ImageSlideshow images={country.images} />

        <div className="grid grid-cols-2 gap-2">
          <StatCell label="Thủ đô" value={country.capital} icon="🏛️" />
          <StatCell label="Dân số" value={country.population} icon="👥" />
          {country.area && <StatCell label="Diện tích" value={country.area} icon="📐" />}
          {country.language && <StatCell label="Ngôn ngữ" value={country.language} icon="🗣️" />}
          {country.currency && <StatCell label="Tiền tệ" value={country.currency} icon="💰" />}
        </div>

        <div className="rounded-2xl p-3" style={{ background: 'rgba(224,242,254,0.6)', border: '1px solid rgba(186,230,253,0.5)' }}>
          <p className="text-[#334155] text-xs leading-relaxed">{country.description}</p>
        </div>

        {country.funFact && (
          <div className="rounded-2xl p-3 flex gap-2" style={{ background: 'rgba(220,252,231,0.6)', border: '1px solid rgba(187,247,208,0.5)' }}>
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-[#166534] text-xs leading-relaxed font-medium">{country.funFact}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function HomepageGlobe() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const viewerRef     = useRef<any>(null);
  const initRef       = useRef(false);
  const rafRef        = useRef<number>(0);
  const autoRotateRef = useRef(true);

  const [ready,      setReady]      = useState(false);
  const [initError,  setInitError]  = useState(false);
  const [countries,  setCountries]  = useState<CountryData[]>([]);
  const [selected,   setSelected]   = useState<CountryData | null>(null);

  // ── Fetch country markers ─────────────────────────────────────────────────
  const fetchCountries = useCallback(async () => {
    try {
      const res = await fetch('/api/countries');
      if (!res.ok) return;
      const data = await res.json();
      setCountries(data.countries ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);

  // ── Init Cesium Viewer ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    const init = async () => {
      try {
        (window as any).CESIUM_BASE_URL = '/cesium';
        loadStyle('/cesium/Widgets/widgets.css');
        await loadScript('/cesium/Cesium.js');

        if (cancelled || !containerRef.current) return;

        const Cesium = (window as any).Cesium;
        if (!Cesium) throw new Error('Cesium global not found');

        const viewer = new Cesium.Viewer(containerRef.current, {
          terrainProvider:      new Cesium.EllipsoidTerrainProvider(),
          animation:            false,
          timeline:             false,
          fullscreenButton:     false,
          baseLayerPicker:      false,
          navigationHelpButton: false,
          infoBox:              false,
          selectionIndicator:   false,
          homeButton:           false,
          sceneModePicker:      false,
          geocoder:             false,
          requestRenderMode:    false, // continuous render for auto-rotation
        });

        // Hide credit watermark
        if (viewer.cesiumWidget?.creditContainer) {
          (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
        }

        viewerRef.current = viewer;

        // ── Switch to Google Maps Satellite imagery ──────────────────────────
        try {
          const models = Cesium.createDefaultImageryProviderViewModels();
          const gmSat = models.find((m: any) => m.name === 'Blue Marble');
          if (gmSat) {
            const providerOrPromise = gmSat.creationCommand();
            const provider = await Promise.resolve(providerOrPromise);
            viewer.imageryLayers.removeAll(false);
            viewer.imageryLayers.addImageryProvider(provider);
          }
        } catch {
          // fallback to default Bing imagery
        }

        // ── Scene settings ─────────────────────────────────────────
        // Light background that blends with the glass card
        viewer.scene.backgroundColor            = new Cesium.Color(0.96, 0.98, 1.0, 1.0);
        viewer.scene.skyBox.show                = false;
        viewer.scene.sun.show                   = false;
        viewer.scene.moon.show                  = false;
        viewer.scene.skyAtmosphere.show         = true;
        viewer.scene.globe.enableLighting       = false;
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.globe.maximumScreenSpaceError = 2;
        viewer.scene.fog.enabled                = false;

        // ── Limit camera controls ────────────────────────────────────────────
        viewer.scene.screenSpaceCameraController.enableZoom  = false;
        viewer.scene.screenSpaceCameraController.enableTilt  = false;
        viewer.scene.screenSpaceCameraController.enableLook  = false;

        // ── Initial camera — Asia-Pacific view ───────────────────────────────
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(105, 15, 7_000_000),
        });

        // ── Auto-rotation ────────────────────────────────────────────────────
        const rotate = () => {
          if (cancelled || !viewerRef.current || viewerRef.current.isDestroyed()) return;
          if (autoRotateRef.current) {
            viewerRef.current.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.0003);
          }
          rafRef.current = requestAnimationFrame(rotate);
        };
        rafRef.current = requestAnimationFrame(rotate);

        // ── Click handler ────────────────────────────────────────────────────
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((click: any) => {
          const picked = viewer.scene.pick(click.position);
          if (
            Cesium.defined(picked) &&
            picked.primitive instanceof Cesium.PointPrimitive &&
            picked.id
          ) {
            const country: CountryData = picked.id;
            autoRotateRef.current = false;
            setSelected(country);
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(country.lng, country.lat, 8_000_000),
              duration: 1.2,
            });
          } else {
            setSelected(null);
            autoRotateRef.current = true;
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        if (!cancelled) setReady(true);
      } catch (err) {
        console.error('[HomepageGlobe] init error:', err);
        initRef.current = false;
        if (!cancelled) setInitError(true);
      }
    };

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
      initRef.current = false; // always reset — fixes React Strict Mode double-invoke
    };
  }, []);

  // ── Add country markers once ready ────────────────────────────────────────
  useEffect(() => {
    if (!ready || !viewerRef.current || countries.length === 0) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    const pointCollection = new Cesium.PointPrimitiveCollection();
    countries.forEach(c => {
      if (!c.lat || !c.lng) return;
      const color = Cesium.Color.fromCssColorString(c.color || '#06B6D4');
      pointCollection.add({
        position: Cesium.Cartesian3.fromDegrees(c.lng, c.lat, 10_000),
        pixelSize:    10,
        color:        color.withAlpha(0.9),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        id: c,
      });
    });
    viewerRef.current.scene.primitives.add(pointCollection);
  }, [ready, countries]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* absolute inset-0 ensures Cesium always gets a valid non-zero px size */}
      <div className="absolute inset-0 pointer-events-auto cursor-grab active:cursor-grabbing overflow-hidden rounded-[24px]">

        {/* Badges overlay */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-slate-700 shadow-sm"
            style={{
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,1)',
            }}
          >
            <span className="text-sm"><Icon icon="mingcute:aspect-ratio-fill" width={16} /></span> Có thể tương tác trực tiếp
          </div>

        </div>

        {/* Loading spinner */}
        {!ready && !initError && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error fallback */}
        {initError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3 bg-[#082F49]/5">
            <span className="text-5xl"><Icon icon="mingcute:earth-3-line" width={50} /></span>
            <p className="text-[#334155] text-sm font-semibold text-center px-6">Không thể tải bản đồ 3D.<br/>Vui lòng tải lại trang.</p>
          </div>
        )}

        {/* Cesium mounts here — absolute inset-0 gives it definite dimensions */}
        <div ref={containerRef} className="absolute inset-0" />

        <style>{`
          /* Light background matching the glass card */
          .cesium-widget,
          .cesium-viewer,
          .cesium-viewer-cesiumWidgetContainer,
          .cesium-widget canvas {
            background: linear-gradient(135deg, #e0f2fe, #f0fdf4) !important;
            border-radius: 24px;
          }
          .cesium-viewer-toolbar,
          .cesium-viewer-animationContainer,
          .cesium-viewer-timelineContainer,
          .cesium-viewer-bottom,
          .cesium-credit-lightbox-overlay,
          .cesium-widget-credits { display: none !important; }
        `}</style>
      </div>

      {selected && (
        <CountryInfoPanel
          country={selected}
          onClose={() => { setSelected(null); autoRotateRef.current = true; }}
        />
      )}

    </>
  );
}
