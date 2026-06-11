'use client';
import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface PullToRefreshProps {
  /** Called when the user pulls past the threshold. Await your refetch here. */
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
  /** Pixels the user must pull before a release triggers a refresh. */
  threshold?: number;
}

const MAX_PULL = 120; // hard cap so the rubber-band can't drag forever

/**
 * iOS-style pull-to-refresh. Engages only when the page is scrolled to the
 * very top and the user drags downward, applying rubber-band resistance and a
 * custom spinner that matches the design system. No-ops for mouse users.
 */
export function PullToRefresh({ onRefresh, children, threshold = 70 }: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY       = useRef<number | null>(null);
  const armed        = useRef(false);     // did the gesture start at scrollTop 0?
  const passedThresh = useRef(false);     // for one-shot haptic
  const pullRef      = useRef(0);         // latest pull distance, for the touchend closure
  const [pull, setPull]             = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    function onTouchStart(e: TouchEvent) {
      if (refreshing) return;
      // Only arm at the very top of the page.
      armed.current = window.scrollY <= 0;
      startY.current = e.touches[0].clientY;
      passedThresh.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (!armed.current || startY.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      // Rubber-band: resistance grows as you pull further.
      const damped = Math.min(MAX_PULL, delta * 0.5);
      // Stop the page from scroll-bouncing while we own the gesture.
      if (e.cancelable) e.preventDefault();
      pullRef.current = damped;
      setPull(damped);

      if (!passedThresh.current && damped >= threshold) {
        passedThresh.current = true;
        haptic('light');
      } else if (passedThresh.current && damped < threshold) {
        passedThresh.current = false;
      }
    }

    async function onTouchEnd() {
      if (!armed.current || startY.current === null) return;
      startY.current = null;
      armed.current = false;

      if (pullRef.current >= threshold && !refreshing) {
        setRefreshing(true);
        pullRef.current = threshold;
        setPull(threshold); // snap to the resting spinner position
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          pullRef.current = 0;
          setPull(0);
        }
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
    // onRefresh/threshold are stable enough; refreshing read via closure is fine
    // because the listeners re-bind on each refreshing change.
  }, [onRefresh, threshold, refreshing]);

  const progress = Math.min(1, pull / threshold);

  return (
    <div ref={containerRef}>
      {/* Indicator sits above the content and is revealed by the translate. */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: pull, transition: refreshing || pull === 0 ? 'height 0.25s ease' : 'none' }}
        aria-hidden={pull === 0}
      >
        <RefreshCw
          className={cn(
            'w-5 h-5 text-primary-600 dark:text-primary-400',
            refreshing && 'animate-spin',
          )}
          style={{
            opacity: progress,
            transform: refreshing ? undefined : `rotate(${progress * 270}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}
