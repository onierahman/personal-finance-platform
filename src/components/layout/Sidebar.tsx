'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/constants';
import { useUser } from '@/hooks/useUser';
import { logout } from '@/features/auth/bak.api';
import { useRouter } from 'next/navigation';
import { useUiStore } from '@/stores/uiStore';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  TrendingUp, BarChart3, RefreshCw, LineChart, Landmark,
  LogOut, Settings, Wallet, ChevronLeft, ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  TrendingUp, BarChart3, RefreshCw, LineChart, Landmark,
};

export function Sidebar() {
  const pathname  = usePathname();
  const { user }  = useUser();
  const router    = useRouter();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();

  async function handleLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className={cn(
      'hidden lg:flex flex-col h-screen fixed left-0 top-0 bg-white border-r border-slate-100 z-50 transition-all duration-200',
      sidebarCollapsed ? 'w-16' : 'w-60',
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-slate-100 relative',
        sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-5',
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-base font-semibold text-slate-900 tracking-tight">FinanceOS</span>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-sm transition-colors',
          )}
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3 h-3" />
            : <ChevronLeft  className="w-3 h-3" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon   = ICON_MAP[item.icon];
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    sidebarCollapsed && 'justify-center px-0',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-primary-600' : 'text-slate-400')} />
                  {!sidebarCollapsed && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-2 space-y-0.5">
        <Link
          href="/settings"
          title={sidebarCollapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors',
            sidebarCollapsed && 'justify-center px-0',
          )}
        >
          <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {!sidebarCollapsed && 'Settings'}
        </Link>

        <button
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Sign out' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors',
            sidebarCollapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="w-4 h-4 text-slate-400 flex-shrink-0" />
          {!sidebarCollapsed && 'Sign out'}
        </button>

        {user && !sidebarCollapsed && (
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

        {user && sidebarCollapsed && (
          <div className="flex justify-center pt-2 mt-1 border-t border-slate-100">
            <div
              title={user.name}
              className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0"
            >
              <span className="text-xs font-semibold text-primary-700">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
