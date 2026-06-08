'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target, LineChart,
} from 'lucide-react';

const MOBILE_NAV = [
  { href: '/',             label: 'Home',    Icon: LayoutDashboard  },
  { href: '/transactions', label: 'Txns',    Icon: ArrowLeftRight   },
  { href: '/budgets',      label: 'Budgets', Icon: PieChart         },
  { href: '/goals',        label: 'Goals',   Icon: Target           },
  { href: '/analytics',    label: 'Insights',Icon: LineChart        },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 safe-area-bottom">
      <ul className="flex">
        {MOBILE_NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                  active ? 'text-primary-600' : 'text-slate-400',
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
