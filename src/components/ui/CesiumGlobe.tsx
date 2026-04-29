'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react';
import * as Cesium from 'cesium';

// Set base URL for Cesium static assets so it doesn't fetch from CDN and break CSP
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium/';
}

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

  const onLayerChangeRef = useRef(onLayerChange);
  const onPinClickRef = useRef(onPinClick);
  useEffect(() => {
    onLayerChangeRef.current = onLayerChange;
    onPinClickRef.current = onPinClick;
  }, [onLayerChange, onPinClick]);

  const [ready, setReady] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const initViewer = useCallback(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    // Inject CSS for the built-in Cesium UI Widgets
    if (!document.getElementById('cesium-widget-css')) {
      const link = document.createElement('link');
      link.id = 'cesium-widget-css';
      link.rel = 'stylesheet';
      link.href = '/cesium/Widgets/widgets.css';
      document.head.appendChild(link);
    }

    // Initialize exactly like the demo but turn off bottom UI widgets
    const viewer = new Cesium.Viewer(containerRef.current, {
      terrain: Cesium.Terrain.fromWorldTerrain(),
      animation: false,
      timeline: false,
      fullscreenButton: false,
      baseLayerPicker: showLayerPicker, // Phụ thuộc vào prop (Trình chiếu = false)
      infoBox: false, // Tắt InfoBox mặc định
      selectionIndicator: false, // Tắt vòng xanh lá mặc định khi click
      baseLayer: showLayerPicker ? undefined : false, // Tránh lỗi 401 Bing Maps nếu không dùng picker
    });

    // Hide the Cesium logo and default token warning at the bottom
    if (viewer.cesiumWidget.creditContainer) {
      (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none';
    }

    // Set initial view
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(initialLng, initialLat, initialAltitude),
    });

    // Add click event listener for pins
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id;
        if (entity._customPinData) {
          if (onPinClickRef.current) {
            onPinClickRef.current(entity._customPinData);
          }
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;
    setReady(true);
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

  // Áp dụng lớp bản đồ đã lưu từ database vào Cesium
  useEffect(() => {
    if (!ready || !viewerRef.current) return;

    if (!imageryLayer) {
      setInitialized(true);
      return;
    }

    const viewer = viewerRef.current;
    
    // ALWAYS USE BASELAYERPICKER
    if (viewer.baseLayerPicker) {
      const picker = viewer.baseLayerPicker;
      let attempts = 0;
      
      const applyInterval = setInterval(() => {
        try {
          const models = picker.viewModel.imageryProviderViewModels;
          if (models && models.length > 0) {
            const targetModel = models.find((m: any) => m.name === imageryLayer);
            if (targetModel && picker.viewModel.selectedImagery?.name !== imageryLayer) {
              picker.viewModel.selectedImagery = targetModel;
            }
            setInitialized(true);
            clearInterval(applyInterval);
          }
        } catch (e) {
          console.warn("Cesium BaseLayerPicker update failed:", e);
          setInitialized(true);
          clearInterval(applyInterval);
        }
        attempts++;
        if (attempts > 40) { // Timeout sau 8 giây
          setInitialized(true);
          clearInterval(applyInterval);
        }
      }, 200);
      
      return () => clearInterval(applyInterval);
    } 
    // NẾU KHÔNG CÓ BASELAYERPICKER (Preview)
    else {
      const applyManual = async () => {
        try {
          // @ts-ignore - Cesium 1.122 might not expose this in types, but it's there
          const models = Cesium.createDefaultImageryProviderViewModels();
          const targetModel = models.find((m: any) => m.name === imageryLayer);
          
          if (targetModel) {
            const providerOrPromise = targetModel.creationCommand();
            const provider = await Promise.resolve(providerOrPromise);
            
            // Sử dụng false để KHÔNG destroy provider, tránh lỗi khi load lại map lần 2
            viewer.imageryLayers.removeAll(false);
            viewer.imageryLayers.addImageryProvider(provider);
          }
        } catch (e) {
          console.error("Lỗi khi áp dụng layer thủ công:", e);
        } finally {
          setInitialized(true);
        }
      };
      
      applyManual();
    }
  }, [imageryLayer, ready]);

  // Lắng nghe sự thay đổi layer (Sử dụng Polling vòng lặp cực kỳ an toàn)
  useEffect(() => {
    if (!ready || !initialized || !viewerRef.current || !viewerRef.current.baseLayerPicker) return;
    
    let lastSeen = viewerRef.current.baseLayerPicker.viewModel.selectedImagery?.name;

    const interval = setInterval(() => {
      const currentSelection = viewerRef.current.baseLayerPicker.viewModel.selectedImagery?.name;
      // Chỉ lưu nếu thực sự khác và không phải do đang set lại state
      if (currentSelection && currentSelection !== lastSeen) {
        lastSeen = currentSelection;
        // Báo lên trên nếu user đổi
        if (onLayerChangeRef.current && currentSelection !== imageryLayer) {
          onLayerChangeRef.current(currentSelection);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [ready, initialized, imageryLayer]);

  // Handle grid overlay
  useEffect(() => {
    if (!viewerRef.current || !ready) return;
    const viewer = viewerRef.current;

    if (showGrid && !gridLayerRef.current) {
      gridLayerRef.current = viewer.imageryLayers.addImageryProvider(
        new Cesium.GridImageryProvider({
          cells: 24,
          color: Cesium.Color.WHITE.withAlpha(0.3),
          glowColor: Cesium.Color.WHITE.withAlpha(0.05),
          glowWidth: 1,
        }),
      );
    } else if (!showGrid && gridLayerRef.current) {
      viewer.imageryLayers.remove(gridLayerRef.current);
      gridLayerRef.current = null;
    }
  }, [showGrid, ready]);

  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, altitude = 15000000, duration = 2) {
      if (!viewerRef.current) return;
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, altitude),
        duration,
      });
    },
    setLayer(layerId) {
      // Bỏ qua vì hiện tại dùng bộ chọn layer mặc định của Cesium
    },
    setGrid() {},
    addPin(lat, lng, title, info, image) {
      if (!viewerRef.current) return;
      
      const entityData: any = {
        position: Cesium.Cartesian3.fromDegrees(lng, lat, 1000),
        point: {
          pixelSize: new Cesium.CallbackProperty(() => 20 + Math.abs(Math.sin(Date.now() / 250)) * 12, false),
          color: Cesium.Color.fromCssColorString('#06B6D4'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: new Cesium.CallbackProperty(() => 2 + Math.abs(Math.sin(Date.now() / 250)) * 4, false),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        description: info,
      };

      if (title && title.trim().length > 0) {
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
      {/* 
        Sử dụng div này cho Cesium, nó sẽ tự động chèn các nút
        chọn Layer, màn hình full, home, animation, timeline vào đây! 
      */}
      <div ref={containerRef} className="w-full h-full" />
      <style>{`
        .cesium-viewer-bottom {
          display: none !important;
        }
        ${!showLayerPicker ? `
        .cesium-baseLayerPicker-dropDown {
          display: none !important;
        }
        .cesium-button.cesium-toolbar-button {
           /* Ẩn riêng cái nút chọn layer nếu cần, mặc dù nó được gói trong div của Cesium.
              Tuy nhiên .cesium-baseLayerPicker-dropDown chứa toàn bộ cục UI nút bấm + list. */
        }
        .cesium-viewer-toolbar {
           /* Tùy chỉnh nếu bạn muốn ẩn cả nút Home, Tìm kiếm ở Preview */
        }
        ` : ''}
      `}</style>
    </div>
  );
});

CesiumGlobe.displayName = 'CesiumGlobe';
export default CesiumGlobe;
