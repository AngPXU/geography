'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PresentationPreview } from './PresentationPreview';
import { RichTextEditor } from './RichTextEditor';
import dynamic from 'next/dynamic';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });

type BlockType = 'heading' | 'text' | 'funFact' | 'mapAction' | 'quiz' | 'objectives' | 'imageScenario' | 'dataTable';

interface StoryBlock {
  id: string;
  type: BlockType;
  // Common
  content?: string;
  // Heading
  level?: 1 | 2 | 3;
  // FunFact
  title?: string;
  // Quiz
  question?: string;
  options?: string[];
  correctIndex?: number;
  // MapAction
  lat?: number;
  lng?: number;
  zoom?: number;
  description?: string;
  showGrid?: boolean;
  showAnnotations?: boolean; // Dùng cho tương thích ngược
  annotationPreset?: string; // none, latlng, continents
  showPin?: boolean;
  pinTitle?: string;
  pinInfo?: string;
  pinImage?: string;
  // ImageScenario
  imageUrl?: string;
  imageUrls?: string[];
  // DataTable
  tableTitle?: string;
  tableHeaders?: string[];
  tableRows?: string[][];
  tableHighlightCol?: number;
  tableUnit?: string;
  // Globe Style
  globeStyle?: string;
}

function ImageSlider({ urls }: { urls: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [urls.join(',')]);

  if (!urls || urls.length === 0) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
      <span className="text-4xl mb-2">🖼️</span>
      <span className="text-sm font-bold">Chưa có hình ảnh</span>
    </div>
  );

  return (
    <div className="w-full h-full relative group bg-white flex items-center justify-center pointer-events-auto">
      <img 
        src={urls[currentIndex]} 
        alt="Minh họa" 
        className="w-full h-full object-contain p-2"
        key={currentIndex}
      />
      {urls.length > 1 && (
        <>
          <button 
            onClick={() => setCurrentIndex(prev => prev === 0 ? urls.length - 1 : prev - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ←
          </button>
          <button 
            onClick={() => setCurrentIndex(prev => prev === urls.length - 1 ? 0 : prev + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 hover:bg-white text-slate-800 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            →
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white/50 backdrop-blur-md px-2 py-1 rounded-full">
            {urls.map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-emerald-500 w-4' : 'bg-slate-400 w-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface Props {
  user?: any;
  presentationId?: string;
  onBack?: () => void;
}

const ANNOTATION_PRESETS: Record<string, any[]> = {
  'none': [],
  'latlng': [
    { lat: 0, lng: 90, label: 'Xích đạo (Vĩ tuyến gốc)', isAnnotation: true, color: 'text-red-500' },
    { lat: 45, lng: 0, label: 'Kinh tuyến gốc', isAnnotation: true, color: 'text-blue-600' },
    { lat: 30, lng: 45, label: 'Vĩ tuyến Bắc', isAnnotation: true, color: 'text-slate-700' },
    { lat: -30, lng: 45, label: 'Vĩ tuyến Nam', isAnnotation: true, color: 'text-slate-700' },
    { lat: 15, lng: 45, label: 'Kinh tuyến Đông', isAnnotation: true, color: 'text-slate-700' },
    { lat: 15, lng: -45, label: 'Kinh tuyến Tây', isAnnotation: true, color: 'text-slate-700' },
    { lat: 20, lng: 0, label: '20°B', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: 40, lng: 0, label: '40°B', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: 60, lng: 0, label: '60°B', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: -20, lng: 0, label: '20°N', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: -40, lng: 0, label: '40°N', isAnnotation: true, isSmall: true, color: 'text-red-400' },
    { lat: 0, lng: 20, label: '20°Đ', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: 40, label: '40°Đ', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: 60, label: '60°Đ', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: -20, label: '20°T', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
    { lat: 0, lng: -40, label: '40°T', isAnnotation: true, isSmall: true, color: 'text-blue-400' },
  ],
  'continents': [
    { lat: 45, lng: 10, label: 'Châu Âu', isAnnotation: true, color: 'text-emerald-700' },
    { lat: 10, lng: 20, label: 'Châu Phi', isAnnotation: true, color: 'text-orange-700' },
    { lat: 40, lng: 100, label: 'Châu Á', isAnnotation: true, color: 'text-rose-700' },
    { lat: 45, lng: -100, label: 'Bắc Mỹ', isAnnotation: true, color: 'text-blue-700' },
    { lat: -15, lng: -60, label: 'Nam Mỹ', isAnnotation: true, color: 'text-green-700' },
    { lat: -25, lng: 135, label: 'Châu Đại Dương', isAnnotation: true, color: 'text-purple-700' },
    { lat: -80, lng: 0, label: 'Châu Nam Cực', isAnnotation: true, color: 'text-slate-700' },
  ],
  'oceans': [
    { lat: 0, lng: -150, label: 'Thái Bình Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: 0, lng: 150, label: 'Thái Bình Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: 0, lng: -30, label: 'Đại Tây Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: -10, lng: 70, label: 'Ấn Độ Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: 80, lng: 0, label: 'Bắc Băng Dương', isAnnotation: true, color: 'text-cyan-700' },
    { lat: -60, lng: 0, label: 'Nam Đại Dương', isAnnotation: true, color: 'text-cyan-700' },
  ]
};

export function PresentationBuilderClient({ user, presentationId, onBack }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [blocks, setBlocks] = useState<StoryBlock[]>([
    {
      id: 'b1', type: 'heading', level: 1,
      content: 'Tiêu đề bài giảng mới'
    }
  ]);

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [presentationTitle, setPresentationTitle] = useState('Đang tải...');

  // Auto scroll to bottom when adding new block
  const endOfListRef = useRef<HTMLDivElement>(null);
  const builderGlobeRef = useRef<any>(null);

  useEffect(() => {
    // Load specific presentation on mount if presentationId exists
    if (presentationId) {
      fetch(`/api/presentations?id=${presentationId}`)
        .then(res => res.json())
        .then(data => {
          if (data.presentation) {
            if (data.presentation.blocks && data.presentation.blocks.length > 0) {
              setBlocks(data.presentation.blocks);
            }
            if (data.presentation.title) {
              setPresentationTitle(data.presentation.title);
            }
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setPresentationTitle('Bài giảng mới');
      setIsLoading(false);
    }
  }, [presentationId]);

  const activeBlock = blocks.find(b => b.id === activeBlockId);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (builderGlobeRef.current && activeBlock) {
        builderGlobeRef.current.flyTo(
          activeBlock.lat || 0,
          activeBlock.lng || 0,
          Math.max(0.1, 5 / (activeBlock.zoom || 5)) * 4000000,
          1
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeBlock?.lat, activeBlock?.lng, activeBlock?.zoom, activeBlock?.id, activeBlock?.type]);

  // Khởi tạo tâm mặc định ở Việt Nam khi mới vào trang (nếu chưa chọn khối bản đồ nào)
  useEffect(() => {
    const initInterval = setInterval(() => {
      if (builderGlobeRef.current && (!activeBlock || activeBlock.type !== 'mapAction')) {
        builderGlobeRef.current.flyTo(16.0, 106.0, 8000000, 2);
        clearInterval(initInterval);
      } else if (builderGlobeRef.current && activeBlock?.type === 'mapAction') {
        clearInterval(initInterval); // Đã có mapAction thì không set default nữa
      }
    }, 200);
    return () => clearInterval(initInterval);
  }, []);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/presentations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: presentationId, // Để API biết là Cập nhật hay Tạo mới
          title: presentationTitle,
          blocks
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('🎉 Đã xuất bản Bài giảng thành công vào Cơ sở dữ liệu!');
      } else {
        alert('❌ Lỗi xuất bản: ' + data.error);
      }
    } catch (err) {
      alert('❌ Lỗi kết nối Server!');
    } finally {
      setIsPublishing(false);
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: StoryBlock = {
      id: Date.now().toString(),
      type,
      content: (type === 'text' || type === 'objectives' || type === 'imageScenario') ? '' : undefined,
      level: type === 'heading' ? 2 : undefined,
      title: type === 'funFact' ? 'Em có biết?' : undefined,
      imageUrl: type === 'imageScenario' ? '' : undefined,
      question: type === 'quiz' ? 'Câu hỏi mới?' : undefined,
      options: type === 'quiz' ? ['Đáp án 1', 'Đáp án 2'] : undefined,
      correctIndex: type === 'quiz' ? 0 : undefined,
      lat: type === 'mapAction' ? 16.0 : undefined,
      lng: type === 'mapAction' ? 106.0 : undefined,
      zoom: type === 'mapAction' ? 5 : undefined,
      description: type === 'mapAction' ? 'Mô tả hành động bản đồ...' : undefined,
      showGrid: type === 'mapAction' ? false : undefined,
      annotationPreset: type === 'mapAction' ? 'none' : undefined,
      showPin: type === 'mapAction' ? false : undefined,
      pinTitle: type === 'mapAction' ? '' : undefined,
      pinInfo: type === 'mapAction' ? '' : undefined,
      pinImage: type === 'mapAction' ? '' : undefined,
      globeStyle: type === 'mapAction' ? 'esri-imagery' : undefined,
      // DataTable defaults
      tableTitle: type === 'dataTable' ? 'Bảng số liệu' : undefined,
      tableHeaders: type === 'dataTable' ? ['Khu vực', 'Diện tích (km²)', 'Dân số (triệu)'] : undefined,
      tableRows: type === 'dataTable' ? [['Châu Á', '44.614.000', '4.700'],['Châu Phi', '30.370.000', '1.400'],['Châu Âu', '10.530.000', '746']] : undefined,
      tableHighlightCol: type === 'dataTable' ? 2 : undefined,
      tableUnit: type === 'dataTable' ? '' : undefined,
    };
    setBlocks([...blocks, newBlock]);
    setActiveBlockId(newBlock.id);
    
    setTimeout(() => {
      endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const updateBlock = (id: string, updates: Partial<StoryBlock>) => {
    setBlocks(prevBlocks => prevBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (activeBlockId === id) setActiveBlockId(null);
  };

  const moveBlock = (id: string, direction: 'up' | 'down') => {
    const index = blocks.findIndex(b => b.id === id);
    if (index < 0) return;
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index + 1], newBlocks[index]] = [newBlocks[index], newBlocks[index + 1]];
      setBlocks(newBlocks);
    }
  };

  // ── RENDERERS ──

  const renderBlockEditor = (block: StoryBlock) => {
    const isActive = activeBlockId === block.id;

    return (
      <div 
        key={block.id} 
        onClick={() => setActiveBlockId(block.id)}
        className={`group relative rounded-2xl transition-all duration-300 border-2
          ${isActive ? 'border-cyan-400 bg-white shadow-lg p-5 scale-[1.02] z-10' : 'border-transparent bg-white/50 hover:bg-white/80 hover:border-slate-200 p-4'}`}
      >
        {/* Floating actions */}
        <div className={`absolute -right-3 -top-3 flex flex-col gap-1 bg-white p-1 rounded-xl shadow-lg border border-slate-100 transition-opacity z-20 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center font-bold" title="Xóa">✕</button>
          <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center" title="Lên">↑</button>
          <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center" title="Xuống">↓</button>
        </div>

        {/* HEADING BLOCK */}
        {block.type === 'heading' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 mb-2">
               {[1, 2, 3].map(lvl => (
                 <button 
                   key={lvl}
                   onClick={() => updateBlock(block.id, { level: lvl as any })}
                   className={`px-3 py-1 text-xs font-bold rounded-md ${block.level === lvl ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                 >H{lvl}</button>
               ))}
            </div>
            <input 
              type="text" 
              value={block.content || ''} 
              onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder={`Tiêu đề H${block.level}...`}
              className={`w-full bg-transparent outline-none font-black text-[#082F49] ${block.level === 1 ? 'text-4xl' : block.level === 2 ? 'text-2xl border-b-2 border-cyan-200 pb-2' : 'text-xl text-cyan-700'}`}
            />
          </div>
        )}

        {/* TEXT BLOCK */}
        {block.type === 'text' && (
          <RichTextEditor
            value={block.content || ''}
            onChange={(html) => updateBlock(block.id, { content: html })}
            placeholder="Gõ nội dung văn bản..."
          />
        )}

        {/* FUN FACT BLOCK */}
        {block.type === 'funFact' && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-cyan-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-cyan-400"></div>
            <input 
              type="text"
              value={block.title || ''}
              onChange={e => updateBlock(block.id, { title: e.target.value })}
              className="w-full bg-transparent outline-none font-bold text-cyan-700 mb-2"
              placeholder="Tiêu đề hộp nổi bật..."
            />
            <textarea 
              value={block.content || ''} 
              onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder="Nội dung thú vị..."
              className="w-full bg-transparent outline-none resize-none text-[#082F49] font-medium min-h-[60px]"
            />
          </div>
        )}

        {/* IMAGE SCENARIO BLOCK */}
        {block.type === 'imageScenario' && (
          <div className="bg-white border-2 border-emerald-400 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">🏃</div>
               <h4 className="font-bold text-emerald-700">Tình huống / Trích dẫn minh họa</h4>
            </div>
            <textarea 
              value={block.content || ''} 
              onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder="Nhập nội dung tình huống (VD: Ngày nay, các con tàu ra khơi...)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none resize-none text-[#082F49] font-medium min-h-[80px] focus:border-emerald-400"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <div className="mt-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Link hình ảnh (Nhập nhiều link, mỗi link 1 dòng để tạo Slide)</label>
              <textarea 
                value={block.imageUrls?.join('\n') || block.imageUrl || ''}
                onChange={e => updateBlock(block.id, { 
                  imageUrls: e.target.value.split('\n').map(u => u.trim()).filter(Boolean),
                  imageUrl: undefined 
                })}
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-emerald-400 min-h-[80px]"
              />
            </div>
          </div>
        )}

        {/* OBJECTIVES BLOCK */}
        {block.type === 'objectives' && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-orange-400"></div>
            <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2 text-lg">
              <span>🎯</span> Học xong bài này, em sẽ:
            </h4>
            <textarea 
              value={block.content || ''} 
              onChange={e => updateBlock(block.id, { content: e.target.value })}
              placeholder="Nhập mục tiêu (mỗi mục tiêu một dòng)..."
              className="w-full bg-transparent outline-none resize-none text-[#082F49] font-medium min-h-[80px]"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>
        )}

        {/* MAP ACTION BLOCK */}
        {block.type === 'mapAction' && (
          <div className="bg-slate-800 rounded-2xl p-6 text-white flex gap-6 items-center shadow-inner relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/40 to-transparent pointer-events-none"></div>
             
             <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-cyan-400 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(34,211,238,0.3)] z-10">
               🌍
             </div>
             
             <div className="flex-1 z-10 flex flex-col gap-3">
               <div className="flex items-center gap-2">
                 <span className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Hành động Bản đồ</span>
                 <input 
                    type="text" 
                    value={block.description || ''}
                    onChange={e => updateBlock(block.id, { description: e.target.value })}
                    className="flex-1 bg-transparent border-b border-slate-600 outline-none text-sm font-medium focus:border-cyan-400"
                    placeholder="Mô tả hành động (vd: Xoay đến VN)..."
                 />
               </div>
               
               <div className="grid grid-cols-3 gap-3">
                 <div className="flex flex-col">
                   <label className="text-[10px] text-slate-400 font-bold mb-1">VĨ ĐỘ (LAT)</label>
                   <input type="number" step="0.0001" value={block.lat} onChange={e => updateBlock(block.id, { lat: parseFloat(e.target.value) })} className="bg-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-cyan-400 font-mono" />
                 </div>
                 <div className="flex flex-col">
                   <label className="text-[10px] text-slate-400 font-bold mb-1">KINH ĐỘ (LNG)</label>
                   <input type="number" step="0.0001" value={block.lng} onChange={e => updateBlock(block.id, { lng: parseFloat(e.target.value) })} className="bg-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-cyan-400 font-mono" />
                 </div>
                 <div className="flex flex-col">
                   <label className="text-[10px] text-slate-400 font-bold mb-1">ZOOM ({block.zoom})</label>
                   <input type="range" min="1" max="15" value={block.zoom} onChange={e => updateBlock(block.id, { zoom: parseInt(e.target.value) })} className="mt-2 accent-cyan-400" />
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={block.showGrid || false} onChange={e => updateBlock(block.id, { showGrid: e.target.checked })} className="w-5 h-5 accent-emerald-500 rounded" />
                  <span className="font-bold text-[#082F49] text-sm">🌐 Bật Lưới Tọa độ</span>
                </label>
                <div className="flex flex-col">
                  <select 
                    value={block.annotationPreset || (block.showAnnotations ? 'latlng' : 'none')} 
                    onChange={e => updateBlock(block.id, { annotationPreset: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 outline-none text-sm focus:border-emerald-400 text-slate-700 font-bold h-full cursor-pointer"
                  >
                    <option value="none">Không có Chú thích</option>
                    <option value="latlng">Hệ thống Kinh/Vĩ tuyến</option>
                    <option value="continents">Tên các Châu lục</option>
                    <option value="oceans">Tên các Đại dương</option>
                  </select>
                </div>
               </div>

               {/* Hint text for grid/annotation */}
               <p className="text-[10px] text-slate-400 leading-relaxed italic mb-2 px-1">
                 💡 Trên Trái Đất có 360 kinh tuyến, gồm 180 đường ở bán cầu Đông và 180 đường ở bán cầu Tây. Mỗi kinh tuyến giao vuông góc với các vĩ tuyến, tạo thành lưới Kinh – Vĩ giúp xác định chính xác vị trí bất kỳ trên bề mặt Trái Đất.
               </p>
               <div className="mt-2 flex flex-col gap-2 bg-slate-700/50 p-3 rounded-lg">
                 <div className="flex items-center gap-2">
                   <input 
                     type="checkbox" 
                     id={`pin-${block.id}`}
                     checked={block.showPin || false}
                     onChange={e => updateBlock(block.id, { showPin: e.target.checked })}
                     className="w-4 h-4 accent-cyan-400"
                   />
                   <label htmlFor={`pin-${block.id}`} className="text-xs text-cyan-100 font-bold cursor-pointer">
                     Thả Ghim (Pin) và Hiện Popup thông tin
                   </label>
                 </div>

                 {block.showPin && (
                   <div className="flex flex-col gap-2 mt-2 pl-6 border-l-2 border-cyan-500/30">
                     <input type="text" value={block.pinTitle || ''} onChange={e => updateBlock(block.id, { pinTitle: e.target.value })} placeholder="Tiêu đề (VD: Đài Greenwich)" className="bg-slate-800 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-cyan-400 text-white" />
                     <textarea value={block.pinInfo || ''} onChange={e => updateBlock(block.id, { pinInfo: e.target.value })} placeholder="Nội dung giới thiệu chi tiết..." className="bg-slate-800 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-cyan-400 text-white min-h-[50px] resize-none custom-scrollbar" />
                     <input type="text" value={block.pinImage || ''} onChange={e => updateBlock(block.id, { pinImage: e.target.value })} placeholder="URL Ảnh minh họa (tùy chọn)" className="bg-slate-800 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-cyan-400 text-white" />
                   </div>
                 )}
               </div>
             </div>
          </div>
        )}

        {/* DATA TABLE BLOCK */}
        {block.type === 'dataTable' && (
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <input
                type="text"
                value={block.tableTitle || ''}
                onChange={e => updateBlock(block.id, { tableTitle: e.target.value })}
                className="flex-1 bg-transparent outline-none font-black text-violet-800 text-lg border-b border-violet-200 focus:border-violet-500"
                placeholder="Tiêu đề bảng số liệu..."
              />
            </div>

            {/* Headers row */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-violet-100">
                    {(block.tableHeaders || []).map((h, ci) => (
                      <th key={ci} className="p-2 text-left">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={h}
                            onChange={e => {
                              const hs = [...(block.tableHeaders || [])];
                              hs[ci] = e.target.value;
                              updateBlock(block.id, { tableHeaders: hs });
                            }}
                            className="bg-transparent outline-none font-black text-violet-700 w-full min-w-[80px]"
                            placeholder={`Cột ${ci + 1}`}
                          />
                          {(block.tableHeaders || []).length > 1 && (
                            <button
                              onClick={() => {
                                const hs = (block.tableHeaders || []).filter((_, i) => i !== ci);
                                const rows = (block.tableRows || []).map(r => r.filter((_, i) => i !== ci));
                                updateBlock(block.id, { tableHeaders: hs, tableRows: rows });
                              }}
                              className="text-red-400 hover:text-red-600 font-bold shrink-0"
                              title="Xóa cột"
                            >✕</button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-2">
                      <button
                        onClick={() => {
                          const hs = [...(block.tableHeaders || []), 'Cột mới'];
                          const rows = (block.tableRows || []).map(r => [...r, '']);
                          updateBlock(block.id, { tableHeaders: hs, tableRows: rows });
                        }}
                        className="text-violet-500 hover:text-violet-700 font-bold text-lg"
                        title="Thêm cột"
                      >+</button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(block.tableRows || []).map((row, ri) => (
                    <tr key={ri} className="border-t border-violet-100 even:bg-violet-50/50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="p-1">
                          <input
                            type="text"
                            value={cell}
                            onChange={e => {
                              const rows = (block.tableRows || []).map((r, i) =>
                                i === ri ? r.map((c, j) => j === ci ? e.target.value : c) : r
                              );
                              updateBlock(block.id, { tableRows: rows });
                            }}
                            className="bg-white/70 border border-violet-100 rounded px-2 py-1 outline-none w-full text-[#334155] focus:border-violet-400"
                          />
                        </td>
                      ))}
                      <td className="p-1">
                        <button
                          onClick={() => updateBlock(block.id, { tableRows: (block.tableRows || []).filter((_, i) => i !== ri) })}
                          className="text-red-400 hover:text-red-600 font-bold px-1"
                          title="Xóa hàng"
                        >✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-violet-200">
              <button
                onClick={() => {
                  const emptyRow = (block.tableHeaders || []).map(() => '');
                  updateBlock(block.id, { tableRows: [...(block.tableRows || []), emptyRow] });
                }}
                className="text-sm font-bold text-violet-600 hover:text-violet-800 px-3 py-1.5 bg-white rounded-lg border border-violet-200 hover:border-violet-400 transition-all"
              >+ Thêm hàng</button>

              <div className="flex items-center gap-2 text-sm">
                <label className="font-bold text-violet-700">Cột nổi bật (thanh bar):</label>
                <select
                  value={block.tableHighlightCol ?? 1}
                  onChange={e => updateBlock(block.id, { tableHighlightCol: parseInt(e.target.value) })}
                  className="bg-white border border-violet-200 rounded-lg px-2 py-1 outline-none text-sm font-bold text-violet-700 focus:border-violet-500"
                >
                  {(block.tableHeaders || []).map((h, i) => (
                    <option key={i} value={i}>{h || `Cột ${i + 1}`}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <label className="font-bold text-violet-700">Đơn vị:</label>
                <input
                  type="text"
                  value={block.tableUnit || ''}
                  onChange={e => updateBlock(block.id, { tableUnit: e.target.value })}
                  placeholder="VD: triệu người"
                  className="bg-white border border-violet-200 rounded-lg px-2 py-1 outline-none text-sm focus:border-violet-500 w-32"
                />
              </div>
            </div>
          </div>
        )}

        {/* QUIZ BLOCK */}
        {block.type === 'quiz' && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">❓</span>
              <input 
                type="text" 
                value={block.question || ''} 
                onChange={e => updateBlock(block.id, { question: e.target.value })}
                className="w-full bg-transparent outline-none font-black text-orange-800 text-lg border-b border-orange-200 focus:border-orange-400"
                placeholder="Nhập câu hỏi..."
              />
            </div>
            
            <div className="space-y-2">
              {block.options?.map((opt, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${block.correctIndex === idx ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-orange-100 text-[#082F49]'}`}>
                   <input 
                     type="radio" 
                     name={`quiz-${block.id}`}
                     checked={block.correctIndex === idx}
                     onChange={() => updateBlock(block.id, { correctIndex: idx })}
                     className="w-4 h-4 accent-orange-100"
                   />
                   <input 
                     type="text"
                     value={opt}
                     onChange={(e) => {
                       const newOpts = [...(block.options || [])];
                       newOpts[idx] = e.target.value;
                       updateBlock(block.id, { options: newOpts });
                     }}
                     className="flex-1 bg-transparent outline-none font-medium"
                     placeholder={`Đáp án ${idx + 1}`}
                   />
                   {block.options!.length > 2 && (
                     <button onClick={() => updateBlock(block.id, { options: block.options?.filter((_, i) => i !== idx) })} className="opacity-50 hover:opacity-100">✕</button>
                   )}
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => updateBlock(block.id, { options: [...(block.options || []), 'Đáp án mới'] })}
              className="mt-4 text-xs font-bold text-orange-600 hover:text-orange-800"
            >+ Thêm lựa chọn</button>
          </div>
        )}
      </div>
    );
  };

  const glassPanel = "bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(14,165,233,0.1)] rounded-[24px]";

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex gap-6 p-6 bg-gradient-to-br from-[#E0F2FE] via-white to-[#DCFCE7] animate-in zoom-in-95 duration-500">
      
      {/* ── LEFT: ARTICLE BUILDER (Notion-style) ── */}
      <div className={`flex-1 flex flex-col ${glassPanel} overflow-hidden relative`}>
        {/* Header */}
        <div className="px-8 py-5 border-b border-white/60 bg-white/40 flex items-center justify-between z-10 relative">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 bg-white/50 hover:bg-cyan-100 rounded-lg text-slate-500 hover:text-cyan-600 transition-colors font-bold"
                title="Quay lại danh sách"
              >
                ← Trở về
              </button>
            )}
            <div>
              <input 
                type="text" 
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                className="text-2xl font-black text-[#082F49] bg-transparent outline-none border-b-2 border-transparent focus:border-cyan-400 focus:bg-white/50 rounded transition-all w-[500px]"
              />
              <p className="text-sm text-slate-500 font-medium">Viết nội dung như một bài báo tương tác (Scrollytelling)</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPreview(true)}
              className="px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Trình chiếu
            </button>
            <button 
              onClick={handlePublish}
              disabled={isPublishing}
              className={`px-6 py-2.5 rounded-full text-white font-bold text-sm shadow-md transition-all ${isPublishing ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#06B6D4] hover:bg-[#0369A1]'}`}
            >
              {isPublishing ? 'Đang lưu...' : 'Lưu dữ liệu'}
            </button>
          </div>
        </div>

        {/* Editor Stream */}
        <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar scroll-smooth">
          <div className="w-full space-y-6 pb-32">
            
            {blocks.map(block => renderBlockEditor(block))}
            
            <div ref={endOfListRef} />
            
            {/* ADD BLOCK TOOLBAR */}
            <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-200">
              <p className="text-center text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Thêm nội dung mới</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => addBlock('heading')} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-[#082F49] font-bold text-sm hover:border-cyan-400 hover:text-cyan-600 transition-all">T Tiêu đề</button>
                <button onClick={() => addBlock('text')} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-[#082F49] font-bold text-sm hover:border-cyan-400 hover:text-cyan-600 transition-all">📝 Văn bản</button>
                <button onClick={() => addBlock('imageScenario')} className="px-4 py-2 bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 text-emerald-700 font-bold text-sm hover:border-emerald-400 hover:bg-emerald-100 transition-all">🖼️ Tình huống có Ảnh</button>
                <button onClick={() => addBlock('objectives')} className="px-4 py-2 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-amber-700 font-bold text-sm hover:border-amber-400 hover:bg-amber-100 transition-all">🎯 Mục tiêu bài học</button>
                <button onClick={() => addBlock('funFact')} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-[#082F49] font-bold text-sm hover:border-blue-400 hover:text-blue-600 transition-all">💡 Có thể em chưa biết</button>
                <button onClick={() => addBlock('mapAction')} className="px-4 py-2 bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 text-emerald-700 font-bold text-sm hover:border-emerald-400 hover:bg-emerald-100 transition-all">🌍 Hành động Bản đồ</button>
                <button onClick={() => addBlock('quiz')} className="px-4 py-2 bg-orange-50 rounded-xl shadow-sm border border-orange-200 text-orange-700 font-bold text-sm hover:border-orange-400 hover:bg-orange-100 transition-all">❓ Câu hỏi đan xen</button>
                <button onClick={() => addBlock('dataTable')} className="px-4 py-2 bg-violet-50 rounded-xl shadow-sm border border-violet-200 text-violet-700 font-bold text-sm hover:border-violet-400 hover:bg-violet-100 transition-all">📊 Bảng số liệu</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: REAL MAP PREVIEW ── */}
      <div className={`w-[420px] flex flex-col p-0 ${glassPanel} bg-gradient-to-b from-slate-900 to-[#082F49] text-white relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-4 px-2 pointer-events-none">
          <h3 className="font-black text-cyan-400 uppercase tracking-wider text-xs">Mô phỏng Đa phương tiện</h3>
          <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-red-500"></div>
             <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden pointer-events-auto bg-slate-900">
            
            {/* LỚP 1: CESIUM GLOBE */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${(!activeBlock || activeBlock.type === 'mapAction' || (!activeBlock.imageUrl && activeBlock.type !== 'imageScenario')) ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <CesiumGlobe
                ref={builderGlobeRef}
                imageryLayer={
                  activeBlock?.globeStyle || 
                  (blocks.find(b => b.globeStyle)?.globeStyle) || 
                  'Bing Maps Aerial'
                }
                showGrid={activeBlock?.showGrid || false}
                onLayerChange={(id) => {
                  // Cập nhật bản đồ cho TOÀN BỘ các khối để nó trở thành cài đặt toàn cục (Global)
                  setBlocks(prevBlocks => prevBlocks.map(b => ({ ...b, globeStyle: id })));
                }}
              />
            </div>

            {/* LỚP 2: HÌNH ẢNH */}            {/* LỚP 2: HÌNH ẢNH */}
            <div className={`absolute inset-0 transition-opacity duration-700 bg-transparent ${((activeBlock?.type === 'imageScenario' && (activeBlock.imageUrls?.length || activeBlock.imageUrl)) || activeBlock?.imageUrl) ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <ImageSlider urls={activeBlock?.imageUrls || (activeBlock?.imageUrl ? [activeBlock.imageUrl] : [])} />
            </div>

          </div>
        </div>

        <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 pointer-events-none">
          <h4 className="text-xs font-bold text-slate-300 uppercase mb-2">Trạng thái hiện tại</h4>
          {activeBlock?.type === 'mapAction' ? (
            <div className="space-y-1">
               <p className="text-sm font-bold text-cyan-300">Đang thực thi Hành động Bản đồ!</p>
               <p className="text-xs text-slate-400">Hệ thống sẽ tự động xoay bản đồ của học sinh đến:</p>
               <div className="flex justify-between font-mono text-xs mt-2 bg-black/30 p-2 rounded">
                 <span>Lat: {activeBlock.lat}</span>
                 <span>Lng: {activeBlock.lng}</span>
               </div>
            </div>
          ) : activeBlock?.type === 'imageScenario' ? (
            <p className="text-xs text-slate-400 leading-relaxed">
              Khung bên phải đang hiển thị <b>Hình ảnh minh họa</b> thay vì Quả cầu 3D. Hiệu ứng làm mờ chéo (cross-fade) sẽ tự động kích hoạt khi học sinh cuộn trang.
            </p>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              Trạng thái chờ. Khi học sinh cuộn đến các Khối "Hành động Bản đồ" hoặc "Tình huống có Ảnh", khung bên phải sẽ mượt mà chuyển đổi hiển thị tương ứng.
            </p>
          )}
        </div>
      </div>
      
      {showPreview && <PresentationPreview blocks={blocks} onClose={() => setShowPreview(false)} />}
    </div>,
    document.body
  );
}
