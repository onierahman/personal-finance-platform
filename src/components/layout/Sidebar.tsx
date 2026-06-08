'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { useUser } from '@/hooks/useUser';
import { logout } from '@/features/auth/bak.api';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  TrendingUp, BarChart3, RefreshCw, LineChart,
  LogOut, Settings, Wallet,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  TrendingUp, BarChart3, RefreshCw, LineChart,
};

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const router   = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 bg-white border-r border-slate-100 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold text-slate-900 tracking-tight">FinanceOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon   = ICON_MAP[item.icon];
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-primary-600' : 'text-slate-400')} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Settings
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          Sign out
        </button>

        {user && (
          <div className="flex items-center gap-2.5 px-3 pt-3 mt-1 border-t border-slate-100">
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
