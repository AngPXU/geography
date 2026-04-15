'use client';

import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(
  () => import('@/components/ui/InteractiveMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-80px)] mt-6 rounded-[32px] bg-white/50 backdrop-blur-xl border border-white flex flex-col items-center justify-center animate-pulse p-4 text-center">
        <span className="text-6xl mb-4 animate-[spin_3s_linear_infinite]">🌍</span>
        <p className="text-xl font-bold text-[#082F49]">Đang tải trung tâm dữ liệu Bản đồ...</p>
        <p className="text-sm font-medium text-slate-500 mt-2">Việc này mất vài giây trong lần tải đầu tiên</p>
      </div>
    )
  }
);

export function MapWrapper() {
  return <InteractiveMap />;
}
