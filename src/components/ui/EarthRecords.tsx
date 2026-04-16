'use client';
import React, { useRef } from 'react';
import Link from 'next/link';

const RECORDS = [
  {
    id: 'everest',
    title: 'Nóc nhà Thế giới',
    name: 'Đỉnh Everest (8.848m)',
    desc: 'Biên giới Nepal & Trung Quốc - Đỉnh núi cao nhất hành tinh so với mực nước biển.',
    bg: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=800&auto=format&fit=crop',
    icon: '⛰️',
    gradient: 'from-blue-900/80 to-transparent'
  },
  {
    id: 'mariana',
    title: 'Vực sâu ngút ngàn',
    name: 'Rãnh Mariana (10.984m)',
    desc: 'Tây Bắc Thái Bình Dương - Điểm sâu nhất của lớp vỏ Trái Đất dưới đại dương.',
    bg: 'https://images.unsplash.com/photo-1582967160351-4dc8195eacfa?q=80&w=800&auto=format&fit=crop',
    icon: '🌊',
    gradient: 'from-cyan-900/90 to-transparent'
  },
  {
    id: 'sahara',
    title: 'Lò sấy khổng lồ',
    name: 'Hoang mạc Sahara',
    desc: 'Bắc Phi - Hoang mạc nóng lớn nhất thế giới, rộng tương đương diện tích nước Mỹ.',
    bg: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800&auto=format&fit=crop',
    icon: '☀️',
    gradient: 'from-orange-900/90 to-transparent'
  },
  {
    id: 'antarctica',
    title: 'Lục địa Đóng băng',
    name: 'Nam Cực (-89.2°C)',
    desc: 'Lục địa lạnh nhất, khô nhất và nhiều gió nhất hành tinh.',
    bg: 'https://images.unsplash.com/photo-1518131379796-0158ce60172e?q=80&w=800&auto=format&fit=crop',
    icon: '❄️',
    gradient: 'from-sky-900/80 to-transparent'
  },
  {
    id: 'amazon',
    title: 'Lá phổi Xanh',
    name: 'Rừng Amazon',
    desc: 'Nam Mỹ - Lưu vực rừng mưa nhiệt đới khổng lồ mang trong mình đa dạng sinh học lớn nhất.',
    bg: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop',
    icon: '🌳',
    gradient: 'from-emerald-900/90 to-transparent'
  },
  {
    id: 'nile',
    title: 'Dòng sông vĩ đại',
    name: 'Sông Nile (6.650km)',
    desc: 'Bắc Phi - Chảy qua 11 quốc gia, được xem là dòng sông dài nhất hành tinh xuyên qua sa mạc.',
    bg: 'https://images.unsplash.com/photo-1543886567-ec6b2f4c3cb3?q=80&w=800&auto=format&fit=crop',
    icon: '🐊',
    gradient: 'from-teal-900/90 to-transparent'
  }
];

export function EarthRecords() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-transparent">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-rose-100/30 to-transparent rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="w-[90%] max-w-[1400px] mx-auto px-4 xl:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center md:text-left mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-widest mb-4 border border-rose-100">
              Chinh phục Tự nhiên
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-[#082F49] tracking-tight">
              Kỷ Lục <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">Trái Đất</span>
            </h2>
            <p className="text-slate-500 font-medium mt-4 max-w-xl text-lg">
              Những thái cực kỳ vĩ nhất của thiên nhiên mà không một cuốn sách giáo khoa nào lột tả hết được sự choáng ngợp.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <button 
              onClick={scrollLeft} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-[#082F49] hover:bg-slate-50 hover:border-cyan-200 transition-all shadow-sm active:scale-95"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button 
              onClick={scrollRight} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-[#082F49] hover:bg-slate-50 hover:border-cyan-200 transition-all shadow-sm active:scale-95"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Horizontal Slider */}
        <div 
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pt-4 pb-12 -mt-4 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {RECORDS.map((rec) => (
            <div 
              key={rec.id} 
              className="shrink-0 w-[85vw] md:w-[350px] lg:w-[380px] snap-center group relative h-[420px] rounded-[32px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-white/50"
            >
              
              {/* Image Background */}
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-700 ease-out"
                style={{ backgroundImage: `url('${rec.bg}')` }}
              />
              
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${rec.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl mb-auto border border-white/30 transform -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  {rec.icon}
                </div>
                
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-white/80 font-bold text-sm uppercase tracking-wider mb-1">{rec.title}</p>
                  <h3 className="text-2xl font-black text-white m-0 leading-tight mb-3 drop-shadow-md">
                    {rec.name}
                  </h3>
                  <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-500 origin-bottom opacity-0 group-hover:opacity-100">
                    <p className="text-white/90 text-sm font-medium leading-relaxed pb-4">
                      {rec.desc}
                    </p>
                    <Link href="/map" className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white font-bold text-sm hover:bg-white hover:text-[#082F49] transition-colors border border-white/30">
                      Dịch chuyển đến đây 🚀
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
