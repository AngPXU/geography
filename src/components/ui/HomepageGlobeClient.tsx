'use client';

import dynamic from 'next/dynamic';

const HomepageGlobeDynamic = dynamic(
  () => import('./HomepageGlobe').then(m => ({ default: m.HomepageGlobe })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export function HomepageGlobeClient() {
  return <HomepageGlobeDynamic />;
}
