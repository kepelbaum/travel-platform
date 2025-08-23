'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTripPlanningStore } from '@/store/tripPlanning';

export function NavigationHandler() {
  const pathname = usePathname();
  const { clearActiveTrip } = useTripPlanningStore();

  useEffect(() => {
    if (!pathname.includes('/destinations')) {
      clearActiveTrip();
    }
  }, [pathname, clearActiveTrip]);

  return null;
}
