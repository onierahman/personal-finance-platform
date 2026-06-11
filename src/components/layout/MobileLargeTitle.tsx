'use client';
import { usePathname } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { getPageTitle, showsMobileLargeTitle } from '@/lib/constants';

/**
 * iOS-style large title that sits below the sticky top bar and collapses as
 * the user scrolls — fading and lifting away while the compact title in the
 * TopBar fades in (see TopBar). Mobile only; desktop pages keep their own
 * in-page headings.
 */
export function MobileLargeTitle() {
  const pathname = usePathname();
  const title    = getPageTitle(pathname);
  const { scrollY } = useScroll();

  // Fade + lift the large title out over the first 48px of scroll.
  const opacity = useTransform(scrollY, [0, 48], [1, 0]);
  const y       = useTransform(scrollY, [0, 48], [0, -8]);

  // Only the dashboard uses the large title — other pages have their own header.
  if (!showsMobileLargeTitle(pathname)) return null;

  return (
    <motion.div
      style={{ opacity, y }}
      className="lg:hidden px-4 pt-3 pb-1"
    >
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
    </motion.div>
  );
}
