'use client';

import { useEffect } from 'react';

/**
 * Suppress các warning đã biết từ THREE.js r183 mà không thể fix ở phía user code
 * vì chúng được phát ra nội bộ bởi @react-three/fiber và @react-three/drei.
 *
 * - THREE.Clock: deprecated → THREE.Timer (dùng nội bộ bởi r3f render loop)
 * - PCFSoftShadowMap: deprecated → PCFShadowMap (dùng nội bộ bởi một số drei helper)
 */
export default function ThreeWarningSuppress() {
  useEffect(() => {
    const originalWarn = console.warn.bind(console);
    const SUPPRESSED = [
      'THREE.Clock: This module has been deprecated',
      'PCFSoftShadowMap has been deprecated',
    ];
    console.warn = (...args: any[]) => {
      const msg = args[0];
      if (typeof msg === 'string' && SUPPRESSED.some(s => msg.includes(s))) return;
      originalWarn(...args);
    };
    return () => {
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
