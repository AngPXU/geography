'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

import { FaGlobeAsia, FaMapMarkedAlt, FaGamepad, FaUsers, FaBell, FaBook, FaUserCircle, FaSignOutAlt, FaCog, FaShieldAlt } from 'react-icons/fa';
import { SettingsDrawer } from '@/components/ui/SettingsDrawer';

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ', icon: '🏠', color: 'text-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  { href: '/classroom', label: 'Lớp học', icon: '🏫', color: 'text-cyan-500', bg: 'bg-cyan-50', dot: 'bg-cyan-500' },
  { href: '/map', label: 'Bản đồ', icon: '🗺️', color: 'text-green-500', bg: 'bg-green-50', dot: 'bg-green-500' },
  { href: '/arena', label: 'Đấu trường', icon: '⚔️', color: 'text-rose-500', bg: 'bg-rose-50', dot: 'bg-rose-500' },
  { href: '/books', label: 'Sách', icon: '📚', color: 'text-violet-500', bg: 'bg-violet-50', dot: 'bg-violet-500' },
  //{ href: '/lessons',  label: 'Bài Giảng', icon: '📖', color: 'text-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
];

export function Navbar({ user }: { user?: { name?: string | null; image?: string | null; role?: number } }) {
  const roleName = user?.role === 1 ? 'Quản trị viên' : user?.role === 2 ? 'Giáo viên' : 'Học sinh';

  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef1 = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setDropdownOpen(false); // Auto close dropdown on scroll
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        (!dropdownRef1.current || !dropdownRef1.current.contains(target)) &&
        (!dropdownRef2.current || !dropdownRef2.current.contains(target))
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const DropdownMenu = () => (
    <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white/95 backdrop-blur-xl border border-white/80 rounded-[20px] shadow-[0_16px_40px_rgba(8,47,73,0.15)] overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
      {/* User info header */}
      <div className="px-4 py-3 bg-gradient-to-br from-cyan-50 to-blue-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {user?.image ? (
            <img src={user.image} alt="Avatar" className="w-10 h-10 rounded-[12px] object-cover shadow-sm border-[2px] border-white" />
          ) : (
            <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-black text-base shadow-sm border-[2px] border-white">
              {(user?.name?.charAt(0) || 'K').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-extrabold text-[#082F49] text-sm truncate">{user?.name || 'Khách'}</p>
            <p className="text-[#94A3B8] text-xs font-semibold">{roleName}</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="p-2">
        <Link
          href="/profile"
          onClick={() => setDropdownOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-semibold text-[#334155] hover:bg-cyan-50 hover:text-cyan-700 transition-colors group"
        >
          <div className="w-7 h-7 rounded-[8px] bg-slate-100 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
            <FaUserCircle className="text-slate-400 group-hover:text-cyan-500 text-xs transition-colors" />
          </div>
          Thông tin cá nhân
        </Link>
        <button
          onClick={() => {
            setDropdownOpen(false);
            setIsSettingsOpen(true);
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-semibold text-[#334155] hover:bg-slate-50 hover:text-slate-700 transition-colors group"
        >
          <div className="w-7 h-7 rounded-[8px] bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
            <FaCog className="text-slate-400 text-xs" />
          </div>
          Cài đặt
        </button>

        <div className="my-2 mx-1 h-px bg-slate-100" />

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors group"
        >
          <div className="w-7 h-7 rounded-[8px] bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
            <FaSignOutAlt className="text-red-400 text-xs" />
          </div>
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} user={user} />
      <style>{`
        /* ---- Full bar ---- */
        .navbar-full {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          padding: 16px 24px;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .navbar-full.hidden-bar {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-12px);
        }

        /* ---- Island pill ---- */
        .navbar-island {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%) scale(0.8);
          z-index: 100;
          opacity: 0;
          pointer-events: none;
          transition:
            opacity 0.4s cubic-bezier(0.34,1.56,0.64,1),
            transform 0.4s cubic-bezier(0.34,1.56,0.64,1);
          white-space: nowrap;
        }
        .navbar-island.visible-island {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) scale(1);
        }

        .island-inner {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(8, 28, 52, 0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 9999px;
          padding: 8px 14px;
          box-shadow: 0 8px 32px rgba(8,47,73,0.25), 0 0 0 0.5px rgba(255,255,255,0.06) inset;
          transition: padding 0.3s ease, gap 0.3s ease;
        }
        .island-inner:hover {
          padding: 8px 20px;
          gap: 10px;
        }
        .island-icon {
          width: 32px; height: 32px;
          border-radius: 9999px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          transition: background 0.2s, transform 0.2s;
          cursor: pointer;
          color: rgba(255,255,255,0.75);
        }
        .island-icon:hover {
          background: rgba(255,255,255,0.12);
          transform: scale(1.15);
          color: white;
        }
        .island-divider {
          width: 1px; height: 18px;
          background: rgba(255,255,255,0.12);
          border-radius: 9999px;
          margin: 0 2px;
          flex-shrink: 0;
        }
        .island-avatar {
          width: 28px; height: 28px;
          border-radius: 9999px;
          background: linear-gradient(135deg, #06b6d4, #22c55e);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 800;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 0 0 2px rgba(6,182,212,0.4);
        }
        .island-notif-dot {
          width: 6px; height: 6px;
          background: #f43f5e;
          border-radius: 9999px;
          position: absolute;
          top: -1px; right: -1px;
          border: 1.5px solid #0f1c2e;
        }

        /* nav link hover underline */
        .nav-link-item {
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link-item::after {
          content: '';
          position: absolute; bottom: -2px; left: 0; right: 0;
          height: 2px; border-radius: 9999px;
          background: currentColor;
          transform: scaleX(0);
          transition: transform 0.25s ease;
        }
        .nav-link-item:hover::after { transform: scaleX(1); }
      `}</style>

      {/* =========== FULL NAVBAR =========== */}
      <nav className={`navbar-full ${scrolled ? 'hidden-bar' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-[24px] border border-white rounded-[24px] px-5 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(14,165,233,0.10),0_2px_8px_rgba(14,165,233,0.06)]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-lg shadow-md group-hover:scale-105 group-hover:shadow-cyan-300/40 transition-all duration-300">
                <FaGlobeAsia />
              </div>
              <div>
                <p className="font-black text-[#082F49] text-lg leading-none tracking-tight">GeoExplore</p>
                <p className="text-[9px] text-cyan-600 font-bold tracking-[0.18em] uppercase mt-0.5">Khám phá Thế giới</p>
              </div>
            </Link>

            {/* Center nav */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-50/80 rounded-[18px] px-2 py-1.5 border border-slate-100">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href}
                  className={`nav-link-item flex items-center gap-2 px-4 py-2 rounded-[14px] text-sm font-bold text-[#334155] hover:${item.color} hover:bg-white hover:shadow-sm transition-all duration-200`}>
                  <span className={`w-6 h-6 rounded-lg ${item.bg} flex items-center justify-center text-sm`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Admin icon — role 1 only */}
              {user?.role === 1 && (
                <Link
                  href="/admin"
                  className="relative w-10 h-10 rounded-[14px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 hover:bg-amber-100 hover:text-amber-600 hover:shadow-md transition-all duration-200 group"
                  title="Quản trị viên"
                >
                  <FaShieldAlt className="text-[15px] group-hover:scale-110 transition-transform" />
                </Link>
              )}

              {/* Notification */}
              <button className="relative w-10 h-10 rounded-[14px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-md transition-all duration-200 group">
                <FaBell className="text-[15px] group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white animate-pulse" />
              </button>

              {/* User pill + dropdown */}
              <div className="relative" ref={dropdownRef1}>
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center gap-2.5 h-10 pl-1.5 pr-4 rounded-[14px] bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-100 cursor-pointer hover:border-cyan-200 hover:shadow-md hover:shadow-cyan-100/50 transition-all duration-200 group"
                >
                  {user?.image ? (
                    <img src={user.image} alt="Avatar" className="w-7 h-7 rounded-[10px] object-cover shadow-sm group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-black shadow-sm group-hover:scale-105 transition-transform">
                      {(user?.name?.charAt(0) || 'K').toUpperCase()}
                    </div>
                  )}
                  <span className="font-bold text-sm text-[#082F49] hidden sm:block truncate max-w-[100px]">
                    {user?.name || 'Khách'}
                  </span>
                  <svg className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-all duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {!scrolled && dropdownOpen && <DropdownMenu />}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* =========== DYNAMIC ISLAND =========== */}
      <div className={`navbar-island ${scrolled ? 'visible-island' : ''}`}
        title="Nhấn để mở rộng menu">
        <div className="island-inner">
          {/* Logo dot */}
          <Link href="/" className="island-icon" title="Trang chủ">
            <FaGlobeAsia />
          </Link>

          <div className="island-divider" />

          {/* Nav icons */}
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className="island-icon" title={item.label}>
              <span style={{ fontSize: 16 }}>{item.icon}</span>
            </Link>
          ))}

          <div className="island-divider" />

          {/* Admin icon in island — role 1 only */}
          {user?.role === 1 && (
            <>
              <div className="island-divider" />
              <Link href="/admin" className="island-icon" title="Quản trị viên"
                style={{ color: '#f59e0b' }}>
                <FaShieldAlt style={{ fontSize: 14 }} />
              </Link>
            </>
          )}

          {/* Bell */}
          <div className="island-icon relative" title="Thông báo">
            <FaBell style={{ fontSize: 14 }} />
            <span className="island-notif-dot" />
          </div>

          {/* Avatar Area inside Island */}
          <div className="relative" ref={dropdownRef2}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="island-avatar ml-1 cursor-pointer overflow-hidden border border-white/20"
              title={user?.name || 'Khách'}
            >
              {user?.image ? (
                <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(user?.name?.charAt(0) || 'K').toUpperCase()}</span>
              )}
            </button>
            {scrolled && dropdownOpen && (
              <div className="absolute top-[100%] right-0 pt-3">
                <DropdownMenu />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
