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

interface CesiumGlobeProps {
  initialLat?: number;
  initialLng?: number;
  initialAltitude?: number;
  showGrid?: boolean;
  imageryLayer?: string;
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
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);
  const gridLayerRef = useRef<any>(null);
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
      });

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
    const interval = setInterval(() => {
      const cur = viewerRef.current?.baseLayerPicker?.viewModel?.selectedImagery?.name;
      if (cur && cur !== lastSeen) {
        lastSeen = cur;
        if (onLayerChangeRef.current && cur !== imageryLayer) onLayerChangeRef.current(cur);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [ready, initialized, imageryLayer]);

  // ── GRID OVERLAY ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;
    const viewer = viewerRef.current;
    if (showGrid && !gridLayerRef.current) {
      gridLayerRef.current = viewer.imageryLayers.addImageryProvider(
        new Cesium.GridImageryProvider({
          cells: 24,
          color: Cesium.Color.WHITE.withAlpha(0.3),
          glowColor: Cesium.Color.WHITE.withAlpha(0.05),
          glowWidth: 1,
        })
      );
    } else if (!showGrid && gridLayerRef.current) {
      viewer.imageryLayers.remove(gridLayerRef.current);
      gridLayerRef.current = null;
    }
  }, [showGrid, ready]);

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
      viewerRef.current?.entities.removeAll();
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
