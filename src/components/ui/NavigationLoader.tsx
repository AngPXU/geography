'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPathRef = useRef(pathname);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Phát hiện khi user nhấn link → chờ 150ms rồi mới bật loading.
  // Tránh flicker overlay với route đã prefetch (chuyển trang gần như tức thời).
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href') ?? '';
      if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return;
      if (anchor.target === '_blank') return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === pathname && url.search === window.location.search) return;
      } catch {
        return;
      }

      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      showTimerRef.current = setTimeout(() => setLoading(true), 150);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  // Khi pathname đổi → tắt loading ngay (không hold thêm) để cảm giác snappy.
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      setLoading(false);
    }
  }, [pathname]);

  // Bảo hiểm: tự tắt sau 8 giây nếu navigation thất bại
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="nav-loader-overlay">
      <div className="nav-loader-card">
        <div className="nav-loader-spinner" />
        <p className="nav-loader-text">Đang tải...</p>
      </div>

      <style>{`
        .nav-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: nav-fadein 0.15s ease-out;
        }

        .nav-loader-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem 2.5rem;
          border-radius: 1.5rem;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 1);
          box-shadow: 0 12px 40px rgba(14, 165, 233, 0.18);
          animation: nav-scalein 0.2s ease-out;
        }

        .nav-loader-spinner {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 4px solid rgba(6, 182, 212, 0.2);
          border-top-color: #06B6D4;
          animation: nav-spin 0.75s linear infinite;
        }

        .nav-loader-text {
          color: #082F49;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.025em;
          margin: 0;
        }

        /* Mobile: bỏ hoàn toàn backdrop-filter (rất nặng GPU) + bỏ animation scale */
        @media (max-width: 768px) {
          .nav-loader-overlay {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: rgba(255, 255, 255, 0.7);
            animation: none;
          }
          .nav-loader-card {
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            background: #ffffff;
            box-shadow: 0 8px 24px rgba(14, 165, 233, 0.15);
            animation: none;
          }
        }

        @keyframes nav-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes nav-fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes nav-scalein {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}