'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Sends seconds to /api/study-time.
 * Uses sendBeacon on unload (survives tab close), fetch otherwise.
 */
function syncToServer(seconds: number) {
  const body = JSON.stringify({ seconds });
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/study-time', blob);
    } else {
      fetch('/api/study-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch { /* silent */ }
}

/**
 * Tracks how many seconds the user has actively viewed the page today.
 * - Pauses when the tab is hidden (visibilitychange → hidden).
 * - Resumes when the tab becomes visible again.
 * - Syncs to DB every 30 s while active, and immediately on pause/unload.
 * - On unmount (SPA navigation) the session is also paused & synced.
 *
 * @param initialSeconds  Value loaded from the server (already saved today).
 * @returns               Real-time total seconds for today.
 */
export function useStudyTimer(initialSeconds = 0): number {
  const [displaySecs, setDisplaySecs] = useState(initialSeconds);

  // base = accumulated seconds persisted at last pause
  const baseRef = useRef(initialSeconds);
  // start = Date.now() when the current visible session began (null = paused)
  const startRef = useRef<number | null>(null);

  // ── Pause: finalise current session, sync to DB ──────────────────────────
  const pause = useCallback(() => {
    if (startRef.current !== null) {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      baseRef.current += elapsed;
      startRef.current = null;
      setDisplaySecs(baseRef.current);
      syncToServer(baseRef.current);
    }
  }, []);

  // ── Resume: start a new active session ───────────────────────────────────
  const resume = useCallback(() => {
    if (startRef.current === null) {
      startRef.current = Date.now();
    }
  }, []);

  // ── Tick: update display every second while active ───────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (startRef.current !== null) {
        setDisplaySecs(
          baseRef.current + Math.floor((Date.now() - startRef.current) / 1000)
        );
      }
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  // ── Periodic background sync every 30 s (without pausing) ───────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (startRef.current !== null) {
        const total =
          baseRef.current + Math.floor((Date.now() - startRef.current) / 1000);
        syncToServer(total);
      }
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Visibility change ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = () => (document.hidden ? pause() : resume());
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [pause, resume]);

  // ── Tab / browser close ──────────────────────────────────────────────────
  useEffect(() => {
    window.addEventListener('pagehide', pause);
    window.addEventListener('beforeunload', pause);
    return () => {
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('beforeunload', pause);
    };
  }, [pause]);

  // ── Start on mount; pause on SPA unmount ────────────────────────────────
  useEffect(() => {
    if (!document.hidden) resume();
    return () => pause();
  }, [pause, resume]);

  return displaySecs;
}
