'use client';

import { useState } from 'react';
import Link from 'next/link';

const GRADES = [
  {
    grade: 6,
    label: 'Lớp 6',
    emoji: '🌏',
    color: '#06B6D4',
    gFrom: '#22D3EE',
    gTo: '#3B82F6',
    bg: 'rgba(224,242,254,0.6)',
    desc: 'Trái Đất — Ngôi nhà của chúng ta',
    lessons: [
      {
        id: 'grade6-bai1',
        title: 'Bài 1: Hệ thống kinh, vĩ tuyến. Toạ độ địa lí',
        desc: 'Khám phá hệ thống tọa độ bao quanh Trái Đất và cách đọc kinh độ, vĩ độ.',
        tags: ['Kinh tuyến', 'Vĩ tuyến', 'Toạ độ'],
        duration: '~15 phút',
        emoji: '🌐',
        ready: true,
      },
      {
        id: 'grade6-bai2',
        title: 'Bài 2: Bản đồ — Phương tiện thể hiện bề mặt Trái Đất',
        desc: 'Tìm hiểu về bản đồ địa lý, các loại tỉ lệ và ký hiệu bản đồ.',
        tags: ['Bản đồ', 'Tỉ lệ', 'Ký hiệu'],
        duration: '~12 phút',
        emoji: '🗺️',
        ready: false,
      },
      {
        id: 'grade6-bai3',
        title: 'Bài 3: Trái Đất — Hành tinh trong hệ Mặt Trời',
        desc: 'Vị trí của Trái Đất trong hệ Mặt Trời và sự vận động tự quay quanh trục.',
        tags: ['Hệ Mặt Trời', 'Tự quay', 'Ngày đêm'],
        duration: '~18 phút',
        emoji: '🌍',
        ready: false,
      },
    ],
  },
  {
    grade: 7,
    label: 'Lớp 7',
    emoji: '🌍',
    color: '#22C55E',
    gFrom: '#4ADE80',
    gTo: '#10B981',
    bg: 'rgba(220,252,231,0.6)',
    desc: 'Địa lý các châu lục & đại dương',
    lessons: [
      {
        id: 'grade7-bai1',
        title: 'Bài 1: Châu Phi — Vị trí địa lý và đặc điểm tự nhiên',
        desc: 'Khám phá vị trí, địa hình và khí hậu đặc trưng của lục địa đen.',
        tags: ['Châu Phi', 'Địa hình', 'Khí hậu'],
        duration: '~20 phút',
        emoji: '🐘',
        ready: false,
      },
    ],
  },
  {
    grade: 8,
    label: 'Lớp 8',
    emoji: '🌐',
    color: '#F59E0B',
    gFrom: '#FCD34D',
    gTo: '#F97316',
    bg: 'rgba(254,243,199,0.6)',
    desc: 'Địa lý tự nhiên Việt Nam',
    lessons: [
      {
        id: 'grade8-bai1',
        title: 'Bài 1: Vị trí địa lý và phạm vi lãnh thổ Việt Nam',
        desc: 'Tọa độ địa lý, đường bờ biển và các vùng lãnh thổ của Việt Nam.',
        tags: ['Lãnh thổ', 'Biển Đông', 'Tọa độ'],
        duration: '~16 phút',
        emoji: '🇻🇳',
        ready: false,
      },
    ],
  },
  {
    grade: 9,
    label: 'Lớp 9',
    emoji: '🇻🇳',
    color: '#EC4899',
    gFrom: '#F472B6',
    gTo: '#F43F5E',
    bg: 'rgba(252,231,243,0.6)',
    desc: 'Địa lý kinh tế – xã hội Việt Nam',
    lessons: [
      {
        id: 'grade9-bai1',
        title: 'Bài 1: Cộng đồng các dân tộc Việt Nam',
        desc: 'Đặc điểm phân bố và nét văn hóa của 54 dân tộc anh em.',
        tags: ['Dân tộc', 'Văn hóa', 'Phân bố'],
        duration: '~14 phút',
        emoji: '🎎',
        ready: false,
      },
    ],
  },
];

export default function LessonsHub() {
  const [activeGrade, setActiveGrade] = useState(6);
  const g = GRADES.find(x => x.grade === activeGrade)!;

  return (
    <main className="pt-28 pb-20 px-4 md:px-8" style={{ maxWidth: '90%', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div className="mb-10 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.9)',
            boxShadow: '0 4px 20px rgba(14,165,233,0.08)',
          }}
        >
          <span className="text-base">📖</span>
          <span className="text-xs font-black text-[#082F49] uppercase tracking-widest">Thư Viện Bài Giảng</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[#082F49] leading-tight">Bài Giảng Địa Lý</h1>
        <p className="text-[#334155] mt-2 text-base">
          Trải nghiệm bài giảng{' '}
          <span className="font-black" style={{ color: g.color }}>Lớp {activeGrade}</span>{' '}
          — Cuộn chữ tương tác, Bản đồ 3D tự bay.
        </p>
      </div>

      {/* ── Grade Tabs ── */}
      <div className="flex justify-center gap-3 mb-12 flex-wrap">
        {GRADES.map(gr => (
          <button
            key={gr.grade}
            onClick={() => setActiveGrade(gr.grade)}
            className="flex items-center gap-2.5 px-5 py-3 rounded-[18px] font-bold text-sm transition-all duration-300 border-2"
            style={
              activeGrade === gr.grade
                ? {
                    background: `linear-gradient(135deg, ${gr.gFrom}22, ${gr.gTo}11)`,
                    borderColor: gr.color,
                    color: gr.color,
                    boxShadow: `0 4px 20px ${gr.color}25`,
                    transform: 'translateY(-1px)',
                  }
                : {
                    background: 'rgba(255,255,255,0.65)',
                    borderColor: 'rgba(255,255,255,0.9)',
                    color: '#94A3B8',
                    backdropFilter: 'blur(12px)',
                  }
            }
          >
            <span className="text-lg">{gr.emoji}</span>
            {gr.label}
          </button>
        ))}
      </div>

      {/* ── Grade Hero Banner ── */}
      <div
        className="rounded-[32px] p-8 mb-10 flex items-center gap-6"
        style={{
          background: `linear-gradient(135deg, ${g.gFrom}22, ${g.gTo}11)`,
          border: `2px solid ${g.color}30`,
          boxShadow: `0 10px 30px ${g.color}15`,
        }}
      >
        <div
          className="w-20 h-20 rounded-[24px] flex items-center justify-center text-5xl shrink-0"
          style={{
            background: `linear-gradient(135deg, ${g.gFrom}, ${g.gTo})`,
            boxShadow: `0 12px 30px ${g.color}40`,
          }}
        >
          {g.emoji}
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: g.color }}>
            Địa lý {g.label}
          </p>
          <h2 className="text-2xl font-black text-[#082F49]">{g.desc}</h2>
          <p className="text-[#94A3B8] text-sm mt-1">{g.lessons.length} bài giảng tương tác</p>
        </div>
      </div>

      {/* ── Lesson Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {g.lessons.map(lesson => (
          <div key={lesson.id} className="relative group">
            {lesson.ready ? (
              <Link href={`/lessons/${lesson.id}`} className="block">
                <LessonCard lesson={lesson} g={g} />
              </Link>
            ) : (
              <div className="cursor-not-allowed opacity-70">
                <LessonCard lesson={lesson} g={g} comingSoon />
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

function LessonCard({
  lesson,
  g,
  comingSoon,
}: {
  lesson: (typeof GRADES)[0]['lessons'][0];
  g: (typeof GRADES)[0];
  comingSoon?: boolean;
}) {
  return (
    <div
      className="rounded-[28px] p-6 h-full flex flex-col gap-4 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-2xl"
      style={{
        background: 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255,255,255,1)',
        boxShadow: `0 10px 30px rgba(14,165,233,0.08)`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div
          className="w-14 h-14 rounded-[20px] flex items-center justify-center text-3xl shrink-0"
          style={{ background: g.bg, border: `1.5px solid ${g.color}30` }}
        >
          {lesson.emoji}
        </div>
        <div className="flex flex-col items-end gap-1">
          {comingSoon && (
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-100 text-slate-400">
              Sắp có
            </span>
          )}
          <span className="text-[11px] font-bold text-[#94A3B8]">⏱ {lesson.duration}</span>
        </div>
      </div>

      {/* Title & desc */}
      <div className="flex-1">
        <h3 className="font-black text-[#082F49] text-lg leading-snug mb-2">{lesson.title}</h3>
        <p className="text-[#334155] text-sm font-medium leading-relaxed">{lesson.desc}</p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {lesson.tags.map(tag => (
          <span
            key={tag}
            className="text-[11px] font-black px-3 py-1 rounded-full"
            style={{ background: g.bg, color: g.color, border: `1px solid ${g.color}30` }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      {!comingSoon && (
        <div
          className="mt-1 w-full py-3 rounded-[16px] text-white font-black text-sm text-center transition-all group-hover:shadow-lg"
          style={{ background: `linear-gradient(135deg, ${g.gFrom}, ${g.gTo})`, boxShadow: `0 6px 16px ${g.color}30` }}
        >
          Bắt đầu học →
        </div>
      )}
    </div>
  );
}
