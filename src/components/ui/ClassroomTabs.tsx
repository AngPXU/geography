'use client';

import { useState } from 'react';
import { ClassroomClient } from './ClassroomClient';
import { HomeClassClient } from './HomeClassClient';

interface Props {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: number;
    username?: string;
    exp?: number;
    level?: number;
  };
}

export function ClassroomTabs({ user }: Props) {
  const [tab, setTab] = useState<'online' | 'home'>('online');

  const tabs = [
    { key: 'online' as const, label: 'Lớp học online',  icon: '🏫' },
    { key: 'home'   as const, label: 'Lớp học ở nhà',   icon: '🏡' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div
        className="flex items-center gap-2 p-1.5 rounded-2xl w-fit"
        style={{
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,1)',
          boxShadow: '0 10px 30px rgba(14,165,233,0.08)',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-300 ease-in-out
              ${tab === t.key
                ? 'bg-gradient-to-r from-[#06B6D4] to-[#22C55E] text-white shadow-md'
                : 'text-[#334155] hover:bg-sky-50'
              }
            `}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'online' && <ClassroomClient user={user} />}
        {tab === 'home'   && <HomeClassClient user={user} />}
      </div>
    </div>
  );
}
