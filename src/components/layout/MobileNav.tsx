'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useTabBadges } from '@/hooks/useTabBadges';
import { DASHBOARD_PATHS } from '@/lib/constants';
import {
  LayoutDashboard, ArrowLeftRight, Landmark, PieChart, Target,
} from 'lucide-react';

const MOBILE_NAV = [
  { href: '/',             label: 'Home',     Icon: LayoutDashboard },
  { href: '/transactions', label: 'Txns',     Icon: ArrowLeftRight  },
  { href: '/accounts',     label: 'Accounts', Icon: Landmark        },
  { href: '/budgets',      label: 'Budgets',  Icon: PieChart        },
  { href: '/goals',        label: 'Goals',    Icon: Target          },
];

export function MobileNav() {
  const pathname = usePathname();
  const badges   = useTabBadges();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-200/70 dark:border-slate-800/70 safe-area-bottom">
      <ul className="flex">
        {MOBILE_NAV.map(({ href, label, Icon }) => {
          const active = href === '/'
            ? DASHBOARD_PATHS.includes(pathname)            // Home owns / and /dashboard
            : pathname === href || pathname.startsWith(href);
          const hasBadge = badges.has(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={() => haptic('light')}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center justify-center h-14 tap-target transition-colors',
                  active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500',
                )}
              >
                {/* Sliding capsule — encloses both icon and label, slides between tabs */}
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-x-1.5 top-1.5 bottom-1.5 rounded-2xl bg-primary-50 dark:bg-primary-900/40"
                  />
                )}

                {/* Icon + label stacked together inside the capsule.
                    The label's height is always reserved (even when hidden) so
                    every tab's icon stays on the same baseline. */}
                <span className="relative z-10 flex flex-col items-center justify-center gap-0.5">
                  <motion.span
                    className="relative"
                    initial={false}
                    animate={{ scale: active ? 1.06 : 1 }}
                    whileTap={{ scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  >
                    <Icon className="w-5 h-5" />
                    {hasBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-slate-900"
                        aria-hidden="true"
                      />
                    )}
                  </motion.span>

                  {/* Label — only the active tab shows its name (iOS-style) */}
                  <span className="h-3.5 flex items-center">
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          key="label"
                          initial={{ opacity: 0, y: 3 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 3 }}
                          transition={{ duration: 0.18 }}
                          className="text-[10px] font-semibold leading-none whitespace-nowrap"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
