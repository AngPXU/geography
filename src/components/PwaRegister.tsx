'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Im lặng — SW failure không nên làm app crash hoặc spam console production
      });
    };

    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  return null;
}