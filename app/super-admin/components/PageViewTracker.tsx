'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackersApi } from '@/lib/api';

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    trackersApi.trackView(pathname, {
      source: 'admin-dashboard',
      section: 'super-admin',
      tracked_at: new Date().toISOString(),
    }).catch(() => {
      // Tracking failures should never block dashboard usage.
    });
  }, [pathname]);

  return null;
}
