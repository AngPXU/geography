'use client';

import { useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export interface MekongChapter {
  id: string;
  title: string;
  content: string;
  image: string;
  viewState: { longitude: number; latitude: number; zoom: number; pitch: number; bearing: number };
}

interface Props {
  chapters: MekongChapter[];
  activeChapterId: string;
}

export default function MekongMap({ chapters, activeChapterId }: Props) {
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const chapter = chapters.find((c) => c.id === activeChapterId);
    if (chapter && mapRef.current) {
      mapRef.current.flyTo({
        center: [chapter.viewState.longitude, chapter.viewState.latitude],
        zoom: chapter.viewState.zoom,
        pitch: chapter.viewState.pitch,
        bearing: chapter.viewState.bearing,
        duration: 2500,
        essential: true,
      });
    }
  }, [activeChapterId, chapters]);

  const activeChap = chapters.find((c) => c.id === activeChapterId);

  return (
    // @ts-ignore mapLib is correct prop
    <Map
      ref={mapRef}
      initialViewState={chapters[0].viewState}
      mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      mapLib={maplibregl}
      style={{ width: '100%', height: '100%' }}
      interactive={true}
    >
      {activeChap && (
        <Marker
          longitude={activeChap.viewState.longitude}
          latitude={activeChap.viewState.latitude}
          anchor="bottom"
        >
          <div className="animate-bounce">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-lg shadow-[0_5px_15px_rgba(225,29,72,0.6)] border-2 border-rose-500">
              📍
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-500 mx-auto -mt-[2px]" />
          </div>
        </Marker>
      )}
      <NavigationControl position="bottom-right" />
    </Map>
  );
}