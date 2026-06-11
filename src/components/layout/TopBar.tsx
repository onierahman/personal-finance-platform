'use client';
import { useRef, useState } from 'react';
import { Menu, Plus, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '@/stores/uiStore';
import { formatMonth, currentYearMonth } from '@/lib/formatters';
import { useScrolled } from '@/hooks/useScrolled';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const SWIPE_THRESHOLD = 56; // px of horizontal travel to commit a month change

export function TopBar() {
  const { toggleSidebar, openQuickAdd, activeMonth, setActiveMonth, theme, toggleTheme } = useUiStore();
  const scrolled       = useScrolled(8);
  const isCurrentMonth = activeMonth === currentYearMonth();

  // Direction of the most recent month change drives the label slide animation.
  // State (not a ref) so it can be safely read during render for the transition.
  const [dir, setDir]  = useState<1 | -1>(1);
  const touchStart     = useRef<{ x: number; y: number } | null>(null);

  function goPrev() { setDir(-1); haptic('light'); setActiveMonth(prevMonth(activeMonth)); }
  function goNext() { setDir(1);  haptic('light'); setActiveMonth(nextMonth(activeMonth)); }

  // Horizontal swipe anywhere on the bar changes month (Apple Calendar style).
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx > 0) goPrev();  // swipe right → previous month
    else        goNext();  // swipe left  → next month
  }

  return (
    <header
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className={cn(
        'h-16 flex items-center justify-between px-2 lg:px-6 sticky top-0 z-40 transition-colors duration-200',
        scrolled
          ? 'glass border-b border-slate-200/70 dark:border-slate-800/70'
          : 'bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800',
      )}
    >
      {/* Left: hamburger (mobile) + month navigator */}
      <div className="flex items-center gap-1 lg:gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden tap-target flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-0.5">
          <button
            onClick={goPrev}
            className="tap-target flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month label slides in the direction of travel on change */}
          <div className="relative overflow-hidden h-8 flex items-center min-w-[7.5rem] justify-center">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.button
                key={activeMonth}
                onClick={() => { haptic('light'); setActiveMonth(currentYearMonth()); }}
                initial={{ x: dir * 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: dir * -20, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={cn(
                  'px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                  isCurrentMonth
                    ? 'text-primary-700 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {formatMonth(activeMonth)}
              </motion.button>
            </AnimatePresence>
          </div>

          <button
            onClick={goNext}
            className="tap-target flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: notifications + theme toggle + quick-add */}
      <div className="flex items-center gap-1 lg:gap-2">
        <NotificationBell />
        <button
          onClick={() => { haptic('light'); toggleTheme(); }}
          className="tap-target flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => { haptic('medium'); openQuickAdd('expense'); }}
          className="flex items-center gap-1.5 px-4 h-10 min-h-[44px] rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </div>
    </header>
  );
}
