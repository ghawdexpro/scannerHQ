import { useEffect, useRef } from 'react';
import { trackScrollDepth } from '@/lib/analytics/tracking';

const SCROLL_THRESHOLDS = [25, 50, 75, 100];

export const useScrollTracking = () => {
  const trackedDepths = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Exit early if there's no scrollable content (prevents division by zero)
      if (docHeight <= 0) {
        return;
      }

      // Calculate scroll percentage with bounds clamping
      const rawPercent = (scrollTop / docHeight) * 100;
      const scrollPercent = Math.round(Math.min(100, Math.max(0, rawPercent)));

      // Track each threshold only once
      SCROLL_THRESHOLDS.forEach((threshold) => {
        if (scrollPercent >= threshold && !trackedDepths.current.has(threshold)) {
          trackedDepths.current.add(threshold);
          trackScrollDepth(threshold);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
};
