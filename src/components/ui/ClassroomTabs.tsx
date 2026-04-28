'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ClassroomClient } from './ClassroomClient';
import { HomeClassClient } from './HomeClassClient';
import { OldLessonCheckClient } from './OldLessonCheckClient';
import { PresentationManagerClient } from './PresentationManagerClient';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  type TabKey = 'online' | 'home' | 'test' | 'presentation';

  const defaultTab = (searchParams.get('tab') as TabKey) || 'online';
  const [tab, setTab] = useState<TabKey>(defaultTab);

  // Sync tab state with URL parameter on mount and when URL changes
  useEffect(() => {
    const currentTab = searchParams.get('tab') as TabKey;
    if (currentTab && currentTab !== tab) {
      setTab(currentTab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: TabKey) => {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', newTab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
  
  const tabs: Array<{ key: TabKey, label: string, icon: string }> = [
    { key: 'online',       label: 'Lớp học online',  icon: '🏫' },
    { key: 'home',         label: 'Lớp học ở nhà',   icon: '🏡' },
    { key: 'test',         label: 'Kiểm tra bài cũ', icon: '📝' },
    { key: 'presentation', label: 'Soạn bài giảng',  icon: '📽️' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar */}
      <div
        className="flex items-center gap-2 p-1.5 rounded-full w-fit relative z-20"
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1), inset 0 1px 0 rgba(255, 255, 255, 1)',
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold
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
        {tab === 'online'       && <ClassroomClient user={user} />}
        {tab === 'home'         && <HomeClassClient user={user} />}
        {tab === 'test'         && <OldLessonCheckClient user={user} />}
        {tab === 'presentation' && <PresentationManagerClient />}
      </div>
    </div>
  );
}
