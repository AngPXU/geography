'use client';

import React, { useRef, useEffect, useState } from 'react';

type MapMode = 'political' | 'physical' | 'climate' | 'ocean' | 'economic' | 'vietnam';

// ── MapLibre GL JS v4 — Miễn phí, không cần token ────────────────────────────
const MAPLIBRE_JS  = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const MAPLIBRE_CSS = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css';

// ── Styles hoàn toàn miễn phí ─────────────────────────────────────────────────
// OpenFreeMap: không cần key, tốc độ cao, cập nhật từ OSM hàng ngày
// CartoDB: miễn phí cho mọi dự án
const MAP_STYLES: Record<MapMode, string> = {
  political: 'https://tiles.openfreemap.org/styles/liberty',
  physical:  'https://tiles.openfreemap.org/styles/bright',
  climate:   'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  ocean:     'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  economic:  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  vietnam:   'https://tiles.openfreemap.org/styles/liberty',
};

const MODE_LABELS: Record<MapMode, string> = {
  political: 'OpenFreeMap Liberty',
  physical:  'OpenFreeMap Bright · 3D',
  climate:   'CartoDB Voyager',
  ocean:     'CartoDB Dark Matter',
  economic:  'CartoDB Positron',
  vietnam:   'OpenFreeMap Liberty · VN',
};

const MODE_PITCH: Record<MapMode, number> = {
  political: 12,
  physical:  62,
  climate:   28,
  ocean:     45,
  economic:  12,
  vietnam:   62,
};

const MODE_VIEW: Record<MapMode, { lng: number; lat: number; zoom: number }> = {
  political: { lng: 10,    lat: 20,   zoom: 2 },
  physical:  { lng: 15,    lat: 35,   zoom: 2 },
  climate:   { lng: 20,    lat: 20,   zoom: 2 },
  ocean:     { lng: 0,     lat: 5,    zoom: 2 },
  economic:  { lng: 60,    lat: 20,   zoom: 2 },
  vietnam:   { lng: 107.6, lat: 16.1, zoom: 6 },
};

// Terrain 3D dùng AWS Elevation Tiles — hoàn toàn MIỄN PHÍ (Open Data)
const TERRAIN_EXAG: Partial<Record<MapMode, number>> = {
  physical: 2.0,
  vietnam:  1.5,
};

declare global {
  interface Window { maplibregl: any }
}

interface Props { mode: MapMode }

export default function MapboxView3D({ mode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const modeRef      = useRef<MapMode>(mode);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  // ── Thiết lập terrain 3D bằng AWS Open Elevation Data ────────────────────
  const setupTerrain = (map: any, m: MapMode) => {
    try {
      // Thêm nguồn DEM nếu chưa có
      if (!map.getSource('terrain-dem')) {
        map.addSource('terrain-dem', {
          type:     'raster-dem',
          // AWS Terrain Tiles — Open Data, 100% miễn phí, toàn cầu
          tiles:    ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
          encoding: 'terrarium',  // định dạng của AWS terrain tiles
          tileSize: 256,
          maxzoom:  14,
        });
      }
      const exag = TERRAIN_EXAG[m];
      if (exag) {
        map.setTerrain({ source: 'terrain-dem', exaggeration: exag });
      } else {
        map.setTerrain(null);
      }
    } catch { /* source có thể đã tồn tại */}
  };

  // ── Bootstrap: inject MapLibre từ CDN, khởi tạo map ─────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    let cancelled = false;

    const initMap = () => {
      if (cancelled || !containerRef.current || !window.maplibregl) return;
      const mgl = window.maplibregl;
      // ✅ Không cần accessToken — MapLibre là mã nguồn mở hoàn toàn miễn phí

      const v = MODE_VIEW[modeRef.current];
      const map = new mgl.Map({
        container:          containerRef.current,
        style:              MAP_STYLES[modeRef.current],
        center:             [v.lng, v.lat],
        zoom:               v.zoom,
        pitch:              MODE_PITCH[modeRef.current],
        bearing:            0,
        attributionControl: false,
        maxPitch:           85,
      });

      // Điều hướng và thước tỉ lệ
      map.addControl(new mgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
      map.addControl(new mgl.ScaleControl({ unit: 'metric' }), 'bottom-left');
      map.addControl(new mgl.AttributionControl({ compact: true }), 'bottom-left');

      map.on('load', () => {
        if (cancelled) { map.remove(); return; }
        setupTerrain(map, modeRef.current);
        mapRef.current = map;
        setStatus('ready');
      });
    };

    // 1. Inject CSS
    if (!document.querySelector('[data-mlibre-css]')) {
      const link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = MAPLIBRE_CSS;
      link.setAttribute('data-mlibre-css', '1');
      document.head.appendChild(link);
    }

    // 2. Inject JS script
    if (window.maplibregl) {
      initMap();
    } else if (!document.querySelector('[data-mlibre-js]')) {
      const script = document.createElement('script');
      script.src = MAPLIBRE_JS;
      script.setAttribute('data-mlibre-js', '1');
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      // Script đang load — polling chờ
      const iv = setInterval(() => {
        if (window.maplibregl) { clearInterval(iv); initMap(); }
      }, 100);
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Khi mode thay đổi: fly to + đổi style + terrain ─────────────────────
  useEffect(() => {
    modeRef.current = mode;
    const map = mapRef.current;
    if (!map) return;

    const v = MODE_VIEW[mode];
    map.flyTo({
      center:   [v.lng, v.lat],
      zoom:     v.zoom,
      pitch:    MODE_PITCH[mode],
      bearing:  0,
      duration: 1600,
      essential: true,
    });

    // Đổi style — terrain source phải được thêm lại sau khi style load xong
    map.setStyle(MAP_STYLES[mode]);
    map.once('style.load', () => setupTerrain(map, mode));
  }, [mode]);

  // ── Cleanup khi unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Map container cho MapLibre */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sky-50 to-emerald-50">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <span className="absolute inset-0 rounded-full animate-ping bg-cyan-200 opacity-75" />
              <span className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-2xl">
                🌍
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-[#082F49]">Đang tải bản đồ 3D...</p>
              <p className="text-[10px] text-slate-400 mt-1">MapLibre GL · Miễn phí · Nguồn mở</p>
            </div>
          </div>
        </div>
      )}

      {/* Badge thông tin khi ready */}
      {status === 'ready' && (
        <>
          {/* Badge mode + nguồn */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              3D · {MODE_LABELS[mode]}
            </div>
            {TERRAIN_EXAG[mode] && (
              <div className="bg-emerald-500/80 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-full">
                ⛰️ Địa hình nổi
              </div>
            )}
          </div>

          {/* Hướng dẫn tương tác */}
          {(mode === 'physical' || mode === 'vietnam') && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 bg-black/40 backdrop-blur-sm text-white text-[10px] px-4 py-2 rounded-full pointer-events-none whitespace-nowrap flex items-center gap-2">
              <span>🖱️</span>
              <span>Ctrl + Kéo để nghiêng · Scroll để zoom · Kéo để xoay</span>
            </div>
          )}

          {/* Badge "Miễn phí" */}
          <div className="absolute bottom-3 left-3 z-10 bg-emerald-500/20 backdrop-blur-md text-emerald-700 text-[9px] font-black px-2.5 py-1 rounded-full border border-emerald-200 pointer-events-none">
            ✅ MapLibre · Nguồn mở · Miễn phí hoàn toàn
          </div>
        </>
      )}
    </div>
  );
}
