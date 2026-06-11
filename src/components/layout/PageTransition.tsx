'use client';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

/**
 * Wraps page content in an iOS-style "push" entrance: each route slides in
 * from the right with a subtle fade as the pathname changes.
 *
 * We key on `pathname` so React remounts (and re-animates) on every
 * navigation. We deliberately use an entrance-only animation rather than
 * AnimatePresence exit transitions — the Next.js App Router unmounts the old
 * tree before the new one paints, so exit animations there are unreliable and
 * janky. An entrance slide gives the native "new screen pushed on" feel
 * without fighting the router.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
      // Avoid creating a horizontal scrollbar while the slide settles.
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
