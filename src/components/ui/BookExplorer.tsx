'use client';

import { useState, useRef } from 'react';

const CHAPTERS = [
  {
    chapter: 'Chương I', title: '🌏 Vị trí Địa lý Việt Nam',
    body: 'Việt Nam nằm ở phía Đông bán đảo Đông Dương, thuộc khu vực Đông Nam Á. Lãnh thổ trải dài từ 8°34\'B đến 23°23\'B và từ 102°09\'Đ đến 109°24\'Đ.',
    fact: '💡 Diện tích: 331.212 km²', color: '#E0F2FE', accent: '#0284C7', pageNum: 1,
  },
  {
    chapter: 'Chương II', title: '⛰️ Địa hình Việt Nam',
    body: 'Địa hình Việt Nam đồi núi chiếm ¾ diện tích đất liền. Đỉnh Fansipan cao 3.147m là nóc nhà Đông Dương. Đồng bằng sông Cửu Long và sông Hồng là vựa lúa lớn nhất cả nước.',
    fact: '💡 Đỉnh cao nhất: Fansipan 3.147m', color: '#DCFCE7', accent: '#16A34A', pageNum: 2,
  },
  {
    chapter: 'Chương III', title: '🌊 Khí hậu & Sông ngòi',
    body: 'Khí hậu nhiệt đới ẩm gió mùa, có sự phân hóa Bắc - Nam rõ rệt. Hệ thống sông ngòi dày đặc với hơn 2.360 sông suối, trong đó sông Mê Kông và sông Hồng là huyết mạch kinh tế.',
    fact: '💡 Lượng mưa trung bình: 1.500 - 2.000mm/năm', color: '#FEF9C3', accent: '#D97706', pageNum: 3,
  },
  {
    chapter: 'Chương IV', title: '🌿 Tài nguyên Thiên nhiên',
    body: 'Việt Nam sở hữu nguồn tài nguyên phong phú: dầu mỏ, than đá, khoáng sản kim loại, đất hiếm, và rừng nhiệt đới. Vùng biển rộng lớn là kho báu thủy sản và tiềm năng du lịch.',
    fact: '💡 Đường bờ biển: 3.260 km', color: '#FCE7F3', accent: '#DB2777', pageNum: 4,
  },
  {
    chapter: 'Chương V', title: '🏙️ Dân cư & Đô thị',
    body: 'Dân số Việt Nam trên 100 triệu người, gồm 54 dân tộc. Hà Nội là thủ đô ngàn năm văn hiến; TP.HCM là trung tâm kinh tế sầm uất. Tốc độ đô thị hóa ngày càng nhanh.',
    fact: '💡 Dân số: ~100 triệu (đứng thứ 15 thế giới)', color: '#EDE9FE', accent: '#7C3AED', pageNum: 5,
  },
];

const TOTAL = CHAPTERS.length + 2; // 0..6

export function BookExplorer() {
  const [spread, setSpread] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipPhase, setFlipPhase] = useState<'idle' | 'folding' | 'unfolding'>('idle');
  const [flipDir, setFlipDir] = useState<'next' | 'prev'>('next');
  // Nội dung của trang đang lật (mặt trước & mặt sau)
  const [flipFront, setFlipFront] = useState<React.ReactNode>(null);
  const [flipBack, setFlipBack] = useState<React.ReactNode>(null);

  function navigate(dir: 'next' | 'prev') {
    if (flipping) return;
    const next = dir === 'next' ? spread + 1 : spread - 1;
    if (next < 0 || next >= TOTAL) return;

    // Chuẩn bị nội dung trang lật
    if (dir === 'next') {
      setFlipFront(renderRightPage(spread));
      setFlipBack(renderLeftPage(next));
    } else {
      setFlipFront(renderLeftPage(spread));
      setFlipBack(renderRightPage(next));
    }

    setFlipDir(dir);
    setFlipping(true);
    setFlipPhase('folding');

    // Sau nửa vòng lật → đổi spread
    setTimeout(() => {
      setSpread(next);
      setFlipPhase('unfolding');
    }, 350);

    // Kết thúc animation
    setTimeout(() => {
      setFlipping(false);
      setFlipPhase('idle');
      setFlipFront(null);
      setFlipBack(null);
    }, 700);
  }

  const isCover = spread === 0;
  const isBack = spread === TOTAL - 1;

  return (
    <section className="w-full py-20 px-4 md:px-8 relative">
      <style>{`
        .book-wrap {
          perspective: 2400px;
          perspective-origin: 50% 50%;
        }
        /* Trang lật — xoay quanh gáy (cạnh trái khi lật sang phải, cạnh phải khi lật sang trái) */
        .flip-page {
          position: absolute;
          top: 0;
          width: 50%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.7s cubic-bezier(0.645, 0.045, 0.355, 1.000);
          z-index: 10;
        }
        .flip-page.dir-next {
          right: 0;
          transform-origin: left center;
        }
        .flip-page.dir-prev {
          left: 0;
          transform-origin: right center;
        }
        .flip-page.dir-next.folding  { transform: rotateY(-180deg); }
        .flip-page.dir-next.unfolding{ transform: rotateY(-180deg); }
        .flip-page.dir-prev.folding  { transform: rotateY(180deg); }
        .flip-page.dir-prev.unfolding{ transform: rotateY(180deg); }

        .flip-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          overflow: hidden;
        }
        .flip-face-back {
          transform: rotateY(180deg);
        }
        /* Bóng đổ khi lật */
        .flip-page.dir-next.folding .flip-face-front::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to left, rgba(8,47,73,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .flip-page.dir-prev.folding .flip-face-front::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(8,47,73,0.18) 0%, transparent 70%);
          pointer-events: none;
        }
        .book-shadow {
          box-shadow:
            0 4px 6px rgba(8,47,73,0.06),
            0 20px 50px rgba(8,47,73,0.16),
            0 60px 100px rgba(8,47,73,0.10);
        }
      `}</style>

      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm mb-4">
          <span className="text-sm font-bold text-[#082F49] uppercase tracking-wider">📖 Khám Phá</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-[#082F49]">Cuốn Sách Địa Lý</h2>
        <p className="text-[#334155] mt-3 text-lg">Lật từng trang để khám phá kiến thức thú vị về Việt Nam</p>
      </div>

      {/* Book */}
      <div className="flex flex-col items-center gap-10">
        <div className="book-wrap w-full" style={{ maxWidth: 1080 }}>
          <div
            className="relative book-shadow rounded-2xl overflow-hidden"
            style={{
              width: '100%',
              aspectRatio: '2 / 1.18',
            }}
          >
            {/* -------- TRANG TRÁI (static) -------- */}
            <div className="absolute top-0 left-0 w-1/2 h-full" style={{ zIndex: 1 }}>
              {renderLeftPage(spread)}
              {/* Gáy phải */}
              <div className="absolute right-0 top-0 bottom-0 w-4 z-10"
                style={{ background: 'linear-gradient(to right, rgba(8,47,73,0.07), transparent)' }} />
            </div>

            {/* -------- TRANG PHẢI (static) -------- */}
            <div className="absolute top-0 right-0 w-1/2 h-full" style={{ zIndex: 1 }}>
              {renderRightPage(spread)}
              {/* Gáy trái */}
              <div className="absolute left-0 top-0 bottom-0 w-4 z-10"
                style={{ background: 'linear-gradient(to left, rgba(8,47,73,0.07), transparent)' }} />
            </div>

            {/* Gáy sách giữa */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 z-20"
              style={{
                background: 'linear-gradient(to right, rgba(8,47,73,0.12) 0%, rgba(255,255,255,0.9) 50%, rgba(8,47,73,0.12) 100%)',
                boxShadow: '0 0 12px rgba(8,47,73,0.1)',
              }} />

            {/* -------- TRANG LẬT (3D flip) -------- */}
            {flipping && (
              <div
                className={`flip-page dir-${flipDir} ${flipPhase}`}
              >
                {/* Mặt trước trang lật */}
                <div className={`flip-face flip-face-front ${flipDir === 'next' ? 'rounded-r-2xl' : 'rounded-l-2xl'} overflow-hidden`}>
                  {flipFront}
                </div>
                {/* Mặt sau trang lật (hiện ra sau khi quay 180°) */}
                <div className={`flip-face flip-face-back ${flipDir === 'next' ? 'rounded-l-2xl' : 'rounded-r-2xl'} overflow-hidden`}>
                  {flipBack}
                </div>
              </div>
            )}

            {/* Click zone phải → next */}
            <button
              onClick={() => navigate('next')}
              disabled={flipping || spread === TOTAL - 1}
              className="absolute right-0 top-0 w-1/3 h-full z-30 flex items-center justify-end pr-5 group cursor-pointer disabled:cursor-default"
            >
              <div className={`w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/50 backdrop-blur-sm flex items-center justify-center text-slate-400 group-hover:text-cyan-500 transition-all duration-300 group-disabled:opacity-0`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </button>
            {/* Click zone trái → prev */}
            <button
              onClick={() => navigate('prev')}
              disabled={flipping || spread === 0}
              className="absolute left-0 top-0 w-1/3 h-full z-30 flex items-center justify-start pl-5 group cursor-pointer disabled:cursor-default"
            >
              <div className={`w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/50 backdrop-blur-sm flex items-center justify-center text-slate-400 group-hover:text-cyan-500 transition-all duration-300 group-disabled:opacity-0`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </div>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('prev')} disabled={spread === 0 || flipping}
            className="h-12 px-7 rounded-full bg-white/80 backdrop-blur-md border border-white text-[#082F49] font-bold shadow-sm hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(14,165,233,0.12)] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
            ← Trước
          </button>

          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-md border border-white rounded-full px-5 py-3 shadow-sm">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button key={i}
                onClick={() => {
                  if (i === spread || flipping) return;
                  navigate(i > spread ? 'next' : 'prev');
                  // Quick jump: after navigate chain for multi-page skip not implemented, just navigate 1
                }}
                className={`rounded-full transition-all duration-300 ${i === spread ? 'w-6 h-2.5 bg-[#06B6D4]' : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-400'}`}
              />
            ))}
          </div>

          <button onClick={() => navigate('next')} disabled={spread === TOTAL - 1 || flipping}
            className="h-12 px-7 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-sm hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(6,182,212,0.3)] transition-all disabled:opacity-25 disabled:cursor-not-allowed">
            Sau →
          </button>
        </div>

        <p className="text-[#94A3B8] text-xs font-medium -mt-4">
          {spread === 0 ? 'Bìa sách' : spread === TOTAL - 1 ? 'Bìa sau' : `Chương ${spread} / ${CHAPTERS.length}`}
        </p>
      </div>
    </section>
  );
}

/* ======== render helpers ======== */
function renderLeftPage(spread: number): React.ReactNode {
  if (spread === 0) return <DarkBlankPage />;
  if (spread === TOTAL - 1) {
    const ch = CHAPTERS[CHAPTERS.length - 1];
    return <ContentPage data={ch} side="left" />;
  }
  if (spread === 1) return <PreviousPageHint />;
  const ch = CHAPTERS[spread - 2];
  return ch ? <ContentPage data={ch} side="left" /> : <BlankPage />;
}

function renderRightPage(spread: number): React.ReactNode {
  if (spread === 0) return <CoverFront />;
  if (spread === TOTAL - 1) return <CoverBack />;
  const ch = CHAPTERS[spread - 1];
  return ch ? <ContentPage data={ch} side="right" /> : <BlankPage />;
}

/* ======== Page components ======== */
function CoverFront() {
  return (
    <div className="w-full h-full flex flex-col items-start justify-between p-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #0d2b5c 0%, #0e4272 55%, #0a3460 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: (Math.random() * 2 + 0.5) + 'px', height: (Math.random() * 2 + 0.5) + 'px',
              top: (Math.random() * 100) + '%', left: (Math.random() * 100) + '%',
              opacity: Math.random() * 0.5 + 0.15,
              animationDelay: (Math.random() * 4) + 's',
              animationDuration: (Math.random() * 2 + 2) + 's',
            }} />
        ))}
      </div>
      <div className="relative z-10 bg-white/10 border border-white/20 rounded-xl px-4 py-1.5">
        <span className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">GeoExplore</span>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center w-full my-4">
        <div className="relative">
          <div className="absolute -inset-10 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }} />
          <div className="absolute -inset-14 rounded-full border border-dashed border-white/10 animate-spin" style={{ animationDuration: '28s' }} />
          <div className="absolute -inset-20 rounded-full border border-dashed border-white/05 animate-spin" style={{ animationDuration: '45s', animationDirection: 'reverse' }} />
          <div className="w-40 h-40 rounded-full border-2 border-white/20 relative overflow-hidden flex items-center justify-center"
            style={{ background: 'radial-gradient(circle at 38% 38%, #3b82f6 0%, #1d4ed8 50%, #0f2d7a 100%)' }}>
            <div className="absolute top-[28%] left-[10%] w-[32%] h-[24%] bg-green-400/50 rounded-[40%_50%_40%_50%]" />
            <div className="absolute top-[18%] left-[52%] w-[28%] h-[22%] bg-green-400/50 rounded-[50%_40%_50%_40%]" />
            <div className="absolute top-[50%] left-[28%] w-[22%] h-[26%] bg-green-400/40 rounded-[40%]" />
            <div className="absolute top-[44%] left-[58%] w-[24%] h-[28%] bg-green-400/40 rounded-[40%]" />
            <div className="absolute top-[12%] left-[10%] w-[30%] h-[18%] bg-white/10 rounded-full blur-md" />
            <span className="text-5xl z-10 drop-shadow-lg">🌏</span>
          </div>
        </div>
      </div>
      <div className="relative z-10 w-full">
        <div className="w-14 h-[2px] bg-cyan-400 mb-5 rounded-full" />
        <h2 className="text-white font-black text-4xl leading-tight mb-3 drop-shadow-lg">Địa Lý<br />Việt Nam</h2>
        <p className="text-blue-200/60 text-sm leading-relaxed">Khám phá đất nước hình chữ S<br />qua từng trang sách sinh động</p>
        <p className="mt-4 text-cyan-400/50 text-[10px] font-bold uppercase tracking-[0.2em]">Phiên bản 2026 · Cấp THCS</p>
      </div>
    </div>
  );
}

function CoverBack() {
  return (
    <div className="w-full h-full flex flex-col items-start justify-end p-10 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0a3460 0%, #0d2b5c 100%)' }}>
      <div className="w-14 h-14 rounded-[16px] bg-white/10 border border-white/15 flex items-center justify-center text-3xl mb-5">🌏</div>
      <p className="text-white/55 text-sm font-medium leading-loose italic mb-5 max-w-xs">
        "Học địa lý không chỉ là ghi nhớ vị trí,<br />mà là hiểu vì sao Trái Đất lại đẹp đến vậy."
      </p>
      <div className="h-px w-10 bg-cyan-400/40 mb-3" />
      <span className="text-cyan-400/40 text-[10px] tracking-[0.2em] font-bold uppercase">GeoExplore · 2026</span>
    </div>
  );
}

function ContentPage({ data, side }: { data: typeof CHAPTERS[0]; side: 'left' | 'right' }) {
  return (
    <div className="w-full h-full flex flex-col p-8 md:p-10 relative overflow-hidden" style={{ background: data.color }}>
      <div className={`absolute ${side === 'left' ? 'bottom-0 left-0' : 'top-0 right-0'} w-40 h-40 rounded-full opacity-15 blur-[50px]`}
        style={{ background: data.accent }} />
      <span className="self-start text-[11px] font-black uppercase tracking-[0.14em] px-4 py-1.5 rounded-full mb-4"
        style={{ background: data.accent + '22', color: data.accent }}>
        {data.chapter}
      </span>
      <h3 className="text-2xl font-black text-[#082F49] leading-snug mb-4">{data.title}</h3>
      <div className="w-10 h-[3px] rounded-full mb-5" style={{ background: data.accent }} />
      <p className="text-[#334155] text-base leading-relaxed flex-1">{data.body}</p>
      <div className="mt-6 px-5 py-4 rounded-[16px]"
        style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${data.accent}28` }}>
        <p className="text-sm font-bold" style={{ color: data.accent }}>{data.fact}</p>
      </div>
      <p className="mt-4 text-right text-[11px] font-bold" style={{ color: data.accent + '70' }}>— {data.pageNum} —</p>
    </div>
  );
}

function DarkBlankPage() {
  return (
    <div className="w-full h-full flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0d2b5c 0%, #112250 100%)' }}>
      <span className="text-white/5 text-[120px]">📖</span>
    </div>
  );
}

function PreviousPageHint() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <p className="text-slate-300 text-sm font-medium">← Bìa sách</p>
    </div>
  );
}

function BlankPage() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <span className="text-slate-200 text-7xl">📄</span>
    </div>
  );
}
