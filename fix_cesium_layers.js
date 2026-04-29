
let c = fs.readFileSync('src/components/ui/CesiumGlobe.tsx', 'utf8');

c = c.replace(/new C.ArcGisMapServerImageryProvider\(\{/g, 'C.ArcGisMapServerImageryProvider.fromUrl(');
c = c.replace(/\}\),/g, '),'); // This might be tricky, let's just use UrlTemplateImageryProvider for ESRI

// Let's rewrite the IMAGERY_LAYERS using UrlTemplateImageryProvider
const newLayers = `
export const IMAGERY_LAYERS: Record<string, { emoji: string; label: string; desc: string; create: (C: any) => any }> = {
  'esri-imagery': {
    emoji: '🛰️', label: 'Vệ tinh', desc: 'ESRI World Imagery',
    create: (C) => new C.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 19,
    }),
  },
  'esri-topo': {
    emoji: '🏔️', label: 'Địa hình', desc: 'ESRI World Topo',
    create: (C) => new C.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 19,
    }),
  },
  'esri-ocean': {
    emoji: '🌊', label: 'Đại dương', desc: 'ESRI Ocean Basemap',
    create: (C) => new C.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 13,
    }),
  },
  'esri-shaded': {
    emoji: '🌍', label: 'Phù điêu', desc: 'ESRI Shaded Relief',
    create: (C) => new C.UrlTemplateImageryProvider({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
      maximumLevel: 13,
    }),
  },
  'osm': {
    emoji: '🗺️', label: 'OpenStreetMap', desc: 'OSM (miễn phí)',
    create: (C) => new C.UrlTemplateImageryProvider({
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    }),
  },
  'nasa-night': {
    emoji: '🌃', label: 'Ban đêm', desc: 'NASA Black Marble',
    create: (C) => new C.UrlTemplateImageryProvider({
      url: 'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
      maximumLevel: 8,
    }),
  },
};`;

const oldLayersStart = c.indexOf('export const IMAGERY_LAYERS: Record<string');
const oldLayersEnd = c.indexOf('/* ── Ref handle ─────────────────────────────────────────────── */');
c = c.substring(0, oldLayersStart) + newLayers + '\n\n' + c.substring(oldLayersEnd);

c = c.replace('viewer.scene.globe.enableLighting  = true;', 'viewer.scene.globe.enableLighting  = false;');

// Base layer picker false means it tries to create the default imageryProvider. 
// However, since we pass a custom one, it shouldn't try Bing. 
// But in modern Cesium, we should pass imageryProvider: false during Viewer creation and then add our layer.

c = c.replace(/imageryProvider: IMAGERY_LAYERS\[imageryLayer\]\?\.create\(C\)\s*\?\? IMAGERY_LAYERS\['esri-imagery'\]\.create\(C\),/, 'baseLayerPicker: false,\n      imageryProvider: false,');

// We need to apply the layer immediately after viewer creation
const viewerCreationEnd = c.indexOf('viewer.scene.skyBox.show');
const layerApplyCode = `    const provider = IMAGERY_LAYERS[imageryLayer]?.create(C) ?? IMAGERY_LAYERS['esri-imagery'].create(C);
    if (provider) viewer.imageryLayers.addImageryProvider(provider);
    `;

c = c.substring(0, viewerCreationEnd) + layerApplyCode + '\n    ' + c.substring(viewerCreationEnd);

// Also applyLayer should just remove all and add
// const applyLayer = useCallback((layerId: string) => { ... } is already doing that.

fs.writeFileSync('src/components/ui/CesiumGlobe.tsx', c, 'utf8');
console.log('Fixed CesiumGlobe!');
