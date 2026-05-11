'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/layouts/Navbar';
import type { MekongChapter } from './MekongMap';

const MekongMap = dynamic(() => import('./MekongMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-sky-50/60">
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '4px solid rgba(6,182,212,0.2)',
          borderTopColor: '#06B6D4',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  ),
});

const LESSON_CHAPTERS: MekongChapter[] = [
  {
    id: 'intro',
    title: 'Đồng bằng Sông Cửu Long',
    content: 'Còn được gọi là Vùng đồng bằng sông Mê Kông hay Cửu Long Gian - vựa lúa lớn nhất của đất nước Việt Nam. Tiếp giáp với biển Đông và khu vực Đông Nam Bộ, nơi đây nổi tiếng với mạng lưới kênh rạch chằng chịt và những vựa trái cây trù phú.',
    image: 'https://images.unsplash.com/photo-1596704179377-a8bd4199fc99?q=80&w=800&auto=format&fit=crop',
    viewState: { longitude: 105.5, latitude: 9.8, zoom: 7.5, pitch: 45, bearing: 0 }
  },
  {
    id: 'cairang',
    title: 'Chợ nổi Cái Răng (Cần Thơ)',
    content: 'Một trong những chợ nổi lớn nhất miền Tây Nam Bộ. Nét văn hóa độc đáo nhất là việc giao thương trên sông với những cây "Bẹo" treo loại nông sản mà ghe muốn bán. Thời điểm nhộn nhịp nhất của chợ là vào sáng sớm (từ 5h đến 8h sáng).',
    image: 'https://images.unsplash.com/photo-1601662973719-2182069eddc0?q=80&w=800&auto=format&fit=crop',
    viewState: { longitude: 105.748, latitude: 10.016, zoom: 12, pitch: 60, bearing: 30 }
  },
  {
    id: 'trasu',
    title: 'Rừng Tràm Trà Sư (An Giang)',
    content: 'Nằm tại tỉnh An Giang, đây là khu rừng ngập nước tiêu biểu nhất phía Tây sông Hậu. Nơi sinh sống của hàng chục loại chim quý hiếm và thảm thực vật bèo tấm xanh mướt che kín mặt nước. Là một môi trường sinh thái quan trọng của vùng.',
    image: 'https://images.unsplash.com/photo-1596896068222-6e27b2ec9f44?q=80&w=800&auto=format&fit=crop',
    viewState: { longitude: 105.000, latitude: 10.575, zoom: 13, pitch: 55, bearing: -20 }
  },
  {
    id: 'camau',
    title: 'Mũi Cà Mau',
    content: 'Mảnh đất tận cùng cực Nam của Tổ quốc, nơi duy nhất trên đất liền ở Việt Nam có thể ngắm mặt trời mọc ở biển Đông và lặn ở biển Tây. Thiên nhiên hoang sơ với những vòm rừng đước đan xen che chở cho hàng ngàn loài hải sinh.',
    image: 'https://images.unsplash.com/photo-1698205244583-05b1c552174c?q=80&w=800&auto=format&fit=crop',
    viewState: { longitude: 104.750, latitude: 8.590, zoom: 11, pitch: 70, bearing: 10 }
  }
];

export default function MekongDeltaScrollytelling() {
  const [activeChapter, setActiveChapter] = useState('intro');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    LESSON_CHAPTERS.forEach((chapter) => {
      const el = document.getElementById(chapter.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-[#f8fafc] text-slate-800 font-sans min-h-screen">
      <Navbar user={undefined} />

      <div className="flex flex-col lg:flex-row w-full bg-white relative top-0 mt-[80px]">

        <div className="w-full lg:w-1/2 h-[50vh] lg:h-[calc(100vh-80px)] sticky top-[80px] order-1 lg:order-2">
          <MekongMap chapters={LESSON_CHAPTERS} activeChapterId={activeChapter} />
        </div>

        <div className="w-full lg:w-1/2 p-6 lg:p-12 overflow-y-auto hide-scroll pt-20 order-2 lg:order-1 relative z-10" style={{ paddingBottom: '50vh' }}>

          {LESSON_CHAPTERS.map((chapter, index) => {
            const isActive = chapter.id === activeChapter;

            return (
              <div
                key={chapter.id}
                id={chapter.id}
                className={`min-h-[80vh] flex flex-col justify-center mb-32 transition-all duration-700 ${isActive ? 'opacity-100 scale-100' : 'opacity-10 scale-95 blur-sm'}`}
              >
                <div className="p-8 md:p-12 rounded-[40px] bg-white/70 backdrop-blur-2xl shadow-[0_20px_40px_-15px_rgba(14,165,233,0.15)] border-2 border-white relative overflow-hidden group">
                  <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-cyan-200/50 rounded-full blur-2xl z-0 pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 text-[#334155] font-bold text-xs uppercase tracking-widest mb-6">
                      Trạm {index + 1}
                    </div>

                    <h2 className="text-3xl lg:text-4xl font-black text-[#082F49] mb-6 leading-tight">
                      {chapter.title}
                    </h2>

                    <p className="text-slate-600 text-lg leading-relaxed font-medium mb-8">
                      {chapter.content}
                    </p>

                    <div className="w-full h-64 rounded-3xl overflow-hidden shadow-lg border border-slate-100 relative group-hover:shadow-[0_15px_30px_rgba(8,47,73,0.2)] transition-all">
                      <img src={chapter.image} alt={chapter.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}