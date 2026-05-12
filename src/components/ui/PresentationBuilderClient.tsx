'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { PresentationPreview } from './PresentationPreview';
import { RichTextEditor } from './RichTextEditor';
import dynamic from 'next/dynamic';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });

import type { BlockType, StoryBlock } from '@/types/presentation';

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

// ────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL: Design system constants & ModuleShell
// Defined OUTSIDE the component to keep stable references across re-renders.
// If these were inside the component, every keystroke would redefine them,
// causing React to unmount/remount ModuleShell and lose input focus.
// ────────────────────────────────────────────────────────────────────────

type Accent =
  | 'cyan' | 'orange' | 'emerald' | 'amber' | 'violet' | 'indigo'
  | 'teal' | 'slate' | 'sky' | 'rose' | 'purple' | 'lime'
  | 'fuchsia' | 'stone' | 'red';

const ACCENT_MAP: Record<Accent, { iconBg: string; iconText: string; headerTint: string; headerBorder: string; typeText: string; dashBtn: string }> = {
  cyan:    { iconBg: 'bg-cyan-100',    iconText: 'text-cyan-600',    headerTint: 'from-cyan-50/80',    headerBorder: 'border-cyan-100/60',    typeText: 'text-cyan-600',    dashBtn: 'text-cyan-600 hover:text-cyan-800 border-cyan-300 hover:border-cyan-400 hover:bg-cyan-50' },
  orange:  { iconBg: 'bg-orange-100',  iconText: 'text-orange-600',  headerTint: 'from-orange-50/80',  headerBorder: 'border-orange-100/60',  typeText: 'text-orange-600',  dashBtn: 'text-orange-600 hover:text-orange-800 border-orange-300 hover:border-orange-400 hover:bg-orange-50' },
  emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', headerTint: 'from-emerald-50/80', headerBorder: 'border-emerald-100/60', typeText: 'text-emerald-600', dashBtn: 'text-emerald-600 hover:text-emerald-800 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50' },
  amber:   { iconBg: 'bg-amber-100',   iconText: 'text-amber-700',   headerTint: 'from-amber-50/80',   headerBorder: 'border-amber-100/60',   typeText: 'text-amber-700',   dashBtn: 'text-amber-700 hover:text-amber-900 border-amber-300 hover:border-amber-400 hover:bg-amber-50' },
  violet:  { iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  headerTint: 'from-violet-50/80',  headerBorder: 'border-violet-100/60',  typeText: 'text-violet-600',  dashBtn: 'text-violet-600 hover:text-violet-800 border-violet-300 hover:border-violet-400 hover:bg-violet-50' },
  indigo:  { iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600',  headerTint: 'from-indigo-50/80',  headerBorder: 'border-indigo-100/60',  typeText: 'text-indigo-600',  dashBtn: 'text-indigo-600 hover:text-indigo-800 border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50' },
  teal:    { iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    headerTint: 'from-teal-50/80',    headerBorder: 'border-teal-100/60',    typeText: 'text-teal-600',    dashBtn: 'text-teal-600 hover:text-teal-800 border-teal-300 hover:border-teal-400 hover:bg-teal-50' },
  slate:   { iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   headerTint: 'from-slate-50/80',   headerBorder: 'border-slate-100/60',   typeText: 'text-slate-600',   dashBtn: 'text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400 hover:bg-slate-50' },
  sky:     { iconBg: 'bg-sky-100',     iconText: 'text-sky-600',     headerTint: 'from-sky-50/80',     headerBorder: 'border-sky-100/60',     typeText: 'text-sky-600',     dashBtn: 'text-sky-600 hover:text-sky-800 border-sky-300 hover:border-sky-400 hover:bg-sky-50' },
  rose:    { iconBg: 'bg-rose-100',    iconText: 'text-rose-600',    headerTint: 'from-rose-50/80',    headerBorder: 'border-rose-100/60',    typeText: 'text-rose-600',    dashBtn: 'text-rose-600 hover:text-rose-800 border-rose-300 hover:border-rose-400 hover:bg-rose-50' },
  purple:  { iconBg: 'bg-purple-100',  iconText: 'text-purple-600',  headerTint: 'from-purple-50/80',  headerBorder: 'border-purple-100/60',  typeText: 'text-purple-600',  dashBtn: 'text-purple-600 hover:text-purple-800 border-purple-300 hover:border-purple-400 hover:bg-purple-50' },
  lime:    { iconBg: 'bg-lime-100',    iconText: 'text-lime-700',    headerTint: 'from-lime-50/80',    headerBorder: 'border-lime-100/60',    typeText: 'text-lime-700',    dashBtn: 'text-lime-700 hover:text-lime-900 border-lime-300 hover:border-lime-400 hover:bg-lime-50' },
  fuchsia: { iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-600', headerTint: 'from-fuchsia-50/80', headerBorder: 'border-fuchsia-100/60', typeText: 'text-fuchsia-600', dashBtn: 'text-fuchsia-600 hover:text-fuchsia-800 border-fuchsia-300 hover:border-fuchsia-400 hover:bg-fuchsia-50' },
  stone:   { iconBg: 'bg-stone-100',   iconText: 'text-stone-600',   headerTint: 'from-stone-50/80',   headerBorder: 'border-stone-100/60',   typeText: 'text-stone-600',   dashBtn: 'text-stone-600 hover:text-stone-800 border-stone-300 hover:border-stone-400 hover:bg-stone-50' },
  red:     { iconBg: 'bg-red-100',     iconText: 'text-red-600',     headerTint: 'from-red-50/80',     headerBorder: 'border-red-100/60',     typeText: 'text-red-600',     dashBtn: 'text-red-600 hover:text-red-800 border-red-300 hover:border-red-400 hover:bg-red-50' },
};

// Shared style tokens
const inputCls    = "w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#082F49] placeholder:text-[#94A3B8] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all duration-300";
const textareaCls = `${inputCls} resize-y min-h-[80px] leading-relaxed`;
const labelCls    = "text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] mb-1.5 block";
const subInputCls = "bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#082F49] placeholder:text-[#94A3B8] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all duration-300";
const removeBtnCls = "w-7 h-7 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all duration-300 shrink-0 font-bold text-xs";
const sectionCls  = "bg-slate-50/60 rounded-2xl p-5 border border-slate-200/60";

function ModuleShell({ icon, typeName, accent = 'cyan', title, titleSlot, headerRight, children }: {
  icon: React.ReactNode;
  typeName: string;
  accent?: Accent;
  title?: string;
  titleSlot?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = ACCENT_MAP[accent];
  return (
    <div className="rounded-[24px] bg-[rgba(255,255,255,0.75)] backdrop-blur-[20px] border border-[rgba(255,255,255,1)] shadow-[0_10px_30px_rgba(14,165,233,0.08)] overflow-hidden transition-all duration-300">
      <header className={`flex items-center gap-3 px-5 py-3 bg-gradient-to-r ${c.headerTint} to-transparent border-b ${c.headerBorder}`}>
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} ${c.iconText} flex items-center justify-center text-base shadow-sm shrink-0 font-black`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-black ${c.typeText} uppercase tracking-[0.18em] leading-none mb-1`}>{typeName}</p>
          {titleSlot || (title && <p className="text-sm font-bold text-[#082F49] truncate">{title}</p>)}
        </div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </header>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
}

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
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  // --- Helper Functions for Collapsed State ---
  const BLOCK_ICON_MAP: Record<string, string> = {
    heading: 'ph:text-t',
    text: 'ph:article',
    imageScenario: 'ph:image',
    objectives: 'ph:target',
    funFact: 'ph:lightbulb-filament',
    mapAction: 'ph:globe-hemisphere-east',
    quiz: 'ph:question',
    dataTable: 'ph:table',
    video: 'ph:video-camera',
    chart: 'ph:chart-bar',
    diagram: 'ph:puzzle-piece',
    compare: 'ph:scales',
    callout: 'ph:warning',
    timeline: 'ph:clock-counter-clockwise',
    groupActivity: 'ph:users-three',
    openQuestion: 'ph:pencil-line',
    fillBlank: 'ph:text-underline',
    quote: 'ph:quotes',
    glossary: 'ph:book-open-text',
    twoColumn: 'ph:columns',
    gallery: 'ph:images-square',
    summary: 'ph:clipboard-text',
  };
  const getBlockIcon = (type: string) => {
    return <Icon icon={BLOCK_ICON_MAP[type] || 'ph:file'} width={22} />;
  }

  const getBlockTypeName = (type: string) => {
    switch (type) {
      case 'heading': return 'Tiêu đề';
      case 'text': return 'Văn bản';
      case 'imageScenario': return 'Tình huống Ảnh';
      case 'objectives': return 'Mục tiêu';
      case 'funFact': return 'Có thể em chưa biết';
      case 'mapAction': return 'Bản đồ';
      case 'quiz': return 'Câu hỏi';
      case 'dataTable': return 'Bảng số liệu';
      // Phase 2
      case 'video': return 'Video';
      case 'chart': return 'Biểu đồ';
      case 'diagram': return 'Sơ đồ chú thích';
      case 'compare': return 'So sánh';
      case 'callout': return 'Ghi chú nổi bật';
      // Phase 3
      case 'timeline': return 'Đường thời gian';
      case 'groupActivity': return 'Hoạt động nhóm';
      case 'openQuestion': return 'Câu hỏi tự luận';
      case 'fillBlank': return 'Điền vào chỗ trống';
      case 'quote': return 'Trích dẫn';
      case 'glossary': return 'Từ vựng địa lý';
      case 'twoColumn': return '2 cột';
      case 'gallery': return 'Bộ sưu tập ảnh';
      case 'summary': return 'Tổng kết';
      default: return 'Khối nội dung';
    }
  }

  const getBlockExcerpt = (block: StoryBlock) => {
    if (block.type === 'heading') return block.content || '(Chưa có tiêu đề)';
    if (block.type === 'text') return block.content?.replace(/<[^>]+>/g, '').substring(0, 50) + '...' || '(Chưa có nội dung)';
    if (block.type === 'imageScenario') return block.content?.substring(0, 50) + '...' || '(Chưa có tình huống)';
    if (block.type === 'objectives') {
      if (block.items?.length) return `${block.items.length} mục tiêu: ${block.items[0]?.substring(0, 40) || ''}...`;
      return block.content?.substring(0, 50) + '...' || '(Chưa có mục tiêu)';
    }
    if (block.type === 'funFact') return `${block.emoji || '💡'} ${block.title || '(Chưa có tiêu đề)'}`;
    if (block.type === 'mapAction') return block.description || `Đến tọa độ ${block.lat || 0}, ${block.lng || 0}`;
    if (block.type === 'quiz') return block.question || '(Chưa có câu hỏi)';
    if (block.type === 'dataTable') return block.tableTitle || '(Chưa có tên bảng)';
    // Phase 2
    if (block.type === 'video') return block.title || block.videoUrl || '(Chưa có video)';
    if (block.type === 'chart') return `${block.chartType?.toUpperCase() || 'BAR'}: ${block.title || '(Chưa có biểu đồ)'}`;
    if (block.type === 'diagram') return block.title || `Sơ đồ (${block.diagramHotspots?.length || 0} chú thích)`;
    if (block.type === 'compare') return `So sánh ${block.compareColumns?.length || 0} mục: ${block.title || ''}`;
    if (block.type === 'callout') return `[${block.calloutVariant || 'info'}] ${block.title || block.content?.substring(0, 30) || '(Chưa có nội dung)'}`;
    // Phase 3
    if (block.type === 'timeline') return `${block.timelineEvents?.length || 0} sự kiện: ${block.title || ''}`;
    if (block.type === 'groupActivity') return block.title || block.activityGoal?.substring(0, 40) || '(Chưa có mục tiêu)';
    if (block.type === 'openQuestion') return block.question?.substring(0, 50) || '(Chưa có câu hỏi)';
    if (block.type === 'fillBlank') return block.blankTemplate?.substring(0, 50) || '(Chưa có câu)';
    if (block.type === 'quote') return `"${block.quoteText?.substring(0, 40) || '...'}"`;
    if (block.type === 'glossary') return `${block.glossaryTerms?.length || 0} thuật ngữ`;
    if (block.type === 'twoColumn') return `${block.title || '2 cột nội dung'}`;
    if (block.type === 'gallery') return `${block.galleryImages?.length || 0} ảnh: ${block.title || ''}`;
    if (block.type === 'summary') return block.title || 'Tổng kết bài học';
    return '';
  }
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
      if (builderGlobeRef.current && activeBlock && activeBlock.type === 'mapAction') {
        builderGlobeRef.current.flyTo(
          activeBlock.lat || 0,
          activeBlock.lng || 0,
          Math.max(0.1, 5 / (activeBlock.zoom || 5)) * 4000000,
          1
        );

        builderGlobeRef.current.clearPins();
        if (activeBlock.showPin) {
          builderGlobeRef.current.addPin(
            activeBlock.lat || 0, 
            activeBlock.lng || 0, 
            activeBlock.pinTitle || '', 
            activeBlock.pinInfo || '',
            activeBlock.pinImage || ''
          );
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeBlock?.lat, activeBlock?.lng, activeBlock?.zoom, activeBlock?.id, activeBlock?.type, activeBlock?.showPin, activeBlock?.pinTitle, activeBlock?.pinInfo, activeBlock?.pinImage]);

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
      content: (type === 'text' || type === 'imageScenario') ? '' : undefined,
      level: type === 'heading' ? 2 : undefined,
      // FunFact (Phase 1: thêm emoji + tag)
      title: type === 'funFact' ? '' : undefined,
      emoji: type === 'funFact' ? '💡' : undefined,
      tag: type === 'funFact' ? '' : undefined,
      // ImageScenario (Phase 1: dùng imageUrls thay imageUrl)
      imageUrls: type === 'imageScenario' ? [] : undefined,
      // Objectives + Summary (Phase 1/3: list items)
      items: (type === 'objectives' || type === 'summary') ? [''] : undefined,
      // Quiz (Phase 1: mặc định 4 đáp án ABCD + explanation + questionImage)
      question: type === 'quiz' ? '' : undefined,
      options: type === 'quiz' ? ['', '', '', ''] : undefined,
      correctIndex: type === 'quiz' ? 0 : undefined,
      explanation: type === 'quiz' ? '' : undefined,
      questionImage: type === 'quiz' ? '' : undefined,
      // MapAction (giữ nguyên)
      lat: type === 'mapAction' ? 16.0 : undefined,
      lng: type === 'mapAction' ? 106.0 : undefined,
      zoom: type === 'mapAction' ? 5 : undefined,
      description: type === 'mapAction' ? '' : undefined,
      showGrid: type === 'mapAction' ? false : undefined,
      annotationPreset: type === 'mapAction' ? 'none' : undefined,
      showPin: type === 'mapAction' ? false : undefined,
      pinTitle: type === 'mapAction' ? '' : undefined,
      pinInfo: type === 'mapAction' ? '' : undefined,
      pinImage: type === 'mapAction' ? '' : undefined,
      globeStyle: type === 'mapAction' ? 'Sentinel-2' : undefined,
      // DataTable (Phase 1: thêm tableHighlightRow + tableSource)
      tableTitle: type === 'dataTable' ? '' : undefined,
      tableHeaders: type === 'dataTable' ? ['', '', ''] : undefined,
      tableRows: type === 'dataTable' ? [['', '', '']] : undefined,
      tableHighlightCol: type === 'dataTable' ? 2 : undefined,
      tableHighlightRow: type === 'dataTable' ? undefined : undefined,
      tableUnit: type === 'dataTable' ? '' : undefined,
      tableSource: type === 'dataTable' ? '' : undefined,

      // Phase 2: Video
      videoUrl: type === 'video' ? '' : undefined,
      videoCaption: type === 'video' ? '' : undefined,

      // Phase 2: Chart
      chartType: type === 'chart' ? 'bar' : undefined,
      chartData: type === 'chart' ? [
        { label: '', value: 0, color: '#06B6D4' },
      ] : undefined,
      chartUnit: type === 'chart' ? '' : undefined,
      chartXLabel: type === 'chart' ? '' : undefined,
      chartYLabel: type === 'chart' ? '' : undefined,

      // Phase 2: Diagram
      diagramImage: type === 'diagram' ? '' : undefined,
      diagramHotspots: type === 'diagram' ? [] : undefined,

      // Phase 2: Compare
      compareColumns: type === 'compare' ? [
        { title: '', icon: '', color: 'orange', items: [''] },
        { title: '', icon: '', color: 'blue', items: [''] },
      ] : undefined,

      // Phase 2: Callout
      calloutVariant: type === 'callout' ? 'info' : undefined,

      // Phase 3: Timeline
      timelineEvents: type === 'timeline' ? [
        { date: '', title: '', icon: '📅' },
      ] : undefined,

      // Phase 3: GroupActivity
      activityGoal: type === 'groupActivity' ? '' : undefined,
      activitySteps: type === 'groupActivity' ? [''] : undefined,
      activityOutput: type === 'groupActivity' ? '' : undefined,
      activityDuration: type === 'groupActivity' ? '' : undefined,

      // Phase 3: OpenQuestion
      expectedKeywords: type === 'openQuestion' ? [] : undefined,
      questionType: type === 'openQuestion' ? 'short' : undefined,

      // Phase 3: FillBlank
      blankTemplate: type === 'fillBlank' ? '' : undefined,
      blankAnswers: type === 'fillBlank' ? [''] : undefined,

      // Phase 3: Quote
      quoteText: type === 'quote' ? '' : undefined,
      quoteAuthor: type === 'quote' ? '' : undefined,
      quoteSource: type === 'quote' ? '' : undefined,

      // Phase 3: Glossary
      glossaryTerms: type === 'glossary' ? [
        { term: '', definition: '' },
      ] : undefined,

      // Phase 3: TwoColumn
      twoColumnLeft: type === 'twoColumn' ? { type: 'text', content: '' } : undefined,
      twoColumnRight: type === 'twoColumn' ? { type: 'text', content: '' } : undefined,

      // Phase 3: Gallery
      galleryImages: type === 'gallery' ? [] : undefined,
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
    const isCollapsed = !isActive && collapsedBlocks.has(block.id);

    const toggleCollapse = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCollapsedBlocks(prev => {
        const next = new Set(prev);
        if (next.has(block.id)) {
          next.delete(block.id);
        } else {
          next.add(block.id);
        }
        return next;
      });
    };

    return (
      <div
        key={block.id}
        onClick={(e) => {
          const tag = (e.target as HTMLElement).tagName;
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
          setActiveBlockId(block.id);
          setCollapsedBlocks(prev => {
            const next = new Set(prev);
            next.delete(block.id);
            return next;
          });
        }}
        className={`group relative rounded-[24px] transition-all duration-300 border-2 cursor-pointer p-1
          ${isActive ? 'border-cyan-400 shadow-[0_10px_30px_rgba(14,165,233,0.12)] z-10' : 'border-transparent hover:border-slate-200'}`}
      >
        {/* Floating actions */}
        <div className={`absolute -right-3 -top-3 flex flex-col gap-1 bg-white p-1 rounded-xl shadow-lg border border-slate-100 transition-opacity z-20 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button onClick={toggleCollapse} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center" title={isCollapsed ? "Mở rộng" : "Thu gọn"}>
            <Icon icon={isCollapsed ? 'ph:arrows-out-simple' : 'ph:arrows-in-simple'} width={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center" title="Xóa"><Icon icon="ph:trash" width={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center" title="Lên"><Icon icon="ph:arrow-up" width={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center" title="Xuống"><Icon icon="ph:arrow-down" width={16} /></button>
        </div>

        {isCollapsed ? (
          <div className="flex items-center gap-3 py-1">
            <div className="text-2xl">{getBlockIcon(block.type)}</div>
            <div className="flex-1 truncate">
              <span className="text-xs font-bold text-slate-400 uppercase mr-2">{getBlockTypeName(block.type)}</span>
              <span className="text-sm text-slate-600 font-medium truncate">{getBlockExcerpt(block)}</span>
            </div>
          </div>
        ) : (
          <>

            {/* HEADING BLOCK */}
            {block.type === 'heading' && (
              <ModuleShell
                icon={<Icon icon="ph:text-t" width={20} />}
                typeName={`Tiêu đề · H${block.level || 2}`}
                accent="cyan"
                headerRight={
                  <div className="flex gap-1 bg-white/80 rounded-lg p-1 border border-cyan-100">
                    {[1, 2, 3].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => updateBlock(block.id, { level: lvl as any })}
                        className={`px-2.5 py-1 text-[11px] font-black rounded-md transition-all ${block.level === lvl ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                      >H{lvl}</button>
                    ))}
                  </div>
                }
              >
                <input
                  type="text"
                  value={block.content || ''}
                  onChange={e => updateBlock(block.id, { content: e.target.value })}
                  placeholder={`Tiêu đề H${block.level || 2}...`}
                  className={`w-full bg-transparent outline-none font-black text-[#082F49] ${block.level === 1 ? 'text-3xl' : block.level === 2 ? 'text-xl' : 'text-base text-cyan-700'} border-b-2 border-cyan-100 focus:border-cyan-400 pb-2 transition-colors`}
                />
              </ModuleShell>
            )}

            {/* TEXT BLOCK */}
            {block.type === 'text' && (
              <ModuleShell icon={<Icon icon="ph:article" width={20} />} typeName="Văn bản" accent="slate">
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                  <RichTextEditor
                    value={block.content || ''}
                    onChange={(html) => updateBlock(block.id, { content: html })}
                    placeholder="Gõ nội dung văn bản..."
                  />
                </div>
              </ModuleShell>
            )}

            {/* FUN FACT BLOCK */}
            {block.type === 'funFact' && (
              <ModuleShell
                icon={<Icon icon="ph:lightbulb-filament" width={20} />}
                typeName="Có thể em chưa biết"
                accent="cyan"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                    placeholder="Tiêu đề hộp..."
                  />
                }
              >
                {/* Emoji picker */}
                <div>
                  <label className={labelCls}>Biểu tượng</label>
                  <div className="flex flex-wrap gap-1.5 bg-slate-50 rounded-xl p-2 border border-slate-200">
                    {['💡', '🤔', '✨', '🌍', '🔬', '📚', '🎯', '🤯', '🎉', '⚡', '🚀', '🔥', '⭐', '🌟', '🧠', '📖'].map(e => (
                      <button
                        key={e}
                        onClick={() => updateBlock(block.id, { emoji: e })}
                        className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${block.emoji === e ? 'bg-cyan-500 shadow-md scale-110' : 'hover:bg-white hover:shadow-sm'}`}
                      >{e}</button>
                    ))}
                  </div>
                </div>

                {/* Tag */}
                <div>
                  <label className={labelCls}>Chủ đề (tag)</label>
                  <input
                    type="text"
                    value={block.tag || ''}
                    onChange={e => updateBlock(block.id, { tag: e.target.value })}
                    placeholder="vd: Núi lửa, Sông ngòi, Khí hậu..."
                    className={inputCls}
                  />
                </div>

                {/* Content */}
                <div>
                  <label className={labelCls}>Nội dung</label>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                    <RichTextEditor
                      value={block.content || ''}
                      onChange={(html) => updateBlock(block.id, { content: html })}
                      placeholder="Gõ nội dung thú vị..."
                    />
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* IMAGE SCENARIO BLOCK */}
            {block.type === 'imageScenario' && (() => {
              const urls = (block.imageUrls && block.imageUrls.length > 0)
                ? block.imageUrls
                : (block.imageUrl ? [block.imageUrl] : []);
              return (
                <ModuleShell
                  icon={<Icon icon="ph:image" width={20} />}
                  typeName="Tình huống có ảnh"
                  accent="emerald"
                  headerRight={
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black">
                      {urls.length} ảnh
                    </span>
                  }
                >
                  <div>
                    <label className={labelCls}>Nội dung tình huống</label>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                      <RichTextEditor
                        value={block.content || ''}
                        onChange={(html) => updateBlock(block.id, { content: html })}
                        placeholder="VD: Ngày nay, các con tàu ra khơi đều phải..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Link hình ảnh — mỗi link 1 dòng để tạo slide</label>
                    <textarea
                      value={urls.join('\n')}
                      onChange={e => updateBlock(block.id, {
                        imageUrls: e.target.value.split('\n').map(u => u.trim()).filter(Boolean),
                        imageUrl: undefined,
                      })}
                      placeholder="https://example.com/anh1.jpg&#10;https://example.com/anh2.jpg"
                      className={`${textareaCls} font-mono`}
                    />
                    {urls.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {urls.map((url, i) => (
                          <div key={i} className="w-14 h-14 rounded-lg border border-emerald-200 overflow-hidden bg-slate-50 shadow-sm">
                            <img src={url} alt={`thumb-${i}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ModuleShell>
              );
            })()}

            {/* OBJECTIVES BLOCK */}
            {block.type === 'objectives' && (
              <ModuleShell
                icon={<Icon icon="ph:target" width={20} />}
                typeName="Yêu cầu cần đạt"
                accent="amber"
                headerRight={
                  block.items !== undefined ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[11px] font-black">
                      {block.items.length} mục tiêu
                    </span>
                  ) : null
                }
              >
                {block.items !== undefined ? (
                  <div className="space-y-2">
                    {block.items.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 group focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                        <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">✓</span>
                        <input
                          type="text"
                          value={item}
                          onChange={e => {
                            const next = [...(block.items || [])];
                            next[idx] = e.target.value;
                            updateBlock(block.id, { items: next });
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const next = [...(block.items || [])];
                              next.splice(idx + 1, 0, '');
                              updateBlock(block.id, { items: next });
                            }
                          }}
                          placeholder="vd: Trình bày được vị trí địa lí của Việt Nam..."
                          className="flex-1 bg-transparent outline-none text-[#082F49] font-medium placeholder:text-[#94A3B8]"
                        />
                        {(block.items?.length || 0) > 1 && (
                          <button
                            onClick={() => updateBlock(block.id, { items: block.items?.filter((_, i) => i !== idx) })}
                            className={`${removeBtnCls} opacity-0 group-hover:opacity-100`}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.amber.dashBtn}`}
                    >+ Thêm mục tiêu</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <RichTextEditor
                        value={block.content || ''}
                        onChange={(html) => updateBlock(block.id, { content: html })}
                        placeholder="Nhập mục tiêu bài học..."
                      />
                    </div>
                    <button
                      onClick={() => updateBlock(block.id, { items: [''], content: undefined })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border transition-all ${ACCENT_MAP.amber.dashBtn}`}
                    >↺ Chuyển sang dạng checklist mới</button>
                  </div>
                )}
              </ModuleShell>
            )}

            {/* MAP ACTION BLOCK */}
            {block.type === 'mapAction' && (
              <ModuleShell
                icon={<Icon icon="ph:globe-hemisphere-east" width={20} />}
                typeName="Hành động bản đồ"
                accent="cyan"
                titleSlot={
                  <input
                    type="text"
                    value={block.description || ''}
                    onChange={e => updateBlock(block.id, { description: e.target.value })}
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                    placeholder="Mô tả hành động (vd: Xoay đến VN)..."
                  />
                }
              >
                {/* Tọa độ */}
                <div className={sectionCls}>
                  <label className={labelCls}>Tọa độ & Zoom</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Vĩ độ</span>
                      <input type="number" step="0.0001" value={block.lat ?? ''} onChange={e => updateBlock(block.id, { lat: parseFloat(e.target.value) })} className={`${subInputCls} w-full font-mono`} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Kinh độ</span>
                      <input type="number" step="0.0001" value={block.lng ?? ''} onChange={e => updateBlock(block.id, { lng: parseFloat(e.target.value) })} className={`${subInputCls} w-full font-mono`} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Zoom ({block.zoom})</span>
                      <input type="range" min="1" max="15" value={block.zoom} onChange={e => updateBlock(block.id, { zoom: parseInt(e.target.value) })} className="mt-2.5 accent-cyan-500 w-full" />
                    </div>
                  </div>
                </div>

                {/* Lưới & chú thích */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-cyan-400 transition-all">
                    <input type="checkbox" checked={block.showGrid || false} onChange={e => updateBlock(block.id, { showGrid: e.target.checked })} className="w-4 h-4 accent-cyan-500 rounded" />
                    <span className="font-bold text-[#082F49] text-sm">🌐 Lưới tọa độ</span>
                  </label>
                  <select
                    value={block.annotationPreset || (block.showAnnotations ? 'latlng' : 'none')}
                    onChange={e => updateBlock(block.id, { annotationPreset: e.target.value })}
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="none">Không có chú thích</option>
                    <option value="latlng">Kinh/Vĩ tuyến</option>
                    <option value="continents">Tên châu lục</option>
                    <option value="oceans">Tên đại dương</option>
                  </select>
                </div>

                {/* Loại bản đồ */}
                <div>
                  <label className={labelCls}>🗺️ Loại bản đồ</label>
                  <select
                    value={block.globeStyle || 'Sentinel-2'}
                    onChange={e => updateBlock(block.id, { globeStyle: e.target.value })}
                    className={`${inputCls} cursor-pointer`}
                  >
                    <option value="Sentinel-2">🛰️ Sentinel-2 (vệ tinh EU)</option>
                    <option value="Blue Marble">🌏 Blue Marble (địa cầu xanh)</option>
                    <option value="Earth at night">🌃 Earth at night</option>
                    <option value="Natural Earth II">🌍 Natural Earth II</option>
                    <option value="Google Maps Satellite">📡 Google Maps vệ tinh</option>
                    <option value="Google Maps Satellite with Labels">📡 Google Maps vệ tinh + nhãn</option>
                    <option value="Google Maps Roadmap">🗺️ Google Maps đường phố</option>
                    <option value="Google Maps Contour">📐 Google Maps địa hình</option>
                    <option value="Azure Maps Aerial">🛩️ Azure Maps vệ tinh</option>
                    <option value="Azure Maps Roads">🛣️ Azure Maps đường phố</option>
                  </select>
                </div>

                {/* Pin */}
                <div className={sectionCls}>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={block.showPin || false}
                      onChange={e => updateBlock(block.id, { showPin: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500 rounded"
                    />
                    <span className="font-black text-[#082F49] text-sm">📍 Thả ghim + popup thông tin</span>
                  </label>

                  {block.showPin && (
                    <div className="mt-3 pl-6 border-l-2 border-cyan-200 space-y-2">
                      <input type="text" value={block.pinTitle || ''} onChange={e => updateBlock(block.id, { pinTitle: e.target.value })} placeholder="Tiêu đề (VD: Đài Greenwich)" className={inputCls} />
                      <textarea value={block.pinInfo || ''} onChange={e => updateBlock(block.id, { pinInfo: e.target.value })} placeholder="Nội dung giới thiệu chi tiết..." className={textareaCls} />
                      <input type="text" value={block.pinImage || ''} onChange={e => updateBlock(block.id, { pinImage: e.target.value })} placeholder="URL ảnh minh họa (tùy chọn)" className={inputCls} />
                    </div>
                  )}
                </div>
              </ModuleShell>
            )}

            {/* DATA TABLE BLOCK */}
            {block.type === 'dataTable' && (
              <ModuleShell
                icon={<Icon icon="ph:table" width={20} />}
                typeName="Bảng số liệu"
                accent="violet"
                titleSlot={
                  <input
                    type="text"
                    value={block.tableTitle || ''}
                    onChange={e => updateBlock(block.id, { tableTitle: e.target.value })}
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                    placeholder="Tiêu đề bảng số liệu..."
                  />
                }
                headerRight={
                  <span className="px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-[11px] font-black">
                    {(block.tableRows?.length || 0)} hàng × {(block.tableHeaders?.length || 0)} cột
                  </span>
                }
              >
                {/* Table editor */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-violet-50/60 border-b border-violet-100">
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
                                className="bg-transparent outline-none font-black text-violet-700 w-full min-w-[110px] placeholder:text-[#94A3B8]"
                                placeholder={`Cột ${ci + 1}`}
                              />
                              {(block.tableHeaders || []).length > 1 && (
                                <button
                                  onClick={() => {
                                    const hs = (block.tableHeaders || []).filter((_, i) => i !== ci);
                                    const rows = (block.tableRows || []).map(r => r.filter((_, i) => i !== ci));
                                    updateBlock(block.id, { tableHeaders: hs, tableRows: rows });
                                  }}
                                  className="text-rose-400 hover:text-rose-600 shrink-0 text-xs"
                                  title="Xóa cột"
                                >✕</button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="p-2 w-10">
                          <button
                            onClick={() => {
                              const hs = [...(block.tableHeaders || []), 'Cột mới'];
                              const rows = (block.tableRows || []).map(r => [...r, '']);
                              updateBlock(block.id, { tableHeaders: hs, tableRows: rows });
                            }}
                            className="text-violet-500 hover:text-violet-700 font-bold text-lg w-7 h-7 rounded-md hover:bg-violet-100 transition-all"
                            title="Thêm cột"
                          >+</button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(block.tableRows || []).map((row, ri) => (
                        <tr key={ri} className="border-t border-slate-100 hover:bg-slate-50/50">
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
                                className="bg-white border border-slate-200 rounded-md px-2 py-1.5 outline-none w-full min-w-[110px] text-[#334155] focus:border-violet-400 transition-colors"
                              />
                            </td>
                          ))}
                          <td className="p-1 text-center">
                            <button
                              onClick={() => updateBlock(block.id, { tableRows: (block.tableRows || []).filter((_, i) => i !== ri) })}
                              className={removeBtnCls}
                              title="Xóa hàng"
                            >✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add row */}
                <button
                  onClick={() => {
                    const emptyRow = (block.tableHeaders || []).map(() => '');
                    updateBlock(block.id, { tableRows: [...(block.tableRows || []), emptyRow] });
                  }}
                  className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.violet.dashBtn}`}
                >+ Thêm hàng</button>

                {/* Controls grid */}
                <div className={sectionCls}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Cột nổi bật (thanh bar)</label>
                      <select
                        value={block.tableHighlightCol ?? 1}
                        onChange={e => updateBlock(block.id, { tableHighlightCol: parseInt(e.target.value) })}
                        className={`${inputCls} cursor-pointer`}
                      >
                        {(block.tableHeaders || []).map((h, i) => (
                          <option key={i} value={i}>{h || `Cột ${i + 1}`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Đơn vị</label>
                      <input
                        type="text"
                        value={block.tableUnit || ''}
                        onChange={e => updateBlock(block.id, { tableUnit: e.target.value })}
                        placeholder="VD: triệu người"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Hàng nổi bật</label>
                      <select
                        value={block.tableHighlightRow ?? -1}
                        onChange={e => updateBlock(block.id, { tableHighlightRow: parseInt(e.target.value) === -1 ? undefined : parseInt(e.target.value) })}
                        className={`${inputCls} cursor-pointer`}
                      >
                        <option value={-1}>— Không —</option>
                        {(block.tableRows || []).map((r, i) => (
                          <option key={i} value={i}>Hàng {i + 1}: {r[0]?.substring(0, 20) || '(trống)'}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Nguồn dữ liệu</label>
                      <input
                        type="text"
                        value={block.tableSource || ''}
                        onChange={e => updateBlock(block.id, { tableSource: e.target.value })}
                        placeholder="VD: Niên giám thống kê 2023"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* QUIZ BLOCK */}
            {block.type === 'quiz' && (
              <ModuleShell
                icon={<Icon icon="ph:question" width={20} />}
                typeName="Câu hỏi trắc nghiệm"
                accent="orange"
                titleSlot={
                  <input
                    type="text"
                    value={block.question || ''}
                    onChange={e => updateBlock(block.id, { question: e.target.value })}
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                    placeholder="Nhập câu hỏi..."
                  />
                }
              >
                {/* Question image */}
                <div>
                  <label className={labelCls}>Hình ảnh kèm câu hỏi (tùy chọn)</label>
                  <div className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={block.questionImage || ''}
                      onChange={e => updateBlock(block.id, { questionImage: e.target.value })}
                      placeholder="https://... (link ảnh minh họa)"
                      className={`${inputCls} flex-1`}
                    />
                    {block.questionImage && (
                      <div className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                        <img src={block.questionImage} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className={labelCls}>Đáp án — nhấn chữ cái để chọn đúng</label>
                  <div className="space-y-2">
                    {block.options?.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const isCorrect = block.correctIndex === idx;
                      return (
                        <div key={idx} className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-400 shadow-sm' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                          <button
                            type="button"
                            onClick={() => updateBlock(block.id, { correctIndex: idx })}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 transition-all ${isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                            title={isCorrect ? 'Đáp án đúng' : 'Chọn làm đáp án đúng'}
                          >{letter}</button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(block.options || [])];
                              newOpts[idx] = e.target.value;
                              updateBlock(block.id, { options: newOpts });
                            }}
                            className="flex-1 bg-transparent outline-none font-medium text-[#082F49] placeholder:text-[#94A3B8]"
                            placeholder={`Đáp án ${letter}`}
                          />
                          {(block.options?.length || 0) > 2 && (
                            <button
                              onClick={() => {
                                const newOpts = block.options?.filter((_, i) => i !== idx) || [];
                                const newCorrect = (block.correctIndex ?? 0) >= newOpts.length ? 0 : (block.correctIndex ?? 0);
                                updateBlock(block.id, { options: newOpts, correctIndex: newCorrect });
                              }}
                              className={removeBtnCls}
                            >✕</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {(block.options?.length || 0) < 6 && (
                    <button
                      onClick={() => updateBlock(block.id, { options: [...(block.options || []), ''] })}
                      className={`mt-2 text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.orange.dashBtn}`}
                    >+ Thêm đáp án</button>
                  )}
                </div>

                {/* Explanation */}
                <div>
                  <label className={labelCls}>💡 Giải thích đáp án đúng (hiện sau khi trả lời)</label>
                  <textarea
                    value={block.explanation || ''}
                    onChange={e => updateBlock(block.id, { explanation: e.target.value })}
                    placeholder="vd: Đáp án B đúng vì..."
                    className={textareaCls}
                  />
                </div>
              </ModuleShell>
            )}

            {/* ════════ PHASE 2 MODULES ════════ */}

            {/* VIDEO BLOCK */}
            {block.type === 'video' && (
              <ModuleShell
                icon={<Icon icon="ph:video-camera" width={20} />}
                typeName="Video"
                accent="red"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Tiêu đề video..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
              >
                <div>
                  <label className={labelCls}>URL video (YouTube hoặc MP4)</label>
                  <input
                    type="text"
                    value={block.videoUrl || ''}
                    onChange={e => updateBlock(block.id, { videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... hoặc https://example.com/video.mp4"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Chú thích video</label>
                  <textarea
                    value={block.videoCaption || ''}
                    onChange={e => updateBlock(block.id, { videoCaption: e.target.value })}
                    placeholder="Mô tả ngắn nội dung video..."
                    className={textareaCls}
                  />
                </div>
              </ModuleShell>
            )}

            {/* CHART BLOCK */}
            {block.type === 'chart' && (
              <ModuleShell
                icon={<Icon icon="ph:chart-bar" width={20} />}
                typeName="Biểu đồ"
                accent="indigo"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Tiêu đề biểu đồ..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
                headerRight={
                  <div className="flex gap-1 bg-white/80 rounded-lg p-1 border border-indigo-100">
                    {(['bar', 'line', 'pie'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateBlock(block.id, { chartType: t })}
                        className={`px-2 py-1 rounded-md text-[11px] font-black transition-all ${block.chartType === t ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                      >
                        {t === 'bar' ? '📊' : t === 'line' ? '📉' : '🥧'}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Trục X</label>
                    <input type="text" value={block.chartXLabel || ''} onChange={e => updateBlock(block.id, { chartXLabel: e.target.value })} placeholder="vd: Thành phố" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Trục Y</label>
                    <input type="text" value={block.chartYLabel || ''} onChange={e => updateBlock(block.id, { chartYLabel: e.target.value })} placeholder="vd: Nhiệt độ" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Đơn vị</label>
                    <input type="text" value={block.chartUnit || ''} onChange={e => updateBlock(block.id, { chartUnit: e.target.value })} placeholder="vd: °C" className={inputCls} />
                  </div>
                </div>

                <div className={sectionCls}>
                  <label className={labelCls}>Dữ liệu</label>
                  <div className="space-y-2">
                    {(block.chartData || []).map((pt, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5">
                        <input
                          type="color"
                          value={pt.color || '#6366F1'}
                          onChange={e => {
                            const next = [...(block.chartData || [])];
                            next[idx] = { ...next[idx], color: e.target.value };
                            updateBlock(block.id, { chartData: next });
                          }}
                          className="w-7 h-7 rounded-md cursor-pointer shrink-0 border-0"
                        />
                        <input
                          type="text"
                          value={pt.label}
                          onChange={e => {
                            const next = [...(block.chartData || [])];
                            next[idx] = { ...next[idx], label: e.target.value };
                            updateBlock(block.id, { chartData: next });
                          }}
                          placeholder="Nhãn"
                          className="flex-1 bg-transparent border-none outline-none text-sm text-[#082F49] placeholder:text-[#94A3B8]"
                        />
                        <input
                          type="number"
                          step="0.1"
                          value={pt.value}
                          onChange={e => {
                            const next = [...(block.chartData || [])];
                            next[idx] = { ...next[idx], value: parseFloat(e.target.value) || 0 };
                            updateBlock(block.id, { chartData: next });
                          }}
                          className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-sm focus:border-indigo-400 font-mono text-right"
                        />
                        <button
                          onClick={() => updateBlock(block.id, { chartData: (block.chartData || []).filter((_, i) => i !== idx) })}
                          className={removeBtnCls}
                        >✕</button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(block.id, { chartData: [...(block.chartData || []), { label: 'Mới', value: 0, color: '#6366F1' }] })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.indigo.dashBtn}`}
                    >+ Thêm dòng</button>
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* DIAGRAM BLOCK */}
            {block.type === 'diagram' && (
              <ModuleShell
                icon={<Icon icon="ph:puzzle-piece" width={20} />}
                typeName="Sơ đồ chú thích"
                accent="teal"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Tiêu đề sơ đồ (vd: Cấu tạo Trái Đất)..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
                headerRight={
                  <span className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-[11px] font-black">
                    {block.diagramHotspots?.length || 0} hotspot
                  </span>
                }
              >
                <div>
                  <label className={labelCls}>Ảnh sơ đồ</label>
                  <input
                    type="text"
                    value={block.diagramImage || ''}
                    onChange={e => updateBlock(block.id, { diagramImage: e.target.value })}
                    placeholder="https://... (link ảnh)"
                    className={inputCls}
                  />
                </div>

                {block.diagramImage && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={block.diagramImage} alt="Diagram" className="w-full max-h-[300px] object-contain" />
                    {(block.diagramHotspots || []).map((h, i) => (
                      <div key={i}
                        className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-teal-500 text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-lg"
                        style={{ left: `${h.x}%`, top: `${h.y}%` }}
                        title={h.label}
                      >{i + 1}</div>
                    ))}
                  </div>
                )}

                <div className={sectionCls}>
                  <label className={labelCls}>Hotspot (chú thích trên sơ đồ)</label>
                  <div className="space-y-2">
                    {(block.diagramHotspots || []).map((h, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                          <input
                            type="text"
                            value={h.label}
                            onChange={e => {
                              const next = [...(block.diagramHotspots || [])];
                              next[idx] = { ...next[idx], label: e.target.value };
                              updateBlock(block.id, { diagramHotspots: next });
                            }}
                            placeholder="Tên (vd: Lớp vỏ)"
                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-[#082F49] placeholder:text-[#94A3B8]"
                          />
                          <button
                            onClick={() => updateBlock(block.id, { diagramHotspots: (block.diagramHotspots || []).filter((_, i) => i !== idx) })}
                            className={removeBtnCls}
                          >✕</button>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#94A3B8] font-bold">X%</span>
                          <input
                            type="number" min={0} max={100}
                            value={h.x}
                            onChange={e => {
                              const next = [...(block.diagramHotspots || [])];
                              next[idx] = { ...next[idx], x: parseFloat(e.target.value) || 0 };
                              updateBlock(block.id, { diagramHotspots: next });
                            }}
                            className={`${subInputCls} w-16 font-mono`}
                          />
                          <span className="text-[#94A3B8] font-bold ml-2">Y%</span>
                          <input
                            type="number" min={0} max={100}
                            value={h.y}
                            onChange={e => {
                              const next = [...(block.diagramHotspots || [])];
                              next[idx] = { ...next[idx], y: parseFloat(e.target.value) || 0 };
                              updateBlock(block.id, { diagramHotspots: next });
                            }}
                            className={`${subInputCls} w-16 font-mono`}
                          />
                        </div>
                        <input
                          type="text"
                          value={h.description || ''}
                          onChange={e => {
                            const next = [...(block.diagramHotspots || [])];
                            next[idx] = { ...next[idx], description: e.target.value };
                            updateBlock(block.id, { diagramHotspots: next });
                          }}
                          placeholder="Mô tả chi tiết (tùy chọn)"
                          className={`${subInputCls} w-full`}
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(block.id, { diagramHotspots: [...(block.diagramHotspots || []), { x: 50, y: 50, label: 'Chú thích mới' }] })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.teal.dashBtn}`}
                    >+ Thêm hotspot</button>
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* COMPARE BLOCK */}
            {block.type === 'compare' && (
              <ModuleShell
                icon={<Icon icon="ph:scales" width={20} />}
                typeName="So sánh"
                accent="slate"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="vd: Khí hậu nhiệt đới vs ôn đới..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(block.compareColumns || []).map((col, ci) => (
                    <div key={ci} className={sectionCls}>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={col.icon || ''}
                          onChange={e => {
                            const next = [...(block.compareColumns || [])];
                            next[ci] = { ...next[ci], icon: e.target.value };
                            updateBlock(block.id, { compareColumns: next });
                          }}
                          placeholder="🎯"
                          className="w-10 h-10 text-center text-xl bg-white border border-slate-200 rounded-lg outline-none focus:border-cyan-400"
                        />
                        <input
                          type="text"
                          value={col.title}
                          onChange={e => {
                            const next = [...(block.compareColumns || [])];
                            next[ci] = { ...next[ci], title: e.target.value };
                            updateBlock(block.id, { compareColumns: next });
                          }}
                          placeholder="Tên cột"
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 outline-none font-bold text-[#082F49] focus:border-cyan-400 placeholder:text-[#94A3B8]"
                        />
                        {(block.compareColumns?.length || 0) > 1 && (
                          <button
                            onClick={() => updateBlock(block.id, { compareColumns: (block.compareColumns || []).filter((_, i) => i !== ci) })}
                            className={removeBtnCls}
                          >✕</button>
                        )}
                      </div>
                      <select
                        value={col.color || 'blue'}
                        onChange={e => {
                          const next = [...(block.compareColumns || [])];
                          next[ci] = { ...next[ci], color: e.target.value };
                          updateBlock(block.id, { compareColumns: next });
                        }}
                        className={`${inputCls} cursor-pointer mb-2`}
                      >
                        <option value="blue">🔵 Xanh dương</option>
                        <option value="green">🟢 Xanh lá</option>
                        <option value="orange">🟠 Cam</option>
                        <option value="rose">🌸 Hồng</option>
                        <option value="violet">🟣 Tím</option>
                        <option value="amber">🟡 Vàng</option>
                      </select>
                      <div className="space-y-1.5">
                        {col.items.map((it, ii) => (
                          <div key={ii} className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-xs font-bold w-3">•</span>
                            <input
                              type="text"
                              value={it}
                              onChange={e => {
                                const next = [...(block.compareColumns || [])];
                                const nextItems = [...next[ci].items];
                                nextItems[ii] = e.target.value;
                                next[ci] = { ...next[ci], items: nextItems };
                                updateBlock(block.id, { compareColumns: next });
                              }}
                              placeholder="Đặc điểm..."
                              className={`${subInputCls} flex-1`}
                            />
                            {col.items.length > 1 && (
                              <button
                                onClick={() => {
                                  const next = [...(block.compareColumns || [])];
                                  next[ci] = { ...next[ci], items: next[ci].items.filter((_, i) => i !== ii) };
                                  updateBlock(block.id, { compareColumns: next });
                                }}
                                className={removeBtnCls}
                              >✕</button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const next = [...(block.compareColumns || [])];
                            next[ci] = { ...next[ci], items: [...next[ci].items, ''] };
                            updateBlock(block.id, { compareColumns: next });
                          }}
                          className={`text-[10px] font-bold px-2 py-1 bg-white rounded-md border border-dashed transition-all ${ACCENT_MAP.slate.dashBtn}`}
                        >+ Thêm dòng</button>
                      </div>
                    </div>
                  ))}
                </div>

                {(block.compareColumns?.length || 0) < 4 && (
                  <button
                    onClick={() => updateBlock(block.id, { compareColumns: [...(block.compareColumns || []), { title: 'Cột mới', icon: '🆕', color: 'green', items: [''] }] })}
                    className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.slate.dashBtn}`}
                  >+ Thêm cột so sánh</button>
                )}
              </ModuleShell>
            )}

            {/* ════════ PHASE 3 MODULES ════════ */}

            {/* TIMELINE BLOCK */}
            {block.type === 'timeline' && (
              <ModuleShell
                icon={<Icon icon="ph:clock-counter-clockwise" width={20} />}
                typeName="Đường thời gian"
                accent="purple"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="vd: Lịch sử hình thành Trái Đất..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
                headerRight={
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-black">
                    {block.timelineEvents?.length || 0} sự kiện
                  </span>
                }
              >
                <div className="space-y-2">
                  {(block.timelineEvents || []).map((ev, idx) => (
                    <div key={idx} className={sectionCls}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <input
                          type="text"
                          value={ev.icon || ''}
                          onChange={e => {
                            const next = [...(block.timelineEvents || [])];
                            next[idx] = { ...next[idx], icon: e.target.value };
                            updateBlock(block.id, { timelineEvents: next });
                          }}
                          placeholder="📅"
                          className="w-10 h-10 text-center text-xl bg-white border border-slate-200 rounded-lg outline-none focus:border-cyan-400"
                        />
                        <input
                          type="text"
                          value={ev.date}
                          onChange={e => {
                            const next = [...(block.timelineEvents || [])];
                            next[idx] = { ...next[idx], date: e.target.value };
                            updateBlock(block.id, { timelineEvents: next });
                          }}
                          placeholder="vd: 1945"
                          className={`${subInputCls} w-32 font-bold`}
                        />
                        <input
                          type="text"
                          value={ev.title}
                          onChange={e => {
                            const next = [...(block.timelineEvents || [])];
                            next[idx] = { ...next[idx], title: e.target.value };
                            updateBlock(block.id, { timelineEvents: next });
                          }}
                          placeholder="Tên sự kiện"
                          className={`${subInputCls} flex-1 font-bold`}
                        />
                        <button
                          onClick={() => updateBlock(block.id, { timelineEvents: (block.timelineEvents || []).filter((_, i) => i !== idx) })}
                          className={removeBtnCls}
                        >✕</button>
                      </div>
                      <input
                        type="text"
                        value={ev.description || ''}
                        onChange={e => {
                          const next = [...(block.timelineEvents || [])];
                          next[idx] = { ...next[idx], description: e.target.value };
                          updateBlock(block.id, { timelineEvents: next });
                        }}
                        placeholder="Mô tả chi tiết (tùy chọn)"
                        className={`${subInputCls} w-full`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => updateBlock(block.id, { timelineEvents: [...(block.timelineEvents || []), { date: '', title: '', icon: '📅' }] })}
                    className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.purple.dashBtn}`}
                  >+ Thêm sự kiện</button>
                </div>
              </ModuleShell>
            )}

            {/* GROUP ACTIVITY BLOCK */}
            {block.type === 'groupActivity' && (
              <ModuleShell
                icon={<Icon icon="ph:users-three" width={20} />}
                typeName="Hoạt động nhóm"
                accent="lime"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="vd: Khám phá khí hậu Việt Nam..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
                headerRight={
                  block.activityDuration ? (
                    <span className="px-2.5 py-1 rounded-full bg-lime-100 text-lime-700 text-[11px] font-black">
                      ⏱ {block.activityDuration}
                    </span>
                  ) : null
                }
              >
                <div>
                  <label className={labelCls}>🎯 Mục tiêu</label>
                  <textarea
                    value={block.activityGoal || ''}
                    onChange={e => updateBlock(block.id, { activityGoal: e.target.value })}
                    placeholder="Học sinh sẽ làm được gì sau hoạt động?"
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>📋 Các bước thực hiện</label>
                  <div className="space-y-1.5">
                    {(block.activitySteps || []).map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-lime-500 text-white text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                        <input
                          type="text"
                          value={step}
                          onChange={e => {
                            const next = [...(block.activitySteps || [])];
                            next[idx] = e.target.value;
                            updateBlock(block.id, { activitySteps: next });
                          }}
                          placeholder={`Bước ${idx + 1}...`}
                          className={`${inputCls} flex-1`}
                        />
                        <button
                          onClick={() => updateBlock(block.id, { activitySteps: (block.activitySteps || []).filter((_, i) => i !== idx) })}
                          className={removeBtnCls}
                        >✕</button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(block.id, { activitySteps: [...(block.activitySteps || []), ''] })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.lime.dashBtn}`}
                    >+ Thêm bước</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>🎁 Sản phẩm</label>
                    <input
                      type="text"
                      value={block.activityOutput || ''}
                      onChange={e => updateBlock(block.id, { activityOutput: e.target.value })}
                      placeholder="vd: Sơ đồ tư duy, bài trình bày..."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>⏱ Thời gian</label>
                    <input
                      type="text"
                      value={block.activityDuration || ''}
                      onChange={e => updateBlock(block.id, { activityDuration: e.target.value })}
                      placeholder="vd: 15 phút"
                      className={inputCls}
                    />
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* OPEN QUESTION BLOCK */}
            {block.type === 'openQuestion' && (
              <ModuleShell
                icon={<Icon icon="ph:pencil-line" width={20} />}
                typeName="Câu hỏi tự luận"
                accent="cyan"
                titleSlot={
                  <input
                    type="text"
                    value={block.question || ''}
                    onChange={e => updateBlock(block.id, { question: e.target.value })}
                    placeholder="Câu hỏi tự luận..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
                headerRight={
                  <div className="flex gap-1 bg-white/80 rounded-lg p-1 border border-cyan-100">
                    {(['short', 'long'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateBlock(block.id, { questionType: t })}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${block.questionType === t ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-cyan-600'}`}
                      >
                        {t === 'short' ? '📝 Ngắn' : '📄 Dài'}
                      </button>
                    ))}
                  </div>
                }
              >
                <div>
                  <label className={labelCls}>Từ khóa mong đợi (gợi ý chấm điểm)</label>
                  <input
                    type="text"
                    value={(block.expectedKeywords || []).join(', ')}
                    onChange={e => updateBlock(block.id, { expectedKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    placeholder="vd: nhiệt đới, gió mùa, mưa nhiều"
                    className={inputCls}
                  />
                  {(block.expectedKeywords?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {block.expectedKeywords!.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-700 text-xs font-bold">{kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              </ModuleShell>
            )}

            {/* FILL BLANK BLOCK */}
            {block.type === 'fillBlank' && (
              <ModuleShell
                icon={<Icon icon="ph:text-underline" width={20} />}
                typeName="Điền vào chỗ trống"
                accent="amber"
              >
                <div>
                  <label className={labelCls}>
                    Mẫu câu — dùng <code className="bg-amber-100 text-amber-700 px-1 rounded text-[10px]">{'{{0}}'}</code> <code className="bg-amber-100 text-amber-700 px-1 rounded text-[10px]">{'{{1}}'}</code>… đánh dấu chỗ trống
                  </label>
                  <textarea
                    value={block.blankTemplate || ''}
                    onChange={e => updateBlock(block.id, { blankTemplate: e.target.value })}
                    placeholder="Trái Đất có {{0}} châu lục và {{1}} đại dương."
                    className={textareaCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Đáp án (theo thứ tự)</label>
                  <div className="space-y-1.5">
                    {(block.blankAnswers || []).map((ans, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-14 px-2 py-1 rounded-md bg-amber-100 text-amber-700 font-mono text-[11px] font-bold text-center shrink-0">{`{{${idx}}}`}</span>
                        <input
                          type="text"
                          value={ans}
                          onChange={e => {
                            const next = [...(block.blankAnswers || [])];
                            next[idx] = e.target.value;
                            updateBlock(block.id, { blankAnswers: next });
                          }}
                          placeholder="Đáp án"
                          className={`${inputCls} flex-1`}
                        />
                        <button
                          onClick={() => updateBlock(block.id, { blankAnswers: (block.blankAnswers || []).filter((_, i) => i !== idx) })}
                          className={removeBtnCls}
                        >✕</button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(block.id, { blankAnswers: [...(block.blankAnswers || []), ''] })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.amber.dashBtn}`}
                    >+ Thêm đáp án</button>
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* QUOTE BLOCK */}
            {block.type === 'quote' && (
              <ModuleShell icon={<Icon icon="ph:quotes" width={20} />} typeName="Trích dẫn" accent="stone">
                <div>
                  <label className={labelCls}>Nội dung trích dẫn</label>
                  <textarea
                    value={block.quoteText || ''}
                    onChange={e => updateBlock(block.id, { quoteText: e.target.value })}
                    placeholder="Một câu trích dẫn ấn tượng..."
                    className={`${textareaCls} italic text-base`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Tác giả</label>
                    <input
                      type="text"
                      value={block.quoteAuthor || ''}
                      onChange={e => updateBlock(block.id, { quoteAuthor: e.target.value })}
                      placeholder="vd: Albert Einstein"
                      className={`${inputCls} font-bold`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Nguồn</label>
                    <input
                      type="text"
                      value={block.quoteSource || ''}
                      onChange={e => updateBlock(block.id, { quoteSource: e.target.value })}
                      placeholder="vd: SGK Địa lý 6"
                      className={`${inputCls} italic`}
                    />
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* GLOSSARY BLOCK */}
            {block.type === 'glossary' && (
              <ModuleShell
                icon={<Icon icon="ph:book-open-text" width={20} />}
                typeName="Từ vựng địa lý"
                accent="fuchsia"
                headerRight={
                  <span className="px-2.5 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[11px] font-black">
                    {block.glossaryTerms?.length || 0} thuật ngữ
                  </span>
                }
              >
                <div className="space-y-2">
                  {(block.glossaryTerms || []).map((t, idx) => (
                    <div key={idx} className={sectionCls}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <input
                          type="text"
                          value={t.term}
                          onChange={e => {
                            const next = [...(block.glossaryTerms || [])];
                            next[idx] = { ...next[idx], term: e.target.value };
                            updateBlock(block.id, { glossaryTerms: next });
                          }}
                          placeholder="Thuật ngữ"
                          className={`${inputCls} flex-1 font-bold`}
                        />
                        <button
                          onClick={() => updateBlock(block.id, { glossaryTerms: (block.glossaryTerms || []).filter((_, i) => i !== idx) })}
                          className={removeBtnCls}
                        >✕</button>
                      </div>
                      <textarea
                        value={t.definition}
                        onChange={e => {
                          const next = [...(block.glossaryTerms || [])];
                          next[idx] = { ...next[idx], definition: e.target.value };
                          updateBlock(block.id, { glossaryTerms: next });
                        }}
                        placeholder="Định nghĩa..."
                        className={`${textareaCls} min-h-[60px] mb-1.5`}
                      />
                      <input
                        type="text"
                        value={t.example || ''}
                        onChange={e => {
                          const next = [...(block.glossaryTerms || [])];
                          next[idx] = { ...next[idx], example: e.target.value };
                          updateBlock(block.id, { glossaryTerms: next });
                        }}
                        placeholder="Ví dụ (tùy chọn)"
                        className={`${inputCls} italic text-xs`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => updateBlock(block.id, { glossaryTerms: [...(block.glossaryTerms || []), { term: '', definition: '' }] })}
                    className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.fuchsia.dashBtn}`}
                  >+ Thêm thuật ngữ</button>
                </div>
              </ModuleShell>
            )}

            {/* TWO COLUMN BLOCK */}
            {block.type === 'twoColumn' && (
              <ModuleShell
                icon={<Icon icon="ph:columns" width={20} />}
                typeName="2 cột nội dung"
                accent="slate"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Tiêu đề (tùy chọn)..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(['twoColumnLeft', 'twoColumnRight'] as const).map(side => {
                    const col = block[side];
                    const isLeft = side === 'twoColumnLeft';
                    return (
                      <div key={side} className={sectionCls}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em]">{isLeft ? '◀ Cột trái' : 'Cột phải ▶'}</span>
                          <div className="flex gap-1 bg-white rounded-md p-0.5 border border-slate-200">
                            {(['text', 'image'] as const).map(t => (
                              <button
                                key={t}
                                onClick={() => updateBlock(block.id, { [side]: { ...(col || { type: 'text', content: '' }), type: t } })}
                                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${col?.type === t ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
                              >
                                {t === 'text' ? '📝' : '🖼️'}
                              </button>
                            ))}
                          </div>
                        </div>
                        {col?.type === 'image' ? (
                          <input
                            type="text"
                            value={col.content}
                            onChange={e => updateBlock(block.id, { [side]: { ...col, content: e.target.value } })}
                            placeholder="https://... (link ảnh)"
                            className={inputCls}
                          />
                        ) : (
                          <textarea
                            value={col?.content || ''}
                            onChange={e => updateBlock(block.id, { [side]: { ...(col || { type: 'text', content: '' }), content: e.target.value } })}
                            placeholder="Nội dung văn bản..."
                            className={textareaCls}
                          />
                        )}
                        <input
                          type="text"
                          value={col?.caption || ''}
                          onChange={e => updateBlock(block.id, { [side]: { ...(col || { type: 'text', content: '' }), caption: e.target.value } })}
                          placeholder="Chú thích (tùy chọn)"
                          className={`${inputCls} italic text-xs mt-1.5`}
                        />
                      </div>
                    );
                  })}
                </div>
              </ModuleShell>
            )}

            {/* GALLERY BLOCK */}
            {block.type === 'gallery' && (
              <ModuleShell
                icon={<Icon icon="ph:images-square" width={20} />}
                typeName="Bộ sưu tập ảnh"
                accent="rose"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Tiêu đề bộ sưu tập..."
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
                headerRight={
                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black">
                    {block.galleryImages?.length || 0} ảnh
                  </span>
                }
              >
                <div className="space-y-2">
                  {(block.galleryImages || []).map((img, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-2 flex gap-2 items-start">
                      <div className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                        {img.url && <img src={img.url} alt={`g-${idx}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={img.url}
                          onChange={e => {
                            const next = [...(block.galleryImages || [])];
                            next[idx] = { ...next[idx], url: e.target.value };
                            updateBlock(block.id, { galleryImages: next });
                          }}
                          placeholder="URL ảnh"
                          className={`${subInputCls} w-full`}
                        />
                        <input
                          type="text"
                          value={img.caption || ''}
                          onChange={e => {
                            const next = [...(block.galleryImages || [])];
                            next[idx] = { ...next[idx], caption: e.target.value };
                            updateBlock(block.id, { galleryImages: next });
                          }}
                          placeholder="Chú thích ảnh"
                          className={`${subInputCls} w-full italic`}
                        />
                      </div>
                      <button
                        onClick={() => updateBlock(block.id, { galleryImages: (block.galleryImages || []).filter((_, i) => i !== idx) })}
                        className={removeBtnCls}
                      >✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateBlock(block.id, { galleryImages: [...(block.galleryImages || []), { url: '', caption: '' }] })}
                    className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.rose.dashBtn}`}
                  >+ Thêm ảnh</button>
                </div>
              </ModuleShell>
            )}

            {/* SUMMARY BLOCK */}
            {block.type === 'summary' && (
              <ModuleShell
                icon={<Icon icon="ph:clipboard-text" width={20} />}
                typeName="Tổng kết"
                accent="sky"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Em đã học được gì?"
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
              >
                <div>
                  <label className={labelCls}>Lời mở (tùy chọn)</label>
                  <textarea
                    value={block.content || ''}
                    onChange={e => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Đoạn giới thiệu ngắn..."
                    className={`${textareaCls} italic`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Các ý tổng kết</label>
                  <div className="space-y-1.5">
                    {(block.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-sky-500 text-white text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                        <input
                          type="text"
                          value={item}
                          onChange={e => {
                            const next = [...(block.items || [])];
                            next[idx] = e.target.value;
                            updateBlock(block.id, { items: next });
                          }}
                          placeholder="Ý tổng kết..."
                          className={`${inputCls} flex-1`}
                        />
                        {(block.items?.length || 0) > 1 && (
                          <button
                            onClick={() => updateBlock(block.id, { items: block.items?.filter((_, i) => i !== idx) })}
                            className={removeBtnCls}
                          >✕</button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(block.id, { items: [...(block.items || []), ''] })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.sky.dashBtn}`}
                    >+ Thêm ý</button>
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* CALLOUT BLOCK */}
            {block.type === 'callout' && (() => {
              const VARIANTS: Record<string, { accent: Accent; icon: React.ReactNode; label: string }> = {
                info:    { accent: 'sky',     icon: <Icon icon="ph:info" width={20} />, label: 'Thông tin' },
                warning: { accent: 'amber',   icon: <Icon icon="ph:warning" width={20} />, label: 'Cảnh báo' },
                danger:  { accent: 'rose',    icon: <Icon icon="ph:warning-octagon" width={20} />, label: 'Nguy hiểm' },
                success: { accent: 'emerald', icon: <Icon icon="ph:check-circle" width={20} />, label: 'Quan trọng' },
                tip:     { accent: 'violet',  icon: <Icon icon="ph:lightbulb" width={20} />, label: 'Mẹo' },
              };
              const v = block.calloutVariant || 'info';
              const cur = VARIANTS[v];
              return (
                <ModuleShell
                  icon={cur.icon}
                  typeName={`Ghi chú · ${cur.label}`}
                  accent={cur.accent}
                  titleSlot={
                    <input
                      type="text"
                      value={block.title || ''}
                      onChange={e => updateBlock(block.id, { title: e.target.value })}
                      placeholder="Tiêu đề ghi chú..."
                      className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                    />
                  }
                >
                  <div>
                    <label className={labelCls}>Loại ghi chú</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['info', 'warning', 'danger', 'success', 'tip'] as const).map(opt => {
                        const op = VARIANTS[opt];
                        const active = v === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => updateBlock(block.id, { calloutVariant: opt })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${active ? `${ACCENT_MAP[op.accent].iconBg} ${ACCENT_MAP[op.accent].typeText} ring-2 ring-current` : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                          >
                            {op.icon}{op.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Nội dung</label>
                    <textarea
                      value={block.content || ''}
                      onChange={e => updateBlock(block.id, { content: e.target.value })}
                      placeholder="Viết nội dung ghi chú..."
                      className={textareaCls}
                    />
                  </div>
                </ModuleShell>
              );
            })()}
          </>
        )}
      </div>
    );
  };

  const glassPanel = "bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(14,165,233,0.1)] rounded-none lg:rounded-[24px]";

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col lg:flex-row lg:gap-6 lg:p-6 bg-gradient-to-br from-[#E0F2FE] via-white to-[#DCFCE7] animate-in zoom-in-95 duration-500 overflow-hidden">

      {/* ── LEFT: ARTICLE BUILDER (Notion-style) ── */}
      <div className={`flex-1 flex flex-col ${glassPanel} overflow-hidden relative`}>
        {/* Header */}
        <div className="px-4 lg:px-8 py-3 lg:py-5 border-b border-white/60 bg-white/40 flex flex-col lg:flex-row lg:items-center justify-between z-10 relative gap-3">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-white/50 hover:bg-cyan-100 rounded-lg text-slate-500 hover:text-cyan-600 transition-colors font-bold shrink-0"
                title="Quay lại danh sách"
              >
                ← <span className="hidden lg:inline">Trở về</span>
              </button>
            )}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                className="text-lg lg:text-2xl font-black text-[#082F49] bg-transparent outline-none border-b-2 border-transparent focus:border-cyan-400 focus:bg-white/50 rounded transition-all w-full lg:w-[500px]"
              />
              <p className="text-sm text-slate-500 font-medium hidden lg:block">Viết nội dung như một bài báo tương tác (Scrollytelling)</p>
            </div>
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
            >
              <Icon icon="ph:presentation-chart" width={16} /> Trình chiếu
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-white font-bold text-sm shadow-md transition-all ${isPublishing ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#06B6D4] hover:bg-[#0369A1]'}`}
            >
              {isPublishing ? <><Icon icon="ph:spinner" width={16} className="animate-spin" /> Đang lưu...</> : <><Icon icon="ph:cloud-arrow-up" width={16} /> Lưu dữ liệu</>}
            </button>
          </div>
        </div>

        {/* Editor Stream */}
        <div className="flex-1 overflow-y-auto py-4 lg:py-6 custom-scrollbar scroll-smooth">
          <div className="w-full space-y-6 pb-32">

            {blocks.map(block => renderBlockEditor(block))}

            <div ref={endOfListRef} />

            {/* ADD BLOCK TOOLBAR */}
            <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-200">
              <p className="text-center text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest">Thêm nội dung mới</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => addBlock('heading')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-[#082F49] font-bold text-sm hover:border-cyan-400 hover:text-cyan-600 transition-all"><Icon icon="material-symbols:title-rounded" width={16} /> Tiêu đề</button>
                <button onClick={() => addBlock('text')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-[#082F49] font-bold text-sm hover:border-cyan-400 hover:text-cyan-600 transition-all"><Icon icon="ph:article" width={16} /> Văn bản</button>
                <button onClick={() => addBlock('imageScenario')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 text-emerald-700 font-bold text-sm hover:border-emerald-400 hover:bg-emerald-100 transition-all"><Icon icon="ph:image" width={16} /> Tình huống có Ảnh</button>
                <button onClick={() => addBlock('objectives')} className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-amber-700 font-bold text-sm hover:border-amber-400 hover:bg-amber-100 transition-all"><Icon icon="ph:target" width={16} /> Mục tiêu bài học</button>
                <button onClick={() => addBlock('funFact')} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-[#082F49] font-bold text-sm hover:border-blue-400 hover:text-blue-600 transition-all"><Icon icon="ph:lightbulb-filament" width={16} /> Có thể em chưa biết</button>
                <button onClick={() => addBlock('mapAction')} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 text-emerald-700 font-bold text-sm hover:border-emerald-400 hover:bg-emerald-100 transition-all"><Icon icon="ph:globe-hemisphere-east" width={16} /> Hành động Bản đồ</button>
                <button onClick={() => addBlock('quiz')} className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-xl shadow-sm border border-orange-200 text-orange-700 font-bold text-sm hover:border-orange-400 hover:bg-orange-100 transition-all"><Icon icon="ph:question" width={16} /> Câu hỏi đan xen</button>
                <button onClick={() => addBlock('dataTable')} className="flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-xl shadow-sm border border-violet-200 text-violet-700 font-bold text-sm hover:border-violet-400 hover:bg-violet-100 transition-all"><Icon icon="ph:table" width={16} /> Bảng số liệu</button>

                {/* Phase 2 modules */}
                <button onClick={() => addBlock('video')} className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl shadow-sm border border-red-200 text-red-700 font-bold text-sm hover:border-red-400 hover:bg-red-100 transition-all"><Icon icon="ph:video-camera" width={16} /> Video</button>
                <button onClick={() => addBlock('chart')} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl shadow-sm border border-indigo-200 text-indigo-700 font-bold text-sm hover:border-indigo-400 hover:bg-indigo-100 transition-all"><Icon icon="ph:chart-bar" width={16} /> Biểu đồ</button>
                <button onClick={() => addBlock('diagram')} className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-xl shadow-sm border border-teal-200 text-teal-700 font-bold text-sm hover:border-teal-400 hover:bg-teal-100 transition-all"><Icon icon="ph:puzzle-piece" width={16} /> Sơ đồ</button>
                <button onClick={() => addBlock('compare')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl shadow-sm border border-slate-200 text-[#082F49] font-bold text-sm hover:border-slate-400 hover:bg-slate-100 transition-all"><Icon icon="ph:scales" width={16} /> So sánh</button>
                <button onClick={() => addBlock('callout')} className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-xl shadow-sm border border-sky-200 text-sky-700 font-bold text-sm hover:border-sky-400 hover:bg-sky-100 transition-all"><Icon icon="ph:warning" width={16} /> Ghi chú</button>

                {/* Phase 3 modules */}
                <button onClick={() => addBlock('timeline')} className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-xl shadow-sm border border-purple-200 text-purple-700 font-bold text-sm hover:border-purple-400 hover:bg-purple-100 transition-all"><Icon icon="ph:clock-counter-clockwise" width={16} /> Đường thời gian</button>
                <button onClick={() => addBlock('groupActivity')} className="flex items-center gap-2 px-4 py-2 bg-lime-50 rounded-xl shadow-sm border border-lime-200 text-lime-700 font-bold text-sm hover:border-lime-400 hover:bg-lime-100 transition-all"><Icon icon="ph:users-three" width={16} /> Hoạt động nhóm</button>
                <button onClick={() => addBlock('openQuestion')} className="flex items-center gap-2 px-4 py-2 bg-cyan-50 rounded-xl shadow-sm border border-cyan-200 text-cyan-700 font-bold text-sm hover:border-cyan-400 hover:bg-cyan-100 transition-all"><Icon icon="ph:pencil-line" width={16} /> Câu hỏi tự luận</button>
                <button onClick={() => addBlock('fillBlank')} className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl shadow-sm border border-amber-200 text-amber-700 font-bold text-sm hover:border-amber-400 hover:bg-amber-100 transition-all"><Icon icon="ph:text-underline" width={16} /> Điền khuyết</button>
                <button onClick={() => addBlock('quote')} className="flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-xl shadow-sm border border-stone-200 text-stone-700 font-bold text-sm hover:border-stone-400 hover:bg-stone-100 transition-all"><Icon icon="ph:quotes" width={16} /> Trích dẫn</button>
                <button onClick={() => addBlock('glossary')} className="flex items-center gap-2 px-4 py-2 bg-fuchsia-50 rounded-xl shadow-sm border border-fuchsia-200 text-fuchsia-700 font-bold text-sm hover:border-fuchsia-400 hover:bg-fuchsia-100 transition-all"><Icon icon="ph:book-open-text" width={16} /> Từ vựng</button>
                <button onClick={() => addBlock('twoColumn')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl shadow-sm border border-slate-200 text-slate-700 font-bold text-sm hover:border-slate-400 hover:bg-slate-100 transition-all"><Icon icon="ph:columns" width={16} /> 2 cột</button>
                <button onClick={() => addBlock('gallery')} className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-xl shadow-sm border border-rose-200 text-rose-700 font-bold text-sm hover:border-rose-400 hover:bg-rose-100 transition-all"><Icon icon="ph:images-square" width={16} /> Bộ ảnh</button>
                <button onClick={() => addBlock('summary')} className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-xl shadow-sm border border-sky-200 text-sky-700 font-bold text-sm hover:border-sky-400 hover:bg-sky-100 transition-all"><Icon icon="ph:clipboard-text" width={16} /> Tổng kết</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: REAL MAP PREVIEW (DEVICE MOCKUP) ── */}
      <div 
        className={`w-full flex flex-col p-2 lg:p-4 bg-white/40 backdrop-blur-3xl lg:border-l border-t lg:border-t-0 border-white/80 lg:shadow-[-20px_0_40px_rgba(14,165,233,0.1)] relative overflow-hidden shrink-0 rounded-t-[24px] lg:rounded-none lg:rounded-[24px] right-panel-preview`}
      >

        {/* MAC OS STYLE HEADER */}
        <div className="flex items-center justify-between mb-2 lg:mb-4 bg-white/80 backdrop-blur-md rounded-xl lg:rounded-2xl p-2 lg:p-3 border border-white/60 shadow-sm">
          <h3 className="font-black text-[#082F49] uppercase tracking-widest text-[10px]">Mô phỏng Đa phương tiện</h3>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-inner"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-inner"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-inner"></div>
          </div>
        </div>

        {/* DEVICE MOCKUP CONTAINER */}
        <div className="flex-1 flex flex-col items-center justify-center relative rounded-xl lg:rounded-[32px] overflow-hidden border-4 lg:border-[6px] border-white/80 shadow-[0_20px_50px_rgba(14,165,233,0.2)] bg-[#082F49]">
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden pointer-events-auto">

            {/* LỚP 1: CESIUM GLOBE */}
            <div className={`absolute inset-0 transition-opacity duration-700 ${(!activeBlock || activeBlock.type === 'mapAction' || (!activeBlock.imageUrl && activeBlock.type !== 'imageScenario')) ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <CesiumGlobe
                ref={builderGlobeRef}
                imageryLayer={
                  activeBlock?.globeStyle ||
                  'Sentinel-2'
                }
                showGrid={activeBlock?.showGrid || false}
                showLayerPicker={false}
                annotations={
                  activeBlock?.type === 'mapAction'
                    ? (ANNOTATION_PRESETS[activeBlock.annotationPreset || 'none'] || [])
                    : []
                }
              />
            </div>

            {/* LỚP 2: HÌNH ẢNH */}
            <div className={`absolute inset-0 transition-opacity duration-700 bg-transparent ${((activeBlock?.type === 'imageScenario' && (activeBlock.imageUrls?.length || activeBlock.imageUrl)) || activeBlock?.imageUrl) ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <ImageSlider urls={activeBlock?.imageUrls || (activeBlock?.imageUrl ? [activeBlock.imageUrl] : [])} />
            </div>

          </div>
        </div>

        {/* STATUS CARD */}
        <div className="hidden lg:block mt-4 bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-white/60 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400"></div>
          <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-widest mb-3">Trạng thái khối hiện tại</h4>

          {activeBlock?.type === 'mapAction' ? (
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#082F49]">Đang thực thi <span className="text-cyan-500">Hành động Bản đồ</span>!</p>
              <p className="text-xs text-slate-500 font-medium">Hệ thống sẽ tự động xoay bản đồ của học sinh đến:</p>
              <div className="flex justify-between font-mono text-xs mt-2 bg-slate-100 text-slate-600 font-bold p-2.5 rounded-lg border border-slate-200">
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
      
      <style dangerouslySetInnerHTML={{__html: `
        .right-panel-preview {
          height: 35vh;
        }
        @media (min-width: 1024px) {
          .right-panel-preview {
            width: 450px !important;
            height: auto !important;
          }
        }
      `}} />

      {showPreview && <PresentationPreview blocks={blocks} onClose={() => setShowPreview(false)} />}
    </div>,
    document.body
  );
}
