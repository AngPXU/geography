'use client';

import { useState, useEffect, useRef } from 'react';
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Tab bar container with indicators */}
      <div className="relative w-full lg:w-fit group max-w-full">
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-cyan-50/90 to-transparent z-30 pointer-events-none flex items-center lg:hidden">
            <button 
              onClick={(e) => { e.preventDefault(); scrollBy(-150); }}
              className="pointer-events-auto ml-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-slate-500 font-bold active:scale-95"
            >
              {'<'}
            </button>
          </div>
        )}

        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-cyan-50/90 to-transparent z-30 pointer-events-none flex items-center justify-end lg:hidden">
            <button 
              onClick={(e) => { e.preventDefault(); scrollBy(150); }}
              className="pointer-events-auto mr-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center text-slate-500 font-bold active:scale-95"
            >
              {'>'}
            </button>
          </div>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="w-full overflow-x-auto pb-4 -mb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div
            className="inline-flex items-center gap-2 p-1.5 rounded-[24px] lg:rounded-full min-w-min relative z-20"
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
                  flex items-center justify-center gap-2 px-5 py-3 lg:py-2.5 rounded-[18px] lg:rounded-full text-sm font-semibold shrink-0
                  transition-all duration-300 ease-in-out
                  ${tab === t.key
                    ? 'bg-gradient-to-r from-[#06B6D4] to-[#22C55E] text-white shadow-md scale-105'
                    : 'text-[#334155] hover:bg-sky-50'
                  }
                `}
              >
                <span className="text-base">{t.icon}</span>
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div>
        {tab === 'online'       && <ClassroomClient user={user} />}
        {tab === 'home'         && <HomeClassClient user={user} />}
        {tab === 'test'         && <OldLessonCheckClient user={user} />}
        {tab === 'presentation' && (
          (user.role === 1 || user.role === 2)
            ? <PresentationManagerClient />
            : (
              <div className="text-center py-20 rounded-[32px]" style={{ background: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 20px 40px rgba(14, 165, 233, 0.1)' }}>
                <div className="text-6xl mb-4">👨‍🏫</div>
                <p className="font-bold text-[#082F49] text-xl mb-2">Phần này dành cho giáo viên</p>
                <p className="text-[#94A3B8]">Giáo viên sẽ sử dụng tính năng này để soạn và trình chiếu bài giảng trên lớp học.</p>
              </div>
            )
        )}
      </div>
    </div>
  );
}
