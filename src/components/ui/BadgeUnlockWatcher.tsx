'use client';

/**
 * BadgeUnlockWatcher
 * -----------------------------------------------------------------
 * Mount once in root layout (client component).
 * Polls /api/user/profile every 30s to get latest exp & streak,
 * then compares against localStorage to detect newly unlocked badges.
 * Shows the full BadgeUnlockModal via portal, globally, on any page.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BADGES, Badge, checkUnlocked as checkBadgeUnlocked } from '@/data/badges';

// ─── localStorage helpers ──────────────────────────────────────────────────────
const SEEN_KEY = 'geo_seen_badges';

export function getSeenBadgeIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function markBadgesSeen(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSeenBadgeIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem(SEEN_KEY, JSON.stringify([...current]));
  } catch {}
}

// ─── Unlock Modal ──────────────────────────────────────────────────────────────
export function BadgeUnlockModal({ badge, onConfirm }: { badge: Badge; onConfirm: () => void }) {
  const [phase, setPhase] = useState<'grey' | 'reveal' | 'glow'>('grey');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 700);
    const t2 = setTimeout(() => setPhase('glow'),   1700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const CONFETTI_COLORS = ['#06B6D4','#22C55E','#F59E0B','#EC4899','#8B5CF6','#F97316'];

  // Resolve gradient colours from Tailwind class string
  const resolveGradient = (color: string) => {
    if (color.includes('yellow'))  return '#FBBF24, #F59E0B';
    if (color.includes('green'))   return '#34D399, #10B981';
    if (color.includes('emerald')) return '#34D399, #059669';
    if (color.includes('rose'))    return '#FB7185, #F43F5E';
    if (color.includes('violet'))  return '#A78BFA, #7C3AED';
    if (color.includes('amber'))   return '#FCD34D, #F59E0B';
    if (color.includes('purple'))  return '#C084FC, #9333EA';
    if (color.includes('orange'))  return '#FB923C, #EA580C';
    if (color.includes('pink'))    return '#F472B6, #DB2777';
    if (color.includes('indigo'))  return '#818CF8, #4F46E5';
    if (color.includes('teal'))    return '#2DD4BF, #0D9488';
    if (color.includes('red'))     return '#F87171, #DC2626';
    if (color.includes('sky'))     return '#38BDF8, #0EA5E9';
    if (color.includes('fuchsia')) return '#E879F9, #C026D3';
    if (color.includes('slate') || color.includes('gray')) return '#94A3B8, #64748B';
    return '#22D3EE, #06B6D4';
  };

  const css = `
    @keyframes _badge-grey-in   { 0%{transform:scale(0.3) rotate(-15deg);opacity:0;filter:grayscale(1)} 65%{transform:scale(1.1) rotate(6deg);opacity:1;filter:grayscale(1)} 100%{transform:scale(1) rotate(0deg);opacity:1;filter:grayscale(1)} }
    @keyframes _badge-reveal     { 0%{filter:grayscale(1) brightness(.7);transform:scale(1)} 45%{filter:grayscale(.2) brightness(1.25);transform:scale(1.14) rotate(3deg)} 75%{filter:grayscale(0) brightness(1.05);transform:scale(.97) rotate(-1deg)} 100%{filter:grayscale(0) brightness(1);transform:scale(1) rotate(0)} }
    @keyframes _badge-glow-ring  { 0%,100%{box-shadow:0 0 28px 8px rgba(6,182,212,.45),0 20px 60px rgba(6,182,212,.25)} 50%{box-shadow:0 0 60px 22px rgba(6,182,212,.7),0 30px 80px rgba(6,182,212,.4)} }
    @keyframes _shimmer          { 0%{transform:translateX(-120%) rotate(25deg);opacity:0} 40%{opacity:1} 100%{transform:translateX(320%) rotate(25deg);opacity:0} }
    @keyframes _confetti-fall    { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(640px) rotate(720deg);opacity:0} }
    @keyframes _backdrop-in      { from{opacity:0} to{opacity:1} }
    @keyframes _card-in          { from{transform:scale(0.65) translateY(50px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
    @keyframes _text-in          { from{transform:translateY(18px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes _star-pop         { 0%{transform:scale(0) rotate(-30deg);opacity:0} 65%{transform:scale(1.3) rotate(10deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
  `;

  const modal = (
    <div style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', animation:'_backdrop-in .35s ease forwards' }}>
      <style>{css}</style>

      {/* Backdrop */}
      <div
        style={{ position:'absolute', inset:0, background:'rgba(8,47,73,0.6)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}
        onClick={phase === 'glow' ? onConfirm : undefined}
      />

      {/* Confetti */}
      {phase === 'glow' && Array.from({ length: 32 }).map((_, i) => (
        <div key={i} style={{
          position:'absolute', top:`${Math.random()*30}%`, left:`${Math.random()*100}%`,
          width:`${6+Math.random()*9}px`, height:`${6+Math.random()*9}px`,
          borderRadius: Math.random() > .5 ? '50%' : '3px',
          background: CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)],
          animation:`_confetti-fall ${1.4+Math.random()*2}s ${Math.random()*.6}s ease-in forwards`,
          pointerEvents:'none',
        }} />
      ))}

      {/* Card */}
      <div style={{
        position:'relative', zIndex:1,
        background:'rgba(255,255,255,0.93)',
        backdropFilter:'blur(32px)', WebkitBackdropFilter:'blur(32px)',
        border:'2.5px solid rgba(255,255,255,1)',
        borderRadius:'44px', padding:'52px 44px 44px',
        maxWidth:'400px', width:'90vw', textAlign:'center',
        boxShadow:'0 40px 80px rgba(8,47,73,0.2), inset 0 1px 0 rgba(255,255,255,1)',
        animation:'_card-in .5s cubic-bezier(.34,1.56,.64,1) forwards',
      }}>
        {/* Top accent line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', borderRadius:'44px 44px 0 0', background:`linear-gradient(90deg, transparent, ${CONFETTI_COLORS[0]}, transparent)` }} />

        {/* Label */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px 16px', borderRadius:'9999px', background:'rgba(6,182,212,.1)', border:'1px solid rgba(6,182,212,.3)', color:'#0284C7', fontWeight:800, fontSize:'11px', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'24px', animation:'_text-in .5s .1s ease both' }}>
          ✨ Huy hiệu mới mở khoá!
        </div>

        {/* Badge icon */}
        <div style={{ position:'relative', display:'inline-flex', marginBottom:'24px' }}>
          {phase === 'glow' && (
            <div style={{ position:'absolute', inset:'-18px', borderRadius:'50%', animation:'_badge-glow-ring 2s ease-in-out infinite' }} />
          )}
          {phase === 'glow' && ['⭐','✨','💫'].map((s, i) => (
            <div key={i} style={{
              position:'absolute', fontSize:'22px',
              top: i===0 ? '-34px' : i===1 ? '50%' : 'auto',
              bottom: i===2 ? '-28px' : 'auto',
              left: i===1 ? '-40px' : '50%',
              right: i===2 ? '-36px' : 'auto',
              transform: i===0 ? 'translateX(-50%)' : undefined,
              animation:`_star-pop .5s ${i*.15}s cubic-bezier(.34,1.56,.64,1) both`,
            }}>{s}</div>
          ))}
          <div style={{
            width:'144px', height:'144px', borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'68px', border:'5px solid white', position:'relative', overflow:'hidden',
            background: phase==='grey' ? 'linear-gradient(135deg,#cbd5e1,#94a3b8)' : `linear-gradient(135deg,${resolveGradient(badge.color)})`,
            animation: phase==='grey' ? '_badge-grey-in .65s cubic-bezier(.34,1.56,.64,1) both' : phase==='reveal' ? '_badge-reveal .9s ease forwards' : 'none',
            boxShadow: phase==='glow' ? `0 12px 40px rgba(6,182,212,.4)` : '0 10px 30px rgba(0,0,0,.14)',
            filter: phase==='grey' ? 'grayscale(1)' : 'none', transition:'filter .4s ease',
          }}>
            {phase==='reveal' && (
              <div style={{ position:'absolute', top:'-20%', left:'-20%', width:'40%', height:'140%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent)', animation:'_shimmer 1.1s .15s ease forwards', pointerEvents:'none' }} />
            )}
            <span style={{ position:'relative', zIndex:1, filter:phase==='grey'?'grayscale(1)':'none', transition:'filter .4s ease' }}>
              {phase==='grey' ? '🔒' : badge.icon}
            </span>
          </div>
        </div>

        {/* Badge info */}
        <div style={{ animation:'_text-in .5s .35s ease both' }}>
          <h2 style={{ fontSize:'26px', fontWeight:900, color:'#082F49', letterSpacing:'-.02em', marginBottom:'8px' }}>{badge.name}</h2>
          <p style={{ fontSize:'15px', fontWeight:600, color:'#334155', lineHeight:1.5, marginBottom:'32px' }}>{badge.description}</p>
        </div>

        {/* CTA button */}
        <button
          onClick={onConfirm}
          style={{
            width:'100%', height:'56px', borderRadius:'9999px', border:'none',
            background:'linear-gradient(135deg,#06B6D4,#3B82F6)',
            color:'white', fontWeight:900, fontSize:'17px', cursor:'pointer',
            boxShadow:'0 10px 24px rgba(6,182,212,.4)',
            opacity: phase==='glow' ? 1 : 0,
            transform: phase==='glow' ? 'translateY(0)' : 'translateY(12px)',
            transition:'all .5s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          🎉 Tuyệt vời!
        </button>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}

// ─── Watcher (mounts globally) ─────────────────────────────────────────────────
interface UserStats {
  exp: number;
  streak: number;
}

export function BadgeUnlockWatcher() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pendingBadge, setPendingBadge] = useState<Badge | null>(null);
  const [pendingQueue, setPendingQueue] = useState<Badge[]>([]);

  const detectNew = useCallback((s: UserStats) => {
    const seen = getSeenBadgeIds();
    const unlocked = BADGES.filter((b) => checkBadgeUnlocked(b, s.exp, s.streak));
    const fresh = unlocked.filter((b) => !seen.has(b.id));
    if (fresh.length === 0) return;
    markBadgesSeen(fresh.map((b) => b.id));
    setPendingBadge(fresh[0]);
    setPendingQueue(fresh.slice(1));
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) return;
      const data = await res.json() as { user?: { exp?: number; streak?: number } };
      const s: UserStats = { exp: data.user?.exp ?? 0, streak: data.user?.streak ?? 0 };
      setStats(s);
      detectNew(s);
    } catch {}
  }, [detectNew]);

  useEffect(() => {
    setMounted(true);
    fetchStats();
    const iv = setInterval(fetchStats, 30_000);
    return () => clearInterval(iv);
  }, [fetchStats]);

  const handleConfirm = () => {
    if (pendingQueue.length > 0) {
      setPendingBadge(pendingQueue[0]);
      setPendingQueue((q) => q.slice(1));
    } else {
      setPendingBadge(null);
    }
  };

  if (!mounted || !pendingBadge) return null;
  return <BadgeUnlockModal badge={pendingBadge} onConfirm={handleConfirm} />;
}
