'use client';
import { useEffect, useState } from 'react';

/**
 * Returns true once the window has scrolled past `threshold` px.
 * Used to drive the iOS-style frosted nav bar and collapsing title.
 * Reads scroll position passively to stay off the main-thread hot path.
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold);
    }
    onScroll(); // sync initial state (e.g. restored scroll position)
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}
