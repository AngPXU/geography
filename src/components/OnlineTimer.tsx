'use client';

import { useEffect, useRef } from 'react';
import { trackMission } from '@/utils/missionTracker';

/**
 * Invisible component — every 60 s it notifies the server that the user
 * is still online, advancing the "online-20" daily mission by 1 minute.
 * Mount once in the root layout or any persistent wrapper.
 */
export function OnlineTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Fire immediately after 1 minute, then every minute
    intervalRef.current = setInterval(() => {
      trackMission('online-20', 1);
    }, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
