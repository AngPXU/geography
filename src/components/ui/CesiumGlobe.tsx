'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';

// ─── Load Cesium from pre-built static file (NOT bundled via webpack) ─────────
// Loading via script tag avoids "Octal escape sequences" SyntaxError caused
// by Cesium's legacy source code being processed by strict-mode bundlers.
// ─────────────────────────────────────────────────────────────────────────────

export interface CesiumGlobeHandle {
  flyTo: (lat: number, lng: number, altitude?: number, duration?: number) => void;
  setLayer: (layerId: string) => void;
  setGrid: (show: boolean) => void;
  addPin: (lat: number, lng: number, title: string, info?: string, image?: string) => void;
  clearPins: () => void;
}

export interface AnnotationItem {
  lat: number;
  lng: number;
  label: string;
  color?: string; // hex color string, e.g. '#FF4444'
  isSmall?: boolean;
}

interface CesiumGlobeProps {
  initialLat?: number;
  initialLng?: number;
  initialAltitude?: number;
  showGrid?: boolean;
  imageryLayer?: string;
  annotations?: AnnotationItem[];
  onLayerChange?: (layerName: string) => void;
  onPinClick?: (pinData: { title: string, info: string, image?: string }) => void;
  showLayerPicker?: boolean;
  className?: string;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).__cesiumScriptLoaded) { resolve(); return; }
    if (document.querySelector(`script[src="${src}"]`)) {
      // Script tag exists but may still be loading
      const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement;
      if ((window as any).Cesium) { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load: ${src}`)));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => { (window as any).__cesiumScriptLoaded = true; resolve(); };
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

function loadStyle(href: string) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
}

const CesiumGlobe = forwardRef<CesiumGlobeHandle, CesiumGlobeProps>(({
  initialLat = 16,
  initialLng = 106,
  initialAltitude = 20000000,
  showGrid = false,
  imageryLayer,
  onLayerChange,
  onPinClick,
  showLayerPicker = true,
  className = '',
  annotations,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const gridLayerRef = useRef<any>(null);
  const annotationEntitiesRef = useRef<any[]>([]);
  const initRef      = useRef(false);
  const [ready, setReady] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const onLayerChangeRef = useRef(onLayerChange);
  const onPinClickRef    = useRef(onPinClick);
  useEffect(() => {
    onLayerChangeRef.current = onLayerChange;
    onPinClickRef.current    = onPinClick;
  }, [onLayerChange, onPinClick]);

  // ── INIT VIEWER ─────────────────────────────────────────────────────────────
  const initViewer = useCallback(async () => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    try {
      // Set base URL BEFORE loading the script
      (window as any).CESIUM_BASE_URL = '/cesium';

      // Load pre-built Cesium (bypasses webpack bundling — fixes Vercel SyntaxError)
      loadStyle('/cesium/Widgets/widgets.css');
      await loadScript('/cesium/Cesium.js');

      const Cesium = (window as any).Cesium;
      if (!Cesium) throw new Error('Cesium global not found after script load');

      // ✅ Do NOT touch Ion.defaultAccessToken — Cesium's built-in demo token
      //    handles Bing Maps & other providers automatically

      const viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        animation: false,
        timeline: false,
        fullscreenButton: false,
        baseLayerPicker: showLayerPicker,
        infoBox: false,
        selectionIndicator: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
        msaaSamples: 1,
      });

      // Disable anti-aliasing and lower resolution scale to boost FPS
      if (viewer.scene.postProcessStages?.fxaa) {
        viewer.scene.postProcessStages.fxaa.enabled = false;
      }
      viewer.resolutionScale = window.devicePixelRatio < 2 ? 0.8 : 0.5;

      // Hide Cesium credit watermark
      if (viewer.cesiumWidget?.creditContainer) {
        (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
      }

      // Set initial camera position
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(initialLng, initialLat, initialAltitude),
      });

      // Pin click handler
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((click: any) => {
        const picked = viewer.scene.pick(click.position);
        if (Cesium.defined(picked) && picked.id?._customPinData) {
          onPinClickRef.current?.(picked.id._customPinData);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      viewerRef.current = viewer;
      setReady(true);
    } catch (err) {
      console.error('[CesiumGlobe] Initialization failed:', err);
      initRef.current = false;
    }
  }, [initialLat, initialLng, initialAltitude, showLayerPicker]);

  useEffect(() => {
    initViewer();
    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        initRef.current = false;
      }
    };
  }, [initViewer]);

  // ── APPLY IMAGERY LAYER ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    if (!imageryLayer) { setInitialized(true); return; }

    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    const viewer = viewerRef.current;

    if (viewer.baseLayerPicker) {
      // Builder mode: use the built-in picker to switch layers
      const picker = viewer.baseLayerPicker;
      let attempts = 0;
      const interval = setInterval(() => {
        try {
          const models = picker.viewModel.imageryProviderViewModels;
          if (models?.length > 0) {
            const target = models.find((m: any) => m.name === imageryLayer);
            if (target && picker.viewModel.selectedImagery?.name !== imageryLayer) {
              picker.viewModel.selectedImagery = target;
            }
            setInitialized(true);
            clearInterval(interval);
          }
        } catch { setInitialized(true); clearInterval(interval); }
        if (++attempts > 40) { setInitialized(true); clearInterval(interval); }
      }, 200);
      return () => clearInterval(interval);
    } else {
      // Preview mode: apply layer manually
      (async () => {
        try {
          const models = Cesium.createDefaultImageryProviderViewModels();
          const target = models.find((m: any) => m.name === imageryLayer);
          if (target) {
            const providerOrPromise = target.creationCommand();
            const provider = await Promise.resolve(providerOrPromise);
            viewer.imageryLayers.removeAll(false);
            viewer.imageryLayers.addImageryProvider(provider);
          }
        } catch (e) {
          console.error('[CesiumGlobe] Layer apply failed:', e);
        } finally {
          setInitialized(true);
        }
      })();
    }
  }, [imageryLayer, ready]);

  // ── LAYER CHANGE LISTENER ────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !initialized || !viewerRef.current?.baseLayerPicker) return;
    let lastSeen = viewerRef.current.baseLayerPicker.viewModel.selectedImagery?.name;
    // Poll at 1500ms (was 500ms) — user picks layers slowly, no need for high frequency
    const interval = setInterval(() => {
      const cur = viewerRef.current?.baseLayerPicker?.viewModel?.selectedImagery?.name;
      if (cur && cur !== lastSeen) {
        lastSeen = cur;
        if (onLayerChangeRef.current && cur !== imageryLayer) onLayerChangeRef.current(cur);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [ready, initialized, imageryLayer]);

  // ── GRID OVERLAY (Graticule địa lý chuẩn: 36 kinh tuyến × 18 vĩ tuyến / 10°) ─
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    const viewer = viewerRef.current;

    if (showGrid && !gridLayerRef.current) {
      const instances: any[] = [];

      // ── Màu sắc các đường đặc biệt ──────────────────────────────────────────
      const COLOR_EQUATOR   = Cesium.Color.fromCssColorString('#FF4444').withAlpha(1.0);   // Xích đạo - đỏ tươi
      const COLOR_PRIME     = Cesium.Color.fromCssColorString('#22D3EE').withAlpha(1.0);   // Kinh tuyến gốc - cyan
      const COLOR_TROPIC    = Cesium.Color.fromCssColorString('#FBBF24').withAlpha(0.9);   // Chí tuyến - vàng cam
      const COLOR_ARCTIC    = Cesium.Color.fromCssColorString('#60A5FA').withAlpha(0.85);  // Vòng cực - xanh dương
      const COLOR_MAJOR     = Cesium.Color.WHITE.withAlpha(0.50);                          // Bội số 30° - trắng đậm
      const COLOR_MINOR     = Cesium.Color.WHITE.withAlpha(0.22);                          // Đường 10° thông thường

      // Các vĩ độ đặc biệt
      const SPECIAL_LATS: Record<number, { color: any; width: number }> = {
        0:     { color: COLOR_EQUATOR, width: 2.5 },  // Xích đạo
        23.5:  { color: COLOR_TROPIC,  width: 1.8 },  // Chí tuyến Bắc
        [-23.5 as any]: { color: COLOR_TROPIC,  width: 1.8 },  // Chí tuyến Nam
        66.5:  { color: COLOR_ARCTIC,  width: 1.5 },  // Vòng cực Bắc
        [-66.5 as any]: { color: COLOR_ARCTIC,  width: 1.5 },  // Vòng cực Nam
      };

      // ── Vĩ tuyến: mỗi 10° từ -90° → 90° ──────────────────────────────────
      // Thêm các đường đặc biệt: ±23.5° (chí tuyến), ±66.5° (vòng cực)
      const latList = [
        ...Array.from({ length: 19 }, (_, i) => -90 + i * 10), // -90,-80,...,90
        23.5, -23.5, 66.5, -66.5,                              // đường đặc biệt
      ];

      for (const lat of latList) {
        const positions: any[] = [];
        for (let lng = -180; lng <= 180; lng += 1) {
          positions.push(Cesium.Cartesian3.fromDegrees(lng, lat));
        }

        const special = SPECIAL_LATS[lat];
        const isMajor = lat % 30 === 0;
        const color = special ? special.color : isMajor ? COLOR_MAJOR : COLOR_MINOR;
        const width = special ? special.width : isMajor ? 1.2 : 0.8;

        instances.push(new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions,
            width,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
          },
        }));
      }

      // ── Kinh tuyến: mỗi 10° → 36 đường (đại diện cho 360 kinh tuyến) ──────
      for (let lng = -180; lng < 180; lng += 10) {
        const positions: any[] = [];
        for (let lat = -90; lat <= 90; lat += 1) {
          positions.push(Cesium.Cartesian3.fromDegrees(lng, lat));
        }

        const isPrime   = lng === 0;
        const isMajor   = lng % 30 === 0;
        const color = isPrime ? COLOR_PRIME : isMajor ? COLOR_MAJOR : COLOR_MINOR;
        const width = isPrime ? 2.5 : isMajor ? 1.2 : 0.8;

        instances.push(new Cesium.GeometryInstance({
          geometry: new Cesium.PolylineGeometry({
            positions,
            width,
            vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT,
          }),
          attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(color),
          },
        }));
      }

      gridLayerRef.current = viewer.scene.primitives.add(
        new Cesium.Primitive({
          geometryInstances: instances,
          appearance: new Cesium.PolylineColorAppearance(),
          asynchronous: false,
        })
      );
    } else if (!showGrid && gridLayerRef.current) {
      viewer.scene.primitives.remove(gridLayerRef.current);
      gridLayerRef.current = null;
    }
  }, [showGrid, ready]);

  // ── ANNOTATION LABELS ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    const viewer = viewerRef.current;

    // Xóa các chú thích cũ
    annotationEntitiesRef.current.forEach(e => viewer.entities.remove(e));
    annotationEntitiesRef.current = [];

    if (!annotations || annotations.length === 0) return;

    for (const ann of annotations) {
      // Parse màu từ Tailwind class hoặc hex string
      let cesiumColor = Cesium.Color.WHITE;
      if (ann.color) {
        const colorMap: Record<string, string> = {
          'text-red-500':     '#EF4444',
          'text-red-400':     '#F87171',
          'text-blue-600':    '#2563EB',
          'text-blue-400':    '#60A5FA',
          'text-blue-700':    '#1D4ED8',
          'text-slate-700':   '#334155',
          'text-emerald-700': '#047857',
          'text-orange-700':  '#C2410C',
          'text-rose-700':    '#BE123C',
          'text-green-700':   '#15803D',
          'text-purple-700':  '#7E22CE',
          'text-cyan-700':    '#0E7490',
          'text-white':       '#FFFFFF',
        };
        const hex = colorMap[ann.color] || ann.color;
        try { cesiumColor = Cesium.Color.fromCssColorString(hex); } catch {}
      }

      const fontSize = ann.isSmall ? '12pt' : '14pt';
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(ann.lng, ann.lat, 500000),
        label: {
          text: ann.label,
          font: `bold ${fontSize} Nunito, sans-serif`,
          fillColor: cesiumColor,
          outlineColor: Cesium.Color.fromCssColorString('#082F49').withAlpha(0.85),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.2, 1.5e8, 0.4),
          translucencyByDistance: new Cesium.NearFarScalar(1.5e7, 1.0, 1.5e8, 0.3),
        },
      });
      annotationEntitiesRef.current.push(entity);
    }
  }, [annotations, ready]);

  // ── IMPERATIVE HANDLE ─────────────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, altitude = 15000000, duration = 2) {
      const Cesium = (window as any).Cesium;
      if (!viewerRef.current || !Cesium) return;
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, altitude),
        duration,
      });
    },
    setLayer() {},
    setGrid() {},
    addPin(lat, lng, title, info, image) {
      if (!viewerRef.current) return;
      const Cesium = (window as any).Cesium;
      if (!Cesium) return;

      const entityData: any = {
        position: Cesium.Cartesian3.fromDegrees(lng, lat, 1000),
        point: {
          pixelSize: new Cesium.CallbackProperty(() => 20 + Math.abs(Math.sin(Date.now() / 250)) * 12, false),
          color: Cesium.Color.fromCssColorString('#06B6D4'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: new Cesium.CallbackProperty(() => 2 + Math.abs(Math.sin(Date.now() / 250)) * 4, false),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      };

      if (title?.trim()) {
        entityData.label = {
          text: title,
          font: 'bold 16pt Nunito, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString('#082F49'),
          outlineWidth: 4,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        };
      }

      const entity = viewerRef.current.entities.add(entityData);
      entity._customPinData = { title, info, image };
    },
    clearPins() {
      if (!viewerRef.current) return;
      // Chỉ xóa pin entities, giữ lại annotation entities
      const pinEntities = viewerRef.current.entities.values.filter(
        (e: any) => e._customPinData
      );
      pinEntities.forEach((e: any) => viewerRef.current.entities.remove(e));
    },
  }), []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      <style>{`
        .cesium-viewer-bottom { display: none !important; }
        ${!showLayerPicker ? '.cesium-viewer-toolbar { display: none !important; }' : ''}
      `}</style>
    </div>
  );
});

CesiumGlobe.displayName = 'CesiumGlobe';
export default CesiumGlobe;
