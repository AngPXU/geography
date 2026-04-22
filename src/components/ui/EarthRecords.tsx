'use client';
import React, { useRef } from 'react';
import Link from 'next/link';

const RECORDS = [
  {
    id: 'everest',
    title: 'Nóc nhà Thế giới',
    name: 'Đỉnh Everest (8.848m)',
    desc: 'Biên giới Nepal & Trung Quốc - Đỉnh núi cao nhất hành tinh so với mực nước biển.',
    bg: 'https://images.unsplash.com/photo-1575819719798-83d97dd6949c?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    icon: '⛰️',
    gradient: 'from-blue-900/80 to-transparent'
  },
  {
    id: 'mariana',
    title: 'Đáy sâu thẳm nhất',
    name: 'Rãnh Mariana (-10.984m)',
    desc: 'Tây Thái Bình Dương - Nơi sâu nhất của vỏ Trái Đất, nơi áp suất có thể nghiền nát mọi thứ và ánh mặt trời không bao giờ chạm tới.',
    bg: 'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?q=80&w=800&auto=format&fit=crop',
    icon: '🌊',
    gradient: 'from-cyan-900/80 to-transparent'
  },
  {
    id: 'sahara',
    title: 'Lò lửa khổng lồ',
    name: 'Hoang mạc Sahara',
    desc: 'Châu Phi - Sa mạc cát nóng lớn nhất thế giới, có diện tích xấp xỉ toàn bộ lãnh thổ của Hoa Kỳ.',
    bg: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800&auto=format&fit=crop',
    icon: '🐪',
    gradient: 'from-orange-900/80 to-transparent'
  },
  {
    id: 'amazon-river',
    title: 'Dòng máu của Trái Đất',
    name: 'Sông Amazon',
    desc: 'Nam Mỹ - Dòng sông vĩ đại có lưu lượng nước lớn nhất thế giới, ôm trọn rừng rậm Amazon - lá phổi xanh của hành tinh.',
    bg: 'https://images.unsplash.com/photo-1593069567131-53a0614dde1d?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    icon: '🌿',
    gradient: 'from-emerald-900/80 to-transparent'
  },
  {
    id: 'dead-sea',
    title: 'Điểm thấp nhất đất liền',
    name: 'Biển Chết (-430m)',
    desc: 'Biên giới Israel & Jordan - Hồ nước mặn nhất thế giới nằm dưới mực nước biển, nơi con người có thể nổi tự nhiên mà không cần bơi.',
    bg: 'https://images.unsplash.com/photo-1672417802197-94622fb9d122?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    icon: '🧂',
    gradient: 'from-sky-900/80 to-transparent'
  },
  {
    id: 'angel-falls',
    title: 'Thác nước cao nhất',
    name: 'Thác Angel (979m)',
    desc: 'Venezuela - Dòng thác rơi tự do cao nhất thế giới, đổ sầm sập xuống từ đỉnh núi phẳng Auyán-tepui ẩn mình trong mây.',
    bg: 'https://images.unsplash.com/photo-1533094602577-198d3beab8ea?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    icon: '💦',
    gradient: 'from-teal-900/80 to-transparent'
  },
  {
    id: 'vostok',
    title: 'Tủ đá của Hành tinh',
    name: 'Trạm Vostok (-89.2°C)',
    desc: 'Nam Cực - Nơi ghi nhận nhiệt độ tự nhiên thấp nhất từng được đo lường trên bề mặt Trái Đất, một thế giới chỉ có băng và tuyết.',
    bg: 'https://media.istockphoto.com/id/1437717528/photo/modern-remote-antarctic-research-polar-station-on-the-mountains-background-3d-rendering.webp?a=1&b=1&s=612x612&w=0&k=20&c=myhBcUiwmx1YkDtJeb56wvK2h1qdmsAoER-dyNJiOlI=',
    icon: '❄️',
    gradient: 'from-indigo-900/80 to-transparent'
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
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-md border-[2px] border-white/80 text-[#082F49] shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:bg-white hover:border-white hover:shadow-[0_12px_24px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all duration-300"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              onClick={scrollRight}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-md border-[2px] border-white/80 text-[#082F49] shadow-[0_8px_16px_rgba(0,0,0,0.05)] hover:bg-white hover:border-white hover:shadow-[0_12px_24px_rgba(14,165,233,0.15)] hover:-translate-y-1 transition-all duration-300"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
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
                    <Link href="/map" className="inline-flex items-center justify-center w-full py-3 rounded-full bg-[#06B6D4] hover:bg-[#22D3EE] text-white font-black text-sm shadow-[0_10px_20px_rgba(6,182,212,0.3)] hover:shadow-[0_15px_30px_rgba(34,211,238,0.5)] transition-all duration-300 border-[2px] border-[#06B6D4]">
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
