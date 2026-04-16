'use client';

import { useState } from 'react';
import { BOOKS_DATA } from '@/data/booksData';

type Book = typeof BOOKS_DATA[number];
type Chapter = Book['chapters'][number];

/* ── Lesson Row ──────────────────────────────────────────────────────── */
function LessonRow({ title, index, color }: { title: string; index: number; color: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-[14px] hover:bg-white/70 transition-colors group cursor-pointer">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mt-0.5 shadow-sm"
        style={{ background: color }}
      >
        {index}
      </div>
      <p className="text-[#334155] text-sm font-semibold group-hover:text-[#082F49] transition-colors leading-snug">{title}</p>
    </div>
  );
}

/* ── Chapter Card ────────────────────────────────────────────────────── */
function ChapterCard({ chapter, bookColor, open, onToggle }: { chapter: Chapter; bookColor: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-[20px] bg-white/75 backdrop-blur-xl border border-white overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left"
      >
        <div
          className="w-10 h-10 rounded-[14px] flex items-center justify-center text-white font-black flex-shrink-0 text-sm shadow-sm"
          style={{ background: `linear-gradient(135deg, ${bookColor}dd, ${bookColor}88)` }}
        >
          {chapter.id}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#082F49] text-sm leading-snug">{chapter.title}</p>
          <p className="text-[#94A3B8] text-xs mt-0.5">{chapter.lessons.length} bài học</p>
        </div>
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${open ? 'rotate-180' : ''}`} style={{ borderColor: bookColor + '60' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={bookColor} strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
        </div>
      </button>

      {/* Expandable lessons */}
      <div className={`grid transition-all duration-400 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-4 pb-4 flex flex-col gap-1">
            {chapter.lessons.map((lesson, i) => (
              <LessonRow key={i} title={lesson} index={i + 1} color={bookColor} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Book Hero Panel ─────────────────────────────────────────────────── */
function BookHero({ book }: { book: Book }) {
  const [openChapter, setOpenChapter] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      {/* Left: Book Cover */}
      <div className="lg:col-span-2 flex justify-center">
        <div className="relative">
          {/* Book spine shadow */}
          <div className="absolute left-0 top-2 bottom-2 w-5 rounded-l-[8px] opacity-40 blur-[2px]"
            style={{ background: book.color }} />
          {/* Book cover */}
          <div
            className="relative w-64 rounded-r-[20px] rounded-l-[6px] overflow-hidden shadow-[8px_16px_48px_rgba(0,0,0,0.20)] border-l-[6px]"
            style={{ borderLeftColor: book.color, minHeight: 340 }}
          >
            {/* Gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${book.gradient} opacity-90`} />
            {/* Decorative circles */}
            <div className="absolute top-[-20%] right-[-20%] w-48 h-48 rounded-full bg-white/15 blur-sm" />
            <div className="absolute bottom-[-10%] left-[-10%] w-36 h-36 rounded-full bg-white/10 blur-sm" />

            <div className="relative z-10 p-7 flex flex-col justify-between h-full" style={{ minHeight: 340 }}>
              <div>
                <div className="w-12 h-1.5 rounded-full bg-white/60 mb-4" />
                <p className="text-white/80 text-xs font-bold uppercase tracking-[0.2em] mb-3">Sách Giáo Khoa</p>
                <div className="text-7xl mb-5 drop-shadow-lg">{book.emoji}</div>
                <h2 className="text-white font-black text-3xl leading-tight drop-shadow">{book.title}</h2>
                <p className="text-white/80 text-sm mt-2 font-medium leading-snug">{book.subtitle}</p>
              </div>
              <div className="mt-6">
                <div className="h-px bg-white/25 mb-4" />
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-xs font-bold">{book.chapters.length} chương</span>
                  <span className="text-white/70 text-xs font-bold">
                    {book.chapters.reduce((sum, c) => sum + c.lessons.length, 0)} bài học
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Chapters */}
      <div className="lg:col-span-3">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-[#082F49]">Mục lục</h3>
          <p className="text-[#334155] text-sm mt-1">{book.description}</p>
        </div>
        <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-2 custom-scroll">
          {book.chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              bookColor={book.color}
              open={openChapter === chapter.id}
              onToggle={() => setOpenChapter(openChapter === chapter.id ? null : chapter.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Grade Selector Tab ──────────────────────────────────────────────── */
function GradeTab({ book, active, onClick }: { book: Book; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-2 px-6 py-4 rounded-[20px] font-bold transition-all duration-300 border-2 group"
      style={active ? {
        background: `linear-gradient(135deg, ${book.color}22, ${book.color}11)`,
        borderColor: book.color,
        color: book.color,
      } : {
        background: 'rgba(255,255,255,0.6)',
        borderColor: 'rgba(255,255,255,0.8)',
        color: '#94A3B8',
      }}
    >
      <span className="text-3xl transition-transform duration-300 group-hover:scale-110">{book.emoji}</span>
      <div>
        <p className="text-base font-black leading-none">Lớp {book.grade}</p>
        <p className="text-[10px] font-semibold mt-0.5 opacity-80">{book.title}</p>
      </div>
      {active && (
        <div className="absolute -bottom-px left-1/2 -translate-x-1/2 w-8 h-1 rounded-full" style={{ background: book.color }} />
      )}
    </button>
  );
}

/* ── Main Client Component ───────────────────────────────────────────── */
export default function BooksClient({ books }: { books: typeof BOOKS_DATA }) {
  const [activeGrade, setActiveGrade] = useState(6);
  const activeBook = books.find(b => b.grade === activeGrade) ?? books[0];

  return (
    <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-28 pb-16">
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 999px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}</style>

      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-sm mb-4">
          <span className="text-lg">📚</span>
          <span className="text-sm font-bold text-[#082F49] uppercase tracking-wider">Thư Viện Địa Lý</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-[#082F49] leading-tight">
          Sách Giáo Khoa
        </h1>
        <p className="text-[#334155] mt-3 text-lg max-w-xl mx-auto">
          Địa lý lớp <span className="font-black text-violet-500">6 · 7 · 8 · 9</span> — Nội dung chi tiết từng chương, từng bài.
        </p>
      </div>

      {/* Grade Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {books.map(book => (
          <GradeTab
            key={book.grade}
            book={book}
            active={activeGrade === book.grade}
            onClick={() => setActiveGrade(book.grade)}
          />
        ))}
      </div>

      {/* Animated book panel */}
      <div
        key={activeGrade}
        className="bg-white/60 backdrop-blur-xl border border-white rounded-[32px] p-8 md:p-10 shadow-[0_16px_48px_rgba(0,0,0,0.07)]"
        style={{ animation: 'fadeIn .35s ease' }}
      >
        <BookHero book={activeBook} />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}
