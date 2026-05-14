'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { PresentationPreview } from './PresentationPreview';
import { RichTextEditor } from './RichTextEditor';
import dynamic from 'next/dynamic';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { MathContentEditor } from './MathContentEditor';

const CesiumGlobe = dynamic(() => import('./CesiumGlobe'), { ssr: false });

import type { BlockType, StoryBlock, QuizQuestion, PracticeItem, SummarySection, FunFactFormula } from '@/types/presentation';

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
    { lat: 30, lng: 45, label: 'Vĩ tuyến Bắc', isAnnotation: true, color: 'text-orange-700' },
    { lat: -30, lng: 45, label: 'Vĩ tuyến Nam', isAnnotation: true, color: 'text-orange-700' },
    { lat: 15, lng: 45, label: 'Kinh tuyến Đông', isAnnotation: true, color: 'text-orange-700' },
    { lat: 15, lng: -45, label: 'Kinh tuyến Tây', isAnnotation: true, color: 'text-orange-700' },
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
  const [blockViewMode, setBlockViewMode] = useState<'simple' | 'detailed'>('detailed');
  const [formulaOpenMap, setFormulaOpenMap] = useState<Record<string, boolean>>({});

  // --- Block palette config ---
  const BLOCK_PALETTE: { type: BlockType; label: string; icon: string; bg: string; border: string; text: string; hoverBorder: string; hoverBg: string }[] = [
    { type: 'heading',       label: 'Tiêu đề',              icon: 'material-symbols:title-rounded', bg: 'bg-cyan-50',    border: 'border-cyan-200',    text: 'text-cyan-700',    hoverBorder: 'hover:border-cyan-500',    hoverBg: 'hover:bg-cyan-100' },
    { type: 'text',          label: 'Văn bản',              icon: 'ph:article',                     bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-700',   hoverBorder: 'hover:border-slate-500',   hoverBg: 'hover:bg-slate-100' },
    { type: 'gallery',       label: 'Hình ảnh',                icon: 'ph:images-square',               bg: 'bg-cyan-50',    border: 'border-cyan-300',    text: 'text-cyan-800',    hoverBorder: 'hover:border-cyan-600',    hoverBg: 'hover:bg-cyan-200' },
    { type: 'objectives',    label: 'Nội dung bài học',     icon: 'ph:target',                      bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   hoverBorder: 'hover:border-amber-500',   hoverBg: 'hover:bg-amber-100' },
    { type: 'imageScenario', label: 'Tình huống có Ảnh',    icon: 'ph:image',                       bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', hoverBorder: 'hover:border-emerald-500', hoverBg: 'hover:bg-emerald-100' },
    { type: 'funFact',       label: 'Có thể em chưa biết',  icon: 'ph:lightbulb-filament',          bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    hoverBorder: 'hover:border-blue-500',    hoverBg: 'hover:bg-blue-100' },
    { type: 'mapAction',     label: 'Hành động Bản đồ',     icon: 'ph:globe-hemisphere-east',       bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    hoverBorder: 'hover:border-teal-500',    hoverBg: 'hover:bg-teal-100' },
    { type: 'quiz',          label: 'Câu hỏi trắc nghiệm',  icon: 'ph:question',                    bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  hoverBorder: 'hover:border-orange-500',  hoverBg: 'hover:bg-orange-100' },
    { type: 'openQuestion',  label: 'Câu hỏi tự luận',      icon: 'ph:pencil-line',                 bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     hoverBorder: 'hover:border-sky-500',     hoverBg: 'hover:bg-sky-100' },
    { type: 'dataTable',     label: 'Bảng số liệu',          icon: 'ph:table',                       bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-700',  hoverBorder: 'hover:border-violet-500',  hoverBg: 'hover:bg-violet-100' },
    { type: 'video',         label: 'Video',                 icon: 'ph:video-camera',                bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     hoverBorder: 'hover:border-red-500',     hoverBg: 'hover:bg-red-100' },
    { type: 'chart',         label: 'Biểu đồ',               icon: 'ph:chart-bar',                   bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700',  hoverBorder: 'hover:border-indigo-500',  hoverBg: 'hover:bg-indigo-100' },
    { type: 'diagram',       label: 'Sơ đồ',                 icon: 'ph:puzzle-piece',                bg: 'bg-lime-50',    border: 'border-lime-200',    text: 'text-lime-700',    hoverBorder: 'hover:border-lime-500',    hoverBg: 'hover:bg-lime-100' },
    { type: 'compare',       label: 'So sánh',               icon: 'ph:scales',                      bg: 'bg-zinc-50',    border: 'border-lime-200',    text: 'text-zinc-700',    hoverBorder: 'hover:border-zinc-500',    hoverBg: 'hover:bg-zinc-100' },
    { type: 'callout',       label: 'Ghi chú',               icon: 'ph:warning',                     bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-700',  hoverBorder: 'hover:border-yellow-500',  hoverBg: 'hover:bg-yellow-100' },
    { type: 'timeline',      label: 'Đường thời gian',       icon: 'ph:clock-counter-clockwise',     bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  hoverBorder: 'hover:border-purple-500',  hoverBg: 'hover:bg-purple-100' },
    { type: 'groupActivity', label: 'Hoạt động nhóm',        icon: 'ph:users-three',                 bg: 'bg-green-50',   border: 'border-green-200',   text: 'text-green-700',   hoverBorder: 'hover:border-green-500',   hoverBg: 'hover:bg-green-100' },
    { type: 'fillBlank',     label: 'Điền khuyết',           icon: 'ph:text-underline',              bg: 'bg-pink-50',    border: 'border-green-200',    text: 'text-pink-700',    hoverBorder: 'hover:border-pink-500',    hoverBg: 'hover:bg-pink-100' },
    { type: 'quote',         label: 'Trích dẫn',             icon: 'ph:quotes',                      bg: 'bg-stone-50',   border: 'border-stone-200',   text: 'text-stone-700',   hoverBorder: 'hover:border-stone-500',   hoverBg: 'hover:bg-stone-100' },
    { type: 'glossary',      label: 'Từ vựng',               icon: 'ph:book-open-text',              bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', hoverBorder: 'hover:border-fuchsia-500', hoverBg: 'hover:bg-fuchsia-100' },
    { type: 'twoColumn',     label: '2 cột',                  icon: 'ph:columns',                     bg: 'bg-neutral-50', border: 'border-rose-200', text: 'text-neutral-700', hoverBorder: 'hover:border-neutral-500', hoverBg: 'hover:bg-neutral-100' },
    { type: 'practice',      label: 'Luyện tập & Vận dụng', icon: 'ph:pencil-ruler',                bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    hoverBorder: 'hover:border-rose-500',    hoverBg: 'hover:bg-rose-100' },
    { type: 'summary',       label: 'Tổng kết',              icon: 'ph:clipboard-text',              bg: 'bg-sky-100',    border: 'border-sky-300',     text: 'text-sky-800',     hoverBorder: 'hover:border-sky-500',     hoverBg: 'hover:bg-sky-200' },
  ];

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
    practice: 'ph:pencil-ruler',
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
      case 'practice': return 'Luyện tập & Vận dụng';
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
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };


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
        showToast('🎉 Đã xuất bản Bài giảng thành công vào Cơ sở dữ liệu!', 'success');
      } else {
        showToast('❌ Lỗi xuất bản: ' + data.error, 'error');
      }
    } catch (err) {
      showToast('❌ Lỗi kết nối Server!', 'error');
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
      // Quiz (multi-question)
      quizQuestions: type === 'quiz' ? [
        { id: Date.now().toString() + '_q0', question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', questionImage: '' }
      ] : undefined,
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
      chartType: type === 'chart' ? 'column' : undefined,
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

      // Practice
      practiceItems: type === 'practice' ? [
        { text: '', icon: '📚' },
        { text: '', icon: '🏃' },
      ] : undefined,

      // Summary sections (new structured format)
      summarySections: type === 'summary' ? [
        { title: '', body: '' },
      ] : undefined,
      summaryImage: type === 'summary' ? '' : undefined,
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
            {block.type === 'heading' && (() => {
              const BG_PRESETS = [
                { label: 'Mặc định', value: '' },
                { label: 'Xanh biển', value: 'linear-gradient(135deg,#E0F2FE,#BAE6FD)' },
                { label: 'Xanh lá', value: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' },
                { label: 'Tím', value: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)' },
                { label: 'Cam', value: 'linear-gradient(135deg,#FEF3C7,#FDE68A)' },
                { label: 'Hồng', value: 'linear-gradient(135deg,#FFE4E6,#FECDD3)' },
                { label: 'Tối (Cyan)', value: 'linear-gradient(135deg,#082F49,#0E4D6E)' },
                { label: 'Tối (Tím)', value: 'linear-gradient(135deg,#1E1B4B,#312E81)' },
              ];
              const COLOR_PRESETS = [
                { label: 'Mặc định', value: '' },
                { label: 'Xanh biển (Chữ)', value: '#0284C7' },
                { label: 'Xanh lá (Chữ)', value: '#16A34A' },
                { label: 'Tím (Chữ)', value: '#7C3AED' },
                { label: 'Cam (Chữ)', value: '#D97706' },
                { label: 'Hồng (Chữ)', value: '#DB2777' },
                { label: 'Sáng (Cyan)', value: '#22D3EE' },
                { label: 'Sáng (Tím)', value: '#A78BFA' },
              ];
              return (
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

                  {/* Color pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Background */}
                    <div>
                      <label className={labelCls}>Màu nền</label>
                      <div className="flex flex-wrap gap-1.5">
                        {BG_PRESETS.map(p => (
                          <button
                            key={p.value}
                            onClick={() => updateBlock(block.id, { headingBg: p.value })}
                            title={p.label}
                            className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                              (block.headingBg || '') === p.value ? 'border-cyan-500 scale-110 shadow-md' : 'border-slate-200'
                            }`}
                            style={{ background: p.value || 'linear-gradient(135deg,#E0F2FE,transparent)' }}
                          />
                        ))}
                        {/* Custom color input */}
                        <label className="w-7 h-7 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-cyan-400 overflow-hidden" title="Màu tuùy chỉnh">
                          <input type="color" className="w-10 h-10 opacity-0 absolute" onChange={e => updateBlock(block.id, { headingBg: e.target.value })} />
                          <Icon icon="ph:eye-dropper" width={14} className="text-slate-400" />
                        </label>
                      </div>
                    </div>

                    {/* Text color */}
                    <div>
                      <label className={labelCls}>Màu chữ</label>
                      <div className="flex flex-wrap gap-1.5">
                        {COLOR_PRESETS.map(p => (
                          <button
                            key={p.value}
                            onClick={() => updateBlock(block.id, { headingColor: p.value })}
                            title={p.label}
                            className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                              (block.headingColor || '') === p.value ? 'border-cyan-500 scale-110 shadow-md' : 'border-slate-200'
                            }`}
                            style={{ background: p.value || '#082F49' }}
                          />
                        ))}
                        <label className="w-7 h-7 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-cyan-400 overflow-hidden" title="Màu tuùy chỉnh">
                          <input type="color" value={block.headingColor || '#082F49'} className="w-10 h-10 opacity-0 absolute" onChange={e => updateBlock(block.id, { headingColor: e.target.value })} />
                          <Icon icon="ph:eye-dropper" width={14} className="text-slate-400" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    className="w-full rounded-xl p-4 mb-1 transition-all"
                    style={{
                      background: block.headingBg || 'linear-gradient(135deg,#E0F2FE,transparent)',
                      borderLeft: '4px solid #06B6D4',
                    }}
                  >
                    <input
                      type="text"
                      value={block.content || ''}
                      onChange={e => updateBlock(block.id, { content: e.target.value })}
                      placeholder={`Tiêu đề H${block.level || 2}...`}
                      className={`w-full bg-transparent outline-none font-black ${block.level === 1 ? 'text-3xl' : block.level === 2 ? 'text-xl' : 'text-base'} pb-1 transition-colors`}
                      style={{ color: block.headingColor || '#082F49' }}
                    />
                  </div>
                </ModuleShell>
              );
            })()}

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

                {/* Content — unified text + math editor */}
                <div>
                  <label className={labelCls}>Nội dung</label>
                  <MathContentEditor
                    value={block.funFactRawContent || ''}
                    onChange={(val) => updateBlock(block.id, { funFactRawContent: val })}
                    placeholder={'Gõ nội dung thú vị...\nDán công thức LaTeX và bọc trong $$...$$ để hiển thị, ví dụ:\n$$\\frac{\\text{Dân số}}{\\text{Diện tích}}$$'}
                  />
                </div>

              </ModuleShell>
            )}

            {/* IMAGE SCENARIO BLOCK */}
            {block.type === 'imageScenario' && (() => {
              const urls: string[] = (block.imageUrls && block.imageUrls.length > 0)
                ? block.imageUrls
                : (block.imageUrl ? [block.imageUrl] : []);

              const setUrls = (next: string[]) => updateBlock(block.id, { imageUrls: next, imageUrl: undefined });

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
                  {/* Scenario content */}
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

                  {/* Image list */}
                  <div>
                    <label className={labelCls}>Hình ảnh minh họa ({urls.length > 1 ? 'slide' : 'ảnh đơn'})</label>
                    <div className="space-y-2">
                      {urls.map((url, i) => (
                        <div key={i} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2">
                          {/* Thumbnail */}
                          <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                            {url && (
                              <img
                                src={url}
                                alt={`thumb-${i}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            )}
                          </div>
                          {/* URL input */}
                          <input
                            type="text"
                            value={url}
                            onChange={e => {
                              const next = [...urls];
                              next[i] = e.target.value;
                              setUrls(next);
                            }}
                            placeholder={`https://... (link ảnh ${i + 1})`}
                            className={`${inputCls} flex-1`}
                          />
                          {/* Slide badge */}
                          {urls.length > 1 && (
                            <span className="text-[10px] font-black text-emerald-500 shrink-0 w-6 text-center">{i + 1}</span>
                          )}
                          {/* Remove */}
                          <button
                            onClick={() => setUrls(urls.filter((_, idx) => idx !== i))}
                            className={removeBtnCls}
                            title="Xoá ảnh này"
                          >✕</button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setUrls([...urls, ''])}
                      className={`mt-2 w-full text-xs font-bold px-4 py-2 bg-white rounded-xl border-2 border-dashed transition-all ${ACCENT_MAP.emerald.dashBtn} flex items-center justify-center gap-2`}
                    >
                      <Icon icon="ph:plus" width={14} />
                      {urls.length === 0 ? 'Thêm ảnh' : 'Thêm ảnh vào slide'}
                    </button>
                  </div>
                </ModuleShell>
              );
            })()}

            {/* OBJECTIVES BLOCK */}
            {block.type === 'objectives' && (
              <ModuleShell
                icon={<Icon icon="ph:target" width={20} />}
                typeName="Học xong bài này, em sẽ:"
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
            {block.type === 'dataTable' && (() => {
              const TABLE_HEADER_PRESETS = [
                { label: 'Navy', bg: '#1e3a8a', text: '#ffffff' },
                { label: 'Tím', bg: '#5b21b6', text: '#ffffff' },
                { label: 'Cyan', bg: '#0e7490', text: '#ffffff' },
                { label: 'Xanh lá', bg: '#166534', text: '#ffffff' },
                { label: 'Đỏ', bg: '#9f1239', text: '#ffffff' },
                { label: 'Xám thẫm', bg: '#1e293b', text: '#ffffff' },
                { label: 'Cam', bg: '#92400e', text: '#ffffff' },
                { label: 'Xanh lơ', bg: '#1d4ed8', text: '#ffffff' },
              ];
              const activeHeaderBg = block.tableHeaderBg || '#1e3a8a';
              const activeHeaderText = block.tableHeaderTextColor || '#ffffff';
              return (
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
                {/* ── Màu sắc tiêu đề ── */}
                <div className="p-4 rounded-2xl border border-slate-100" style={{background:'linear-gradient(135deg,#f8f5ff,#f0f4ff)'}}>
                  <label className={labelCls}>Màu tiêu đề bảng</label>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {TABLE_HEADER_PRESETS.map(p => (
                      <button
                        key={p.bg}
                        title={p.label}
                        onClick={() => updateBlock(block.id, { tableHeaderBg: p.bg, tableHeaderTextColor: p.text })}
                        className="w-7 h-7 rounded-lg transition-all hover:scale-110"
                        style={{
                          background: p.bg,
                          border: activeHeaderBg === p.bg ? '2.5px solid #7c3aed' : '2px solid rgba(0,0,0,0.12)',
                          transform: activeHeaderBg === p.bg ? 'scale(1.18)' : undefined,
                          boxShadow: activeHeaderBg === p.bg ? '0 0 0 2px #ede9fe' : undefined,
                        }}
                      />
                    ))}
                    <label className="w-7 h-7 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-violet-400 overflow-hidden relative" title="Màu tùy chỉnh">
                      <input type="color" value={activeHeaderBg} className="w-10 h-10 opacity-0 absolute cursor-pointer" onChange={e => updateBlock(block.id, { tableHeaderBg: e.target.value })} />
                      <Icon icon="ph:eye-dropper" width={14} className="text-slate-400" />
                    </label>
                    {/* Preview chip */}
                    <span className="ml-2 px-3 py-1 rounded-full text-xs font-black transition-all" style={{background: activeHeaderBg, color: activeHeaderText}}>
                      Tiêu đề
                    </span>
                  </div>
                </div>

                {/* ── Table editor ── */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr style={{backgroundColor: activeHeaderBg}}>
                        {(block.tableHeaders || []).map((h, ci) => (
                          <th key={ci} className="p-2 text-left" style={{borderRight:'1px solid rgba(255,255,255,0.2)'}}>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={h}
                                onChange={e => {
                                  const hs = [...(block.tableHeaders || [])];
                                  hs[ci] = e.target.value;
                                  updateBlock(block.id, { tableHeaders: hs });
                                }}
                                style={{background:'transparent',outline:'none',color: activeHeaderText,fontWeight:800,width:'100%',minWidth:'110px'}}
                                placeholder={`Cột ${ci + 1}`}
                              />
                              {(block.tableHeaders || []).length > 1 && (
                                <button
                                  onClick={() => {
                                    const hs = (block.tableHeaders || []).filter((_, i) => i !== ci);
                                    const rows = (block.tableRows || []).map(r => r.filter((_, i) => i !== ci));
                                    updateBlock(block.id, { tableHeaders: hs, tableRows: rows });
                                  }}
                                  style={{color:'rgba(255,255,255,0.6)',flexShrink:0,fontSize:'11px',lineHeight:1,background:'none',border:'none',cursor:'pointer'}}
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
                            style={{color: activeHeaderText,fontWeight:'bold',fontSize:'18px',width:'28px',height:'28px',borderRadius:'6px',background:'none',border:'none',cursor:'pointer',transition:'background 0.15s',opacity:0.8}}
                            onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.2)')}
                            onMouseLeave={e => (e.currentTarget.style.background='none')}
                            title="Thêm cột"
                          >+</button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(block.tableRows || []).map((row, ri) => (
                        <tr key={ri} className="border-t border-slate-100 hover:bg-violet-50/40 transition-colors">
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
                      <div className="relative">
                        <select
                          value={block.tableHighlightCol ?? 1}
                          onChange={e => updateBlock(block.id, { tableHighlightCol: parseInt(e.target.value) })}
                          className="cursor-pointer w-full rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200"
                          style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',border:'1.5px solid #a78bfa',color:'#5b21b6',appearance:'none',paddingRight:'2.5rem'}}
                        >
                          {(block.tableHeaders || []).map((h, i) => (
                            <option key={i} value={i}>{h || `Cột ${i + 1}`}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center" style={{color:'#7c3aed'}}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
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
                      <div className="relative">
                        <select
                          value={block.tableHighlightRow ?? -1}
                          onChange={e => updateBlock(block.id, { tableHighlightRow: parseInt(e.target.value) === -1 ? undefined : parseInt(e.target.value) })}
                          className="cursor-pointer w-full rounded-2xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200"
                          style={{background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',border:'1.5px solid #a78bfa',color:'#5b21b6',appearance:'none',paddingRight:'2.5rem'}}
                        >
                          <option value={-1}>— Không —</option>
                          {(block.tableRows || []).map((r, i) => (
                            <option key={i} value={i}>Hàng {i + 1}: {r[0]?.substring(0, 20) || '(trống)'}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center" style={{color:'#7c3aed'}}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
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

                  {/* Split header toggle */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
                      <div
                        onClick={() => updateBlock(block.id, { tableSplitHeader: !block.tableSplitHeader })}
                        className="relative w-10 h-5 rounded-full transition-colors duration-200"
                        style={{background: block.tableSplitHeader ? '#7c3aed' : '#e2e8f0'}}
                      >
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200" style={{transform: block.tableSplitHeader ? 'translateX(20px)' : 'translateX(0)'}} />
                      </div>
                      <span className="text-xs font-bold text-[#334155]">Ô tiêu đề chia chéo (kiểu sách giáo khoa)</span>
                    </label>

                    {block.tableSplitHeader && (
                      <div className="mt-2.5 grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelCls}>Nhãn hàng (góc dưới trái)</label>
                          <input
                            type="text"
                            value={block.tableRowHeader || ''}
                            onChange={e => updateBlock(block.id, { tableRowHeader: e.target.value })}
                            placeholder="VD: Nhóm tuổi"
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Nhãn cột (góc trên phải)</label>
                          <input
                            type="text"
                            value={block.tableColHeader || ''}
                            onChange={e => updateBlock(block.id, { tableColHeader: e.target.value })}
                            placeholder="VD: Năm"
                            className={inputCls}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ModuleShell>
              );
            })()}

            {/* QUIZ BLOCK — MULTI-QUESTION */}
            {block.type === 'quiz' && (() => {
              // Support legacy single-question blocks
              const questions: QuizQuestion[] = block.quizQuestions && block.quizQuestions.length > 0
                ? block.quizQuestions
                : [{
                    id: block.id + '_q0',
                    question: block.question || '',
                    options: block.options?.length === 4 ? block.options : ['', '', '', ''],
                    correctIndex: block.correctIndex ?? 0,
                    explanation: block.explanation || '',
                    questionImage: block.questionImage || '',
                  }];

              const updateQuestion = (qIdx: number, patch: Partial<QuizQuestion>) => {
                const next = questions.map((q, i) => i === qIdx ? { ...q, ...patch } : q);
                updateBlock(block.id, { quizQuestions: next });
              };

              const addQuestion = () => {
                const next = [...questions, {
                  id: Date.now().toString(),
                  question: '',
                  options: ['', '', '', ''],
                  correctIndex: 0,
                  explanation: '',
                  questionImage: '',
                }];
                updateBlock(block.id, { quizQuestions: next });
              };

              const removeQuestion = (qIdx: number) => {
                const next = questions.filter((_, i) => i !== qIdx);
                updateBlock(block.id, { quizQuestions: next });
              };

              return (
                <ModuleShell
                  icon={<Icon icon="ph:question" width={20} />}
                  typeName="Câu hỏi trắc nghiệm"
                  accent="orange"
                  headerRight={
                    <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[11px] font-black">
                      {questions.length} câu hỏi
                    </span>
                  }
                >
                  <div className="space-y-4">
                    {questions.map((q, qIdx) => (
                      <div key={q.id} className="border-2 border-orange-100 rounded-2xl p-4 bg-orange-50/40 space-y-3">
                        {/* Question header */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-black shrink-0">Câu {qIdx + 1}</span>
                          {questions.length > 1 && (
                            <button onClick={() => removeQuestion(qIdx)} className={removeBtnCls} title="Xoá câu hỏi này">✕</button>
                          )}
                        </div>

                        {/* Question text */}
                        <input
                          type="text"
                          value={q.question}
                          onChange={e => updateQuestion(qIdx, { question: e.target.value })}
                          placeholder="Nhập câu hỏi..."
                          className={`${inputCls} font-bold text-[#082F49]`}
                        />

                        {/* Question image */}
                        <div className="flex gap-2 items-start">
                          <input
                            type="text"
                            value={q.questionImage || ''}
                            onChange={e => updateQuestion(qIdx, { questionImage: e.target.value })}
                            placeholder="Hình ảnh kèm câu hỏi (URL, tùy chọn)"
                            className={`${inputCls} flex-1`}
                          />
                          {q.questionImage && (
                            <div className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                              <img src={q.questionImage} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                          )}
                        </div>

                        {/* 4 fixed options A/B/C/D */}
                        <div className="space-y-1.5">
                          {q.options.map((opt, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            const isCorrect = q.correctIndex === oIdx;
                            return (
                              <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${isCorrect ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200 hover:border-orange-300'}`}>
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(qIdx, { correctIndex: oIdx })}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 transition-all ${isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                                  title={isCorrect ? 'Đáp án đúng' : 'Chọn làm đáp án đúng'}
                                >{letter}</button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={e => {
                                    const newOpts = [...q.options];
                                    newOpts[oIdx] = e.target.value;
                                    updateQuestion(qIdx, { options: newOpts });
                                  }}
                                  className="flex-1 bg-transparent outline-none font-medium text-[#082F49] placeholder:text-[#94A3B8] text-sm"
                                  placeholder={`Đáp án ${letter}`}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <textarea
                          value={q.explanation || ''}
                          onChange={e => updateQuestion(qIdx, { explanation: e.target.value })}
                          placeholder="💡 Giải thích đáp án đúng (hiện sau khi trả lời, tùy chọn)"
                          rows={2}
                          className={textareaCls}
                        />
                      </div>
                    ))}

                    <button
                      onClick={addQuestion}
                      className={`w-full text-sm font-bold px-4 py-2.5 bg-white rounded-xl border-2 border-dashed transition-all ${ACCENT_MAP.orange.dashBtn} flex items-center justify-center gap-2`}
                    >
                      <Icon icon="ph:plus" width={16} /> Thêm câu hỏi
                    </button>
                  </div>
                </ModuleShell>
              );
            })()}

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
                    {([
                      { id: 'column', icon: <Icon icon="mingcute:chart-bar-fill" width={22} />, label: 'Cột' },
                      { id: 'bar',    icon: <Icon icon="mingcute:chart-horizontal-fill" width={22} />, label: 'Ngang' },
                      { id: 'line',   icon: <Icon icon="mingcute:chart-line-fill" width={22} />, label: 'Đường' },
                      { id: 'pie',    icon: <Icon icon="mingcute:chart-pie-2-fill" width={22} />, label: 'Tròn' },
                    ] as const).map(t => (
                      <button
                        key={t.id}
                        onClick={() => updateBlock(block.id, { chartType: t.id })}
                        title={t.label}
                        className={`px-2 py-1 rounded-md text-[11px] font-black transition-all ${(block.chartType || 'column') === t.id ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}
                      >
                        {t.icon}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Nhãn trục X</label>
                    <input type="text" value={block.chartXLabel || ''} onChange={e => updateBlock(block.id, { chartXLabel: e.target.value })} placeholder="vd: Năm" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nhãn trục Y</label>
                    <input type="text" value={block.chartYLabel || ''} onChange={e => updateBlock(block.id, { chartYLabel: e.target.value })} placeholder="vd: Tỉ số giới tính" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Đơn vị (trục Y)</label>
                    <input type="text" value={block.chartUnit || ''} onChange={e => updateBlock(block.id, { chartUnit: e.target.value })} placeholder="vd: %" className={inputCls} />
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

                {/* Caption & Source */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className={labelCls}>Chú thích biểu đồ (Hình X.)</label>
                    <input type="text" value={block.chartCaption || ''} onChange={e => updateBlock(block.id, { chartCaption: e.target.value })} placeholder="vd: Hình 1. Tỉ số giới tính của dân số nước ta giai đoạn 1999 – 2024" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Nguồn dữ liệu</label>
                    <input type="text" value={block.chartSource || ''} onChange={e => updateBlock(block.id, { chartSource: e.target.value })} placeholder="vd: (Nguồn: Cục Thống kê năm 2025)" className={inputCls} />
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
            {block.type === 'compare' && (() => {
              const COL_COLOR_PRESETS = [
                { label: 'Xanh dương', bg: 'linear-gradient(135deg,#E0F2FE,#BAE6FD)', accent: '#0284C7', text: '#0C4A6E' },
                { label: 'Xanh cyan', bg: 'linear-gradient(135deg,#CFFAFE,#A5F3FC)', accent: '#06B6D4', text: '#164E63' },
                { label: 'Xanh lá', bg: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)', accent: '#16A34A', text: '#14532D' },
                { label: 'Vàng', bg: 'linear-gradient(135deg,#FEF9C3,#FDE68A)', accent: '#D97706', text: '#78350F' },
                { label: 'Cam', bg: 'linear-gradient(135deg,#FEF3C7,#FDBA74)', accent: '#EA580C', text: '#7C2D12' },
                { label: 'Hồng', bg: 'linear-gradient(135deg,#FFE4E6,#FECDD3)', accent: '#DB2777', text: '#831843' },
                { label: 'Tím', bg: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)', accent: '#7C3AED', text: '#3B0764' },
                { label: 'Đen', bg: 'linear-gradient(135deg,#1E293B,#334155)', accent: '#94A3B8', text: '#F8FAFC' },
              ];
              return (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(block.compareColumns || []).map((col, ci) => {
                      const chosenPreset = COL_COLOR_PRESETS.find(p => p.label === (col.color || 'Xanh dương')) || COL_COLOR_PRESETS[0];
                      return (
                        <div key={ci} className="rounded-2xl overflow-hidden border border-white shadow-[0_4px_16px_rgba(14,165,233,0.1)]">
                          {/* Decorative color strip with column index */}
                          <div
                            className="px-4 py-2 flex items-center justify-between"
                            style={{ background: chosenPreset.bg, borderBottom: `2px solid ${chosenPreset.accent}` }}
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest opacity-60" style={{ color: chosenPreset.text }}>
                              Bảng {ci + 1}
                            </span>
                            {(block.compareColumns?.length || 0) > 1 && (
                              <button
                                onClick={() => updateBlock(block.id, { compareColumns: (block.compareColumns || []).filter((_, i) => i !== ci) })}
                                className="w-5 h-5 flex items-center justify-center rounded-full bg-white/60 hover:bg-red-100 text-red-400 text-[10px] font-black transition-all"
                              >✕</button>
                            )}
                          </div>

                          <div className="bg-white/80 px-4 pt-3 pb-3 space-y-3">
                            {/* Title input */}
                            <div>
                              <label className={labelCls}>Tiêu đề</label>
                              <input
                                type="text"
                                value={col.title}
                                onChange={e => {
                                  const next = [...(block.compareColumns || [])];
                                  next[ci] = { ...next[ci], title: e.target.value };
                                  updateBlock(block.id, { compareColumns: next });
                                }}
                                placeholder="vd: Khí hậu nhiệt đới..."
                                className={inputCls}
                                style={{ borderColor: chosenPreset.accent + '80' }}
                              />
                            </div>

                            {/* Color swatches */}
                            <div>
                              <label className={labelCls}>Màu cột</label>
                              <div className="flex flex-wrap gap-1.5">
                                {COL_COLOR_PRESETS.map(p => (
                                  <button
                                    key={p.label}
                                    onClick={() => {
                                      const next = [...(block.compareColumns || [])];
                                      next[ci] = { ...next[ci], color: p.label };
                                      updateBlock(block.id, { compareColumns: next });
                                    }}
                                    title={p.label}
                                    className={`w-6 h-6 rounded-lg border-2 transition-all hover:scale-110 ${
                                      (col.color || 'Xanh dương') === p.label ? 'border-cyan-500 scale-110 shadow-md' : 'border-slate-200'
                                    }`}
                                    style={{ background: p.bg }}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Items */}
                            <div>
                              <label className={labelCls}>Đặc điểm</label>
                              <div className="space-y-1.5">
                                {col.items.map((it, ii) => (
                                  <div key={ii} className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold w-3" style={{ color: chosenPreset.accent }}>•</span>
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
                                  className="text-[10px] font-bold px-2 py-1 rounded-md border border-dashed transition-all"
                                  style={{ color: chosenPreset.accent, borderColor: chosenPreset.accent + '60', background: 'transparent' }}
                                >+ Thêm dòng</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      const cols = block.compareColumns || [];
                      const nextColorIndex = cols.length % COL_COLOR_PRESETS.length;
                      const nextColorIndex2 = (cols.length + 1) % COL_COLOR_PRESETS.length;
                      updateBlock(block.id, {
                        compareColumns: [
                          ...cols,
                          { title: '', icon: '', color: COL_COLOR_PRESETS[nextColorIndex].label, items: [''] },
                          { title: '', icon: '', color: COL_COLOR_PRESETS[nextColorIndex2].label, items: [''] },
                        ]
                      });
                    }}
                    className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.slate.dashBtn}`}
                  >+ Thêm 2 bảng so sánh</button>
                </ModuleShell>
              );
            })()}

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
                {/* Question text */}
                <div>
                  <label className={labelCls}>Nội dung câu hỏi</label>
                  <input
                    type="text"
                    value={block.question || ''}
                    onChange={e => updateBlock(block.id, { question: e.target.value })}
                    placeholder="Nhập câu hỏi tự luận..."
                    className={`${inputCls} font-bold text-[#082F49]`}
                  />
                </div>

                {/* Question image */}
                <div className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={block.questionImage || ''}
                    onChange={e => updateBlock(block.id, { questionImage: e.target.value })}
                    placeholder="Hình ảnh kèm câu hỏi (URL, tùy chọn)"
                    className={`${inputCls} flex-1`}
                  />
                  {block.questionImage && (
                    <div className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                      <img src={block.questionImage} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  )}
                </div>

                {/* Answer */}
                <div>
                  <label className={labelCls}>💬 Đáp án (hiện khi giáo viên mở, tùy chọn)</label>
                  <textarea
                    value={block.openAnswer || ''}
                    onChange={e => updateBlock(block.id, { openAnswer: e.target.value })}
                    placeholder="Nhập gợi ý đáp án hoặc lời giải mẫu..."
                    rows={3}
                    className={textareaCls}
                  />
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
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black">
                      {block.galleryImages?.length || 0} ảnh
                    </span>
                    {/* Display mode toggle */}
                    <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-0.5">
                      <button
                        onClick={() => updateBlock(block.id, { galleryDisplayMode: 'inline' })}
                        title="Hiển thị trong nội dung"
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                          (block.galleryDisplayMode || 'inline') === 'inline'
                            ? 'bg-white shadow-sm text-rose-600'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Icon icon="ph:squares-four" width={12} /> Nội dung
                      </button>
                      <button
                        onClick={() => updateBlock(block.id, { galleryDisplayMode: 'panel' })}
                        title="Hiển thị ở khung phải"
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                          block.galleryDisplayMode === 'panel'
                            ? 'bg-white shadow-sm text-rose-600'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Icon icon="ph:sidebar-simple" width={12} /> Khung phải
                      </button>
                    </div>
                  </div>
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
                {/* Intro */}
                <div>
                  <label className={labelCls}>Lời mở (tùy chọn)</label>
                  <textarea
                    value={block.content || ''}
                    onChange={e => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Dưới đây là các ý chính được đúc kết từ bài học:"
                    className={`${textareaCls} italic`}
                    rows={2}
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className={labelCls}>Ảnh minh họa (URL)</label>
                  <input
                    type="text"
                    value={block.summaryImage || ''}
                    onChange={e => updateBlock(block.id, { summaryImage: e.target.value })}
                    placeholder="https://..."
                    className={inputCls}
                  />
                  {block.summaryImage && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-sky-100 bg-slate-50 h-28 flex items-center justify-center">
                      <img src={block.summaryImage} alt="Preview" className="max-h-28 max-w-full object-contain" />
                    </div>
                  )}
                </div>

                {/* Sections */}
                <div>
                  <label className={labelCls}>Các phần tổng kết</label>
                  <div className="space-y-3">
                    {(block.summarySections || []).map((sec: SummarySection, idx: number) => (
                      <div key={idx} className="rounded-2xl bg-white/70 border border-sky-100 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-sky-500 text-white text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={e => {
                              const next = [...(block.summarySections || [])];
                              next[idx] = { ...next[idx], title: e.target.value };
                              updateBlock(block.id, { summarySections: next });
                            }}
                            placeholder="Tiêu đề phần... (vd: Hệ thống kinh, vĩ tuyến)"
                            className={`${inputCls} flex-1 font-bold`}
                          />
                          {(block.summarySections?.length || 0) > 1 && (
                            <button
                              onClick={() => updateBlock(block.id, { summarySections: block.summarySections?.filter((_, i) => i !== idx) })}
                              className={removeBtnCls}
                            >✕</button>
                          )}
                        </div>
                        <div className="bg-white border border-sky-100 rounded-xl overflow-hidden focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                          <RichTextEditor
                            value={sec.body}
                            onChange={html => {
                              const next = [...(block.summarySections || [])];
                              next[idx] = { ...next[idx], body: html };
                              updateBlock(block.id, { summarySections: next });
                            }}
                            placeholder="Nội dung phần tổng kết..."
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => updateBlock(block.id, { summarySections: [...(block.summarySections || []), { title: '', body: '' }] })}
                      className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.sky.dashBtn}`}
                    >+ Thêm phần</button>
                  </div>
                </div>
              </ModuleShell>
            )}

            {/* PRACTICE BLOCK — Luyện tập & Vận dụng */}
            {block.type === 'practice' && (
              <ModuleShell
                icon={<Icon icon="ph:pencil-ruler" width={20} />}
                typeName="Luyện tập & Vận dụng"
                accent="amber"
                titleSlot={
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={e => updateBlock(block.id, { title: e.target.value })}
                    placeholder="Luyện tập và Vận dụng"
                    className="w-full bg-transparent outline-none font-bold text-[#082F49] text-base placeholder:text-[#94A3B8]"
                  />
                }
              >
                <div className="space-y-2">
                  {(block.practiceItems || []).map((item: PracticeItem, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 bg-white/70 rounded-2xl p-3 border border-amber-100">
                      {/* Number badge */}
                      <div className="w-7 h-7 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-1">{idx + 1}</div>
                      {/* Text */}
                      <textarea
                        value={item.text}
                        onChange={e => {
                          const next = [...(block.practiceItems || [])];
                          next[idx] = { ...next[idx], text: e.target.value };
                          updateBlock(block.id, { practiceItems: next });
                        }}
                        placeholder="Nội dung bài tập / yêu cầu vận dụng..."
                        rows={2}
                        className={`${textareaCls} flex-1 resize-none !py-2`}
                      />
                      {(block.practiceItems?.length || 0) > 1 && (
                        <button
                          onClick={() => updateBlock(block.id, { practiceItems: block.practiceItems?.filter((_, i) => i !== idx) })}
                          className={removeBtnCls}
                        >✕</button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => updateBlock(block.id, { practiceItems: [...(block.practiceItems || []), { text: '', icon: '🏃' }] })}
                    className={`text-xs font-bold px-3 py-1.5 bg-white rounded-lg border border-dashed transition-all ${ACCENT_MAP.amber.dashBtn}`}
                  >+ Thêm bài tập</button>
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
              {/* Header row with toggle */}
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thêm nội dung mới</p>
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setBlockViewMode('simple')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${blockViewMode === 'simple' ? 'bg-white shadow-sm text-[#082F49]' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Chế độ icon"
                  >
                    <Icon icon="ph:squares-four" width={14} /> Đơn giản
                  </button>
                  <button
                    onClick={() => setBlockViewMode('detailed')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${blockViewMode === 'detailed' ? 'bg-white shadow-sm text-[#082F49]' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Chế độ chi tiết"
                  >
                    <Icon icon="ph:list" width={14} /> Chi tiết
                  </button>
                </div>
              </div>

              {blockViewMode === 'detailed' ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {BLOCK_PALETTE.map(p => (
                    <button
                      key={p.type}
                      onClick={() => addBlock(p.type)}
                      className={`flex items-center gap-2 px-4 py-2 ${p.bg} rounded-xl shadow-sm border ${p.border} ${p.text} font-bold text-sm ${p.hoverBorder} ${p.hoverBg} transition-all`}
                    >
                      <Icon icon={p.icon} width={16} /> {p.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-2">
                  {BLOCK_PALETTE.map(p => (
                    <button
                      key={p.type}
                      onClick={() => addBlock(p.type)}
                      title={p.label}
                      className={`w-12 h-12 flex items-center justify-center ${p.bg} rounded-2xl border-2 ${p.border} ${p.text} ${p.hoverBorder} ${p.hoverBg} transition-all hover:scale-110 shadow-sm`}
                    >
                      <Icon icon={p.icon} width={22} />
                    </button>
                  ))}
                </div>
              )}
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
            <div className={`absolute inset-0 transition-opacity duration-700 bg-transparent ${(
              (activeBlock?.type === 'imageScenario' && (activeBlock.imageUrls?.length || activeBlock.imageUrl)) ||
              (activeBlock?.type === 'openQuestion' && activeBlock.questionImage) ||
              (activeBlock?.type === 'gallery' && activeBlock.galleryDisplayMode === 'panel' && (activeBlock.galleryImages?.length || 0) > 0) ||
              activeBlock?.imageUrl
            ) ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
              <ImageSlider urls={
                activeBlock?.type === 'openQuestion'
                  ? (activeBlock.questionImage ? [activeBlock.questionImage] : [])
                  : activeBlock?.type === 'gallery' && activeBlock.galleryDisplayMode === 'panel'
                    ? (activeBlock.galleryImages?.map((g: { url: string; caption?: string }) => g.url).filter(Boolean) || [])
                    : (activeBlock?.imageUrls || (activeBlock?.imageUrl ? [activeBlock.imageUrl] : []))
              } />
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
          ) : activeBlock?.type === 'openQuestion' && activeBlock.questionImage ? (
            <p className="text-xs text-slate-400 leading-relaxed">
              Khung bên phải đang hiển thị <b>Hình ảnh câu hỏi</b>. Ảnh sẽ hiển thị khi học sinh cuộn đến câu hỏi này.
            </p>
          ) : activeBlock?.type === 'gallery' && activeBlock.galleryDisplayMode === 'panel' ? (
            <p className="text-xs text-slate-400 leading-relaxed">
              Khung bên phải đang hiển thị <b>Bộ ảnh</b> ({activeBlock.galleryImages?.length || 0} ảnh). Ảnh sẽ trượt vào khi học sinh cuộn đến khối này.
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
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`
            flex items-center gap-3 px-5 py-3.5 rounded-[16px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border backdrop-blur-[20px] font-bold text-sm
            ${toastMessage.type === 'success' 
              ? 'bg-[rgba(187,247,208,0.8)] border-[rgba(34,197,94,0.5)] text-[#16A34A]' 
              : 'bg-[rgba(254,226,226,0.8)] border-[rgba(239,68,68,0.5)] text-[#DC2626]'}
          `}>
            {toastMessage.message}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
