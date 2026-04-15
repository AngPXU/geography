'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Import thư viện động để tránh lỗi SSR trong Next.js do thư viện dùng WebGL trực tiếp
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export function EarthGlobe() {
  const [mounted, setMounted] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4; // Quay chậm lại xíu
      controls.enableZoom = false;
      globeRef.current.pointOfView({ altitude: 1.5 }); // Phóng to trái đất lên
    }
  }, [mounted]);

  // Nếu User bấm vào marker, xoay quả địa cầu tĩnh lại ngay vị trí đó
  const handleLocationClick = (loc: any) => {
    setSelectedLocation(loc);
    if (globeRef.current) {
      // Phóng to một chút khi chọn quốc gia
      globeRef.current.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.0 }, 1000);
      globeRef.current.controls().autoRotate = false; // Dừng lại để xem cho dễ
    }
  };

  const handleClosePanel = () => {
    setSelectedLocation(null);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true; // Xoay tiếp
      globeRef.current.pointOfView({ altitude: 1.5 }, 1000); // Trả về độ zoom ban đầu
    }
  };

  if (!mounted) {
    return (
      <div className="w-full max-w-[600px] aspect-square relative mx-auto flex items-center justify-center">
        <div className="w-32 h-32 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Dữ liệu các đánh dấu (Markers) trên bản đồ với thông tin chi tiết
  const gData = [
    {
    lat: 21.0285, lng: 105.8542, size: 0.1, color: '#ec4899',
    name: 'Việt Nam', cap: 'Hà Nội', pop: '100 Triệu',
    desc: 'Quốc gia hình chữ S với 3260km bờ biển tuyệt đẹp, nền ẩm thực đường phố nức tiếng thế giới và bề dày lịch sử ngàn năm văn hiến.'
  },
    {
    lat: 38.8951, lng: -77.0364, size: 0.1, color: '#3b82f6',
    name: 'Hoa Kỳ', cap: 'Washington, D.C.', pop: '335 Triệu',
    desc: 'Cường quốc có nền kinh tế lớn nhất thế giới, nổi bật với sự đa dạng văn hóa và các cảnh quan thiên nhiên hùng vĩ trải dài từ bờ Đông sang bờ Tây.'
  },
  {
    lat: 39.9042, lng: 116.4074, size: 0.1, color: '#ef4444',
    name: 'Trung Quốc', cap: 'Bắc Kinh', pop: '1.4 Tỷ',
    desc: 'Đất nước tỷ dân với nền văn minh rực rỡ lâu đời, sở hữu Vạn Lý Trường Thành kỳ vĩ và sự phát triển công nghệ vượt bậc.'
  },
  {
    lat: -15.7938, lng: -47.8827, size: 0.1, color: '#10b981',
    name: 'Brazil', cap: 'Brasília', pop: '215 Triệu',
    desc: 'Quê hương của vũ điệu Samba sôi động, những huyền thoại bóng đá và là nơi ôm trọn phần lớn rừng rậm nhiệt đới Amazon - lá phổi xanh của Trái Đất.'
  },
  {
    lat: -35.2809, lng: 149.1300, size: 0.1, color: '#f59e0b',
    name: 'Australia', cap: 'Canberra', pop: '26 Triệu',
    desc: 'Đảo quốc khổng lồ nằm giữa đại dương, nổi tiếng với những chú Kangaroo độc đáo, Nhà hát Con Sò và rạn san hô Great Barrier tuyệt mỹ.'
  },
  {
    lat: 30.0444, lng: 31.2357, size: 0.1, color: '#eab308',
    name: 'Ai Cập', cap: 'Cairo', pop: '111 Triệu',
    desc: 'Vùng đất huyền bí của các vị Pharaoh, gắn liền với dòng sông Nile vĩ đại và những Kim tự tháp ngàn năm tuổi đứng sừng sững giữa sa mạc.'
  },
  {
    lat: 28.6139, lng: 77.2090, size: 0.1, color: '#f97316',
    name: 'Ấn Độ', cap: 'New Delhi', pop: '1.4 Tỷ',
    desc: 'Quốc gia đông dân nhất nhì thế giới với nền văn hóa đa dạng, rực rỡ sắc màu, lăng Taj Mahal huyền thoại và dòng sông Hằng linh thiêng.'
  },
  {
    lat: 51.5072, lng: -0.1276, size: 0.1, color: '#6366f1',
    name: 'Vương quốc Anh', cap: 'London', pop: '67 Triệu',
    desc: 'Xứ sở sương mù với bề dày lịch sử, nơi khởi nguồn của cuộc Cách mạng Công nghiệp và nổi tiếng với tháp đồng hồ Big Ben.'
  },
  {
    lat: 55.7558, lng: 37.6173, size: 0.1, color: '#8b5cf6',
    name: 'Liên bang Nga', cap: 'Moscow', pop: '143 Triệu',
    desc: 'Quốc gia có diện tích lớn nhất thế giới, trải dài trên cả hai châu lục Á - Âu với thiên nhiên vô cùng phong phú và những mùa đông trắng tuyết.'
  },
  {
    lat: 45.4215, lng: -75.6972, size: 0.1, color: '#14b8a6',
    name: 'Canada', cap: 'Ottawa', pop: '39 Triệu',
    desc: 'Đất nước của những chiếc lá phong đỏ, vô số hồ nước ngọt trong xanh và những đỉnh núi phủ tuyết trắng thuộc dãy Rocky hùng vĩ.'
  },
  {
    lat: -25.7479, lng: 28.2293, size: 0.1, color: '#d946ef',
    name: 'Nam Phi', cap: 'Pretoria', pop: '60 Triệu',
    desc: 'Quốc gia nằm ở cực nam châu Phi, được mệnh danh là "Đất nước Cầu vồng" với hệ sinh thái hoang dã hoành tráng và mũi Hảo Vọng lịch sử.'
  }
  ];

  return (
    <div className="w-full max-w-[600px] aspect-square relative mx-auto flex items-center justify-center pointer-events-auto globe-container cursor-grab active:cursor-grabbing">

      {/* UI Info Panel - Hiển thị khi có selectedLocation */}
      {selectedLocation && (
        <div className="absolute top-[15%] md:-right-[10%] w-[260px] bg-white/85 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(8,47,73,0.15)] rounded-[24px] p-5 z-50 transition-all duration-300 animate-in fade-in zoom-in-95 cursor-auto">
          <button
            onClick={(e) => { e.stopPropagation(); handleClosePanel(); }}
            className="absolute top-4 right-4 w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-slate-200 flex items-center justify-center transition-colors font-bold text-xs"
          >
            ✕
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: selectedLocation.color }}></div>
            <h3 className="font-extrabold text-[#082F49] text-xl tracking-tight leading-none">{selectedLocation.name}</h3>
          </div>

          <div className="space-y-2 text-sm">
            <p className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-[#94A3B8] font-semibold">Thủ đô:</span>
              <span className="text-[#082F49] font-bold">{selectedLocation.cap}</span>
            </p>
            <p className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-[#94A3B8] font-semibold">Dân số:</span>
              <span className="text-[#082F49] font-bold">{selectedLocation.pop}</span>
            </p>
            <div className="mt-3 bg-blue-50/50 p-3 rounded-[12px] border border-blue-100/50">
              <p className="text-[#334155] text-xs leading-relaxed font-medium">
                {selectedLocation.desc}
              </p>
            </div>
          </div>
        </div>
      )}

      <Globe
        ref={globeRef}
        width={600}
        height={600}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="" // Nền trong suốt
        backgroundColor="rgba(0,0,0,0)" // Nền trong suốt
        showAtmosphere={true}
        atmosphereColor="#E0F2FE"
        atmosphereAltitude={0.2}

        globeMaterial={mounted ? undefined : {}}

        // Sử dụng Native WebGL Tags thay cho HTML Elements để các dấu chấm dính chặt lên mặt đất không bị lag/nhảy
        labelsData={gData}
        labelLat={(d: any) => d.lat}
        labelLng={(d: any) => d.lng}
        labelDotRadius={0.7} // Kích cỡ dấu chấm giữa
        labelColor={(d: any) => d.color}
        labelText={() => ''}
        onLabelClick={handleLocationClick}

        ringsData={gData}
        ringLat={(d: any) => d.lat}
        ringLng={(d: any) => d.lng}
        ringColor={(d: any) => d.color}
        ringMaxRadius={3} // Độ phóng to của sóng radar
        ringPropagationSpeed={2} // Tốc độ sóng
        ringRepeatPeriod={800} // Khoảng cách giữa các đợt sóng radar
        // @ts-expect-error - onRingClick có trong runtime nhưng thiếu trong typing
        onRingClick={handleLocationClick}
      />
      <style>{`
        .globe-container canvas {
          outline: none;
          filter: drop-shadow(0 20px 40px rgba(14,165,233,0.15));
        }
      `}</style>
    </div>
  );
}
