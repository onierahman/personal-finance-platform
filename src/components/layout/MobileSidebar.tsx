'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { useUiStore } from '@/stores/uiStore';
import { useUser } from '@/hooks/useUser';
import { logout } from '@/features/auth/bak.api';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  TrendingUp, BarChart3, RefreshCw, LineChart, Landmark,
  LogOut, Settings, Wallet, X,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  TrendingUp, BarChart3, RefreshCw, LineChart, Landmark,
};

export function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  function close() { setSidebarOpen(false); }

  async function handleLogout() {
    close();
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-200',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className={cn(
        'lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-200 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">FinanceOS</span>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = ICON_MAP[item.icon];
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500')} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-2 space-y-0.5">
          <Link
            href="/settings"
            onClick={close}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            Settings
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            Sign out
          </button>

          {user && (
            <div className="flex items-center gap-2.5 px-3 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
