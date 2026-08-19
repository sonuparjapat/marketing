'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import apiClient from '@/lib/apiClient';

export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    apiClient.post('/track/pageview', { path: pathname, referrer: document.referrer || null }).catch(() => {});
  }, [pathname]);

  return null;
}
