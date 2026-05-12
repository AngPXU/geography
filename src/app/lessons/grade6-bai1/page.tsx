'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamic map import (tránh SSR)
const Map = dynamic(() => import('react-map-gl/maplibre').then(m => m.Map), { ssr: false });
const Marker = dynamic(() => import('react-map-gl/maplibre').then(m => m.Marker), { ssr: false });
const NavigationControl = dynamic(() => import('react-map-gl/maplibre').then(m => m.NavigationControl), { ssr: false });


import 'maplibre-gl/dist/maplibre-gl.css';
import { Navbar } from '@/layouts/Navbar';

// ── Định nghĩa các chương bài giảng ──────────────────────────────────────────
type Chapter = {
  id: string;
  title: string;
  content: string[];
  didYouKnow?: string;
  example?: string;
  isObjective?: boolean;
  isPractice?: boolean;
  // "globe" = hiển thị Quả Địa Cầu 3D | "map" = hiển thị MapLibre
  rightPanel: 'globe' | 'map';
  mapState?: { longitude: number; latitude: number; zoom: number; pitch: number; bearing: number };
  marker?: { lng: number; lat: number; label: string };
};

const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    title: 'Học xong bài này, em sẽ:',
    isObjective: true,
    rightPanel: 'globe',
    content: [
      'Biết được thế nào là: kinh tuyến, vĩ tuyến, kinh tuyến gốc, vĩ tuyến gốc (Xích đạo), các bán cầu, toạ độ địa lí.',
      'Xác định được trên bản đồ và trên quả Địa Cầu: kinh tuyến gốc, Xích đạo, các bán cầu. Ghi được toạ độ địa lí của một địa điểm trên bản đồ.',
    ],
  },
  {
    id: 'section-1',
    title: '1. Hệ thống kinh, vĩ tuyến',
    rightPanel: 'globe',
    content: [
      'Quả Địa Cầu là mô hình thu nhỏ của Trái Đất. Trên quả Địa Cầu, ta có thể thấy hệ thống kinh, vĩ tuyến cùng cực Bắc và cực Nam.',
      'Kinh tuyến là nửa đường tròn nối hai cực trên bề mặt quả Địa Cầu. Vĩ tuyến là vòng tròn bao quanh quả Địa Cầu và vuông góc với các kinh tuyến.',
      'Để đánh số, người ta chọn một kinh tuyến, một vĩ tuyến làm gốc và ghi 0°. Các kinh tuyến và vĩ tuyến khác được xác định dựa vào kinh tuyến gốc và vĩ tuyến gốc.',
    ],
    didYouKnow:
      'Kinh tuyến gốc được quy ước là kinh tuyến đi qua Đài thiên văn Greenwich (Grin-uých) nằm ở ngoại ô thành phố Luân Đôn, thủ đô nước Anh.\n\nKinh tuyến gốc cùng với kinh tuyến 180° chia quả Địa Cầu thành hai bán cầu: bán cầu Đông và bán cầu Tây.\n\nVĩ tuyến gốc là Xích đạo chia quả Địa Cầu thành bán cầu Bắc và bán cầu Nam.\n\nVĩ tuyến 23°27\' được gọi là chí tuyến. Vĩ tuyến 66°33\' được gọi là vòng cực.',
  },
  {
    id: 'section-2',
    title: '2. Kinh độ, vĩ độ và toạ độ địa lí',
    rightPanel: 'map',
    content: [
      'Muốn xác định vị trí của bất cứ địa điểm nào trên quả Địa Cầu hay trên bản đồ, ta phải xác định được kinh độ và vĩ độ của điểm đó.',
      'Kinh độ và vĩ độ của một địa điểm được gọi chung là toạ độ địa lí của điểm đó.',
    ],
    example:
      'Ví dụ: Cột cờ Hà Nội có vĩ độ là 21°01\'57"B, kinh độ là 105°50\'23"Đ. Toạ độ địa lí của Cột cờ Hà Nội được ghi là (21°01\'57"B, 105°50\'23"Đ).',
    didYouKnow:
      'Kinh độ của một điểm là khoảng cách tính bằng độ từ kinh tuyến gốc đến kinh tuyến đi qua điểm đó. Vĩ độ của một điểm là khoảng cách tính bằng độ từ Xích đạo đến vĩ tuyến đi qua điểm đó.',
    mapState: { longitude: 105.8397, latitude: 21.0325, zoom: 17, pitch: 60, bearing: -20 },
    marker: { lng: 105.8397, lat: 21.0325, label: 'Cột cờ Hà Nội' },
  },
  {
    id: 'practice',
    title: 'Luyện tập và Vận dụng',
    isPractice: true,
    rightPanel: 'map',
    content: [
      'Cho biết nếu vẽ các đường kinh tuyến, vĩ tuyến cách nhau 1° thì trên quả Địa Cầu có bao nhiêu kinh tuyến, vĩ tuyến?',
      'Tra cứu thông tin, ghi toạ độ địa lí các điểm cực (Bắc, Nam, Đông, Tây) trên phần đất liền của nước ta.',
    ],
    mapState: { longitude: 105.5, latitude: 15.5, zoom: 4.5, pitch: 20, bearing: 0 },
  },
];

// ── Quả địa cầu Cesium có lưới Kinh/Vĩ tuyến ────────────────────────────────
function GlobePanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const initRef      = useRef(false);
  const rafRef       = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;
    let cancelled = false;

    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
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

    const loadStyle = (href: string) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
        document.head.appendChild(l);
      }
    };

    (async () => {
      try {
        (window as any).CESIUM_BASE_URL = '/cesium';
        loadStyle('/cesium/Widgets/widgets.css');
        await loadScript('/cesium/Cesium.js');
        if (cancelled || !containerRef.current) return;

        const Cesium = (window as any).Cesium;
        const creditDiv = document.createElement('div');
        creditDiv.style.display = 'none';
        document.body.appendChild(creditDiv);

        const viewer = new Cesium.Viewer(containerRef.current, {
          terrainProvider:      new Cesium.EllipsoidTerrainProvider(),
          animation:            false, timeline:    false,
          fullscreenButton:     false, baseLayerPicker: false,
          navigationHelpButton: false, infoBox:     false,
          selectionIndicator:   false, homeButton:  false,
          sceneModePicker:      false, geocoder:    false,
          creditContainer:      creditDiv,
        });
        viewerRef.current = viewer;

        // Dark space background (matches lesson's #050E1A theme)
        viewer.scene.skyBox.show          = false;
        viewer.scene.skyAtmosphere.show   = true;
        viewer.scene.sun.show             = false;
        viewer.scene.moon.show            = false;
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.showGroundAtmosphere = true;
        viewer.scene.fog.enabled          = false;
        viewer.scene.screenSpaceCameraController.enableZoom = false;
        viewer.scene.screenSpaceCameraController.enableTilt = false;

        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(0, 20, 22_000_000),
        });

        // ── Graticule lines ──────────────────────────────────────────────────
        const EQUATOR_COL = Cesium.Color.fromCssColorString('#F59E0B');  // Xích đạo
        const PRIME_COL   = Cesium.Color.fromCssColorString('#22D3EE');  // Kinh tuyến gốc
        const TROPIC_COL  = Cesium.Color.fromCssColorString('#86EFAC');  // Chí tuyến
        const POLAR_COL   = Cesium.Color.fromCssColorString('#93C5FD');  // Vòng cực
        const MINOR_COL   = Cesium.Color.WHITE.withAlpha(0.18);

        const SPECIAL_LATS: Record<number, { color: any; width: number }> = {
          0: { color: EQUATOR_COL, width: 2.5 },
          23: { color: TROPIC_COL, width: 1.8 }, [-23 as any]: { color: TROPIC_COL, width: 1.8 },
          66: { color: POLAR_COL,  width: 1.5 }, [-66 as any]: { color: POLAR_COL,  width: 1.5 },
        };

        const instances: any[] = [];

        // Vĩ tuyến mỗi 30°
        for (const lat of [-90, -66, -23, 0, 23, 66, 90, -60, -30, 30, 60]) {
          const positions: any[] = [];
          for (let lng = -180; lng <= 180; lng += 2) positions.push(Cesium.Cartesian3.fromDegrees(lng, lat));
          const sp = SPECIAL_LATS[lat];
          instances.push(new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
              positions, width: sp ? sp.width : 0.8,
              vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
            }),
            attributes: {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(sp ? sp.color : MINOR_COL),
            },
          }));
        }

        // Kinh tuyến mỗi 30°
        for (let lng = -180; lng < 180; lng += 30) {
          const positions: any[] = [];
          for (let lat = -90; lat <= 90; lat += 2) positions.push(Cesium.Cartesian3.fromDegrees(lng, lat));
          const isPrime = lng === 0;
          instances.push(new Cesium.GeometryInstance({
            geometry: new Cesium.PolylineGeometry({
              positions, width: isPrime ? 2.5 : 0.8,
              vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
            }),
            attributes: {
              color: Cesium.ColorGeometryInstanceAttribute.fromColor(isPrime ? PRIME_COL : MINOR_COL),
            },
          }));
        }

        viewer.scene.primitives.add(new Cesium.Primitive({
          geometryInstances: instances,
          appearance: new Cesium.PolylineColorAppearance(),
          asynchronous: false,
        }));

        // ── Auto-rotation ────────────────────────────────────────────────────
        const rotate = () => {
          if (cancelled || !viewerRef.current || viewerRef.current.isDestroyed()) return;
          viewerRef.current.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.0004);
          rafRef.current = requestAnimationFrame(rotate);
        };
        rafRef.current = requestAnimationFrame(rotate);
      } catch (err) {
        console.error('[GlobePanel] init error:', err);
        initRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy(); viewerRef.current = null; initRef.current = false;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative" style={{ background: '#050E1A' }}>
      <div ref={containerRef} className="w-full h-full" />
      {/* Chú thích màu */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
        {[
          { color: '#F59E0B', label: 'Xích đạo (0°)' },
          { color: '#22D3EE', label: 'Kinh tuyến gốc (0°)' },
          { color: '#86EFAC', label: 'Chí tuyến (23°)' },
          { color: '#93C5FD', label: 'Vòng cực (66°)' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-white/70 text-xs font-semibold">{label}</span>
          </div>
        ))}
      </div>
      <style>{`
        .cesium-viewer-toolbar, .cesium-viewer-animationContainer,
        .cesium-viewer-timelineContainer, .cesium-viewer-bottom,
        .cesium-credit-lightbox-overlay, .cesium-widget-credits {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

// ── MapLibre Panel ─────────────────────────────────────────────────────────────
function MapPanel({
  mapRef,
  initialState,
  markerData,
}: {
  mapRef: React.RefObject<any>;
  initialState: NonNullable<Chapter['mapState']>;
  markerData?: Chapter['marker'];
}) {
  return (
    <Map
      ref={mapRef}
      initialViewState={initialState}
      mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
      style={{ width: '100%', height: '100%' }}
      interactive
    >
      {markerData && (
        <Marker longitude={markerData.lng} latitude={markerData.lat} anchor="bottom">
          <div className="flex flex-col items-center animate-bounce">
            <div className="bg-white text-emerald-700 font-bold px-3 py-1 rounded-full shadow-lg text-xs whitespace-nowrap mb-1 border border-emerald-200">
              {markerData.label}
            </div>
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md" />
          </div>
        </Marker>
      )}
      <NavigationControl position="bottom-right" />
    </Map>
  );
}

// ── Trang chính ────────────────────────────────────────────────────────────────
export default function Grade6Bai1() {
  const mapRef = useRef<any>(null);
  const [activeChapter, setActiveChapter] = useState('intro');
  const activeData = useMemo(() => CHAPTERS.find(c => c.id === activeChapter)!, [activeChapter]);

  // IntersectionObserver – phát hiện chương đang xem
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveChapter(e.target.id); }),
      { threshold: 0.55 }
    );
    CHAPTERS.forEach(c => { const el = document.getElementById(c.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  // Khi chương map thay đổi → flyTo
  useEffect(() => {
    if (activeData.rightPanel === 'map' && activeData.mapState && mapRef.current) {
      const { longitude, latitude, zoom, pitch, bearing } = activeData.mapState;
      mapRef.current.flyTo({ center: [longitude, latitude], zoom, pitch, bearing, duration: 2800, essential: true });
    }
  }, [activeChapter, activeData]);

  const mapInitial = CHAPTERS.find(c => c.rightPanel === 'map')?.mapState ?? { longitude: 105.8, latitude: 21, zoom: 5, pitch: 0, bearing: 0 };

  return (
    <div className="bg-[#f0fdf4] font-sans min-h-screen">
      <Navbar user={undefined} />

      <div className="flex flex-col lg:flex-row w-full mt-[80px]">

        {/* ── RIGHT: Panel Thông Minh (Globe / Map) ── */}
        <div className="w-full lg:w-1/2 h-[50vh] lg:h-[calc(100vh-80px)] sticky top-[80px] order-1 lg:order-2 overflow-hidden relative">

          {/* Globe – hiện khi chương rightPanel = 'globe' */}
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: activeData.rightPanel === 'globe' ? 1 : 0, pointerEvents: activeData.rightPanel === 'globe' ? 'auto' : 'none' }}
          >
            <GlobePanel />
          </div>

          {/* Map – hiện khi chương rightPanel = 'map' */}
          <div
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: activeData.rightPanel === 'map' ? 1 : 0, pointerEvents: activeData.rightPanel === 'map' ? 'auto' : 'none' }}
          >
            <MapPanel mapRef={mapRef} initialState={mapInitial} markerData={activeData.marker} />
          </div>

          {/* Badge hiển thị mode hiện tại */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black"
              style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.9)' }}>
              <span>{activeData.rightPanel === 'globe' ? '🌍 Quả Địa Cầu 3D' : '🗺️ Bản đồ tương tác'}</span>
            </div>
          </div>
        </div>

        {/* ── LEFT: Nội dung Sách cuộn ── */}
        <div
          className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-14 pt-12 order-2 lg:order-1 overflow-y-auto"
          style={{ paddingBottom: '70vh' }}
        >

          {/* Header bài */}
          <div className="mb-14 pb-6 border-b-4 border-emerald-500">
            <div className="flex items-end gap-5 mb-2 flex-wrap">
              <span className="text-7xl md:text-8xl font-black text-emerald-600 italic tracking-tighter leading-none">Bài 1</span>
              <h1 className="text-2xl md:text-3xl font-black text-[#082F49] uppercase tracking-wide pb-1">
                Hệ thống kinh, vĩ tuyến.<br />Toạ độ địa lí
              </h1>
            </div>
            <p className="text-[#94A3B8] text-sm font-semibold">📗 Địa Lý 6 · Kết nối tri thức với cuộc sống</p>
          </div>

          {CHAPTERS.map(ch => {
            const isActive = ch.id === activeChapter;
            return (
              <div
                key={ch.id}
                id={ch.id}
                className="min-h-[60vh] flex flex-col justify-center mb-24 transition-all duration-700"
                style={{ opacity: isActive ? 1 : 0.25, transform: isActive ? 'scale(1)' : 'scale(0.97)', filter: isActive ? 'none' : 'blur(2px)' }}
              >

                {/* Block: Mục tiêu */}
                {ch.isObjective && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-orange-100 shadow-[0_10px_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
                    <div className="absolute -top-5 left-8 bg-amber-500 text-white font-black italic px-6 py-2 rounded-full text-lg shadow-md">
                      {ch.title}
                    </div>
                    <ul className="list-disc list-inside mt-4 space-y-4">
                      {ch.content.map((t, i) => <li key={i} className="text-slate-700 text-lg font-medium leading-relaxed">{t}</li>)}
                    </ul>
                  </div>
                )}

                {/* Block: Luyện tập */}
                {ch.isPractice && (
                  <div className="bg-white p-8 rounded-3xl border-2 border-rose-400 shadow-[0_15px_40px_rgba(225,29,72,0.12)] relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-black px-8 py-3 rounded-full shadow-lg whitespace-nowrap text-lg">
                      📝 Luyện tập và Vận dụng
                    </div>
                    <div className="mt-6 space-y-6">
                      {ch.content.map((t, i) => (
                        <div key={i} className="flex gap-4 items-start">
                          <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 font-black text-lg">{i + 1}</div>
                          <p className="text-slate-700 text-lg font-semibold pt-1">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Block: Nội dung chính */}
                {!ch.isObjective && !ch.isPractice && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-black text-emerald-700 pb-2 border-b-2 border-emerald-200 inline-block">{ch.title}</h2>

                    <div className="space-y-4 text-lg text-slate-700 font-medium leading-relaxed">
                      {ch.content.map((t, i) => <p key={i}>{t}</p>)}
                    </div>

                    {ch.example && (
                      <div className="bg-slate-50 border-l-4 border-slate-400 p-5 rounded-r-2xl text-slate-600 italic font-medium">
                        {ch.example}
                      </div>
                    )}

                    {ch.didYouKnow && (
                      <div className="mt-6 bg-gradient-to-br from-cyan-50 to-blue-50 p-7 rounded-3xl border border-cyan-100 shadow-[0_10px_30px_rgba(6,182,212,0.12)] relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 pointer-events-none">💡</div>
                        <div className="inline-flex items-center gap-2 bg-cyan-500 text-white px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-wider shadow-sm mb-4">
                          💡 Em có biết?
                        </div>
                        <p className="text-slate-700 font-medium whitespace-pre-line text-[1.05rem] leading-relaxed relative z-10">
                          {ch.didYouKnow}
                        </p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
