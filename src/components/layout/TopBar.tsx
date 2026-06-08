'use client';
import { Menu, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';
import { formatMonth, currentYearMonth } from '@/lib/formatters';
import { cn } from '@/lib/utils';

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

export function TopBar() {
  const { toggleSidebar, openQuickAdd, activeMonth, setActiveMonth } = useUiStore();
  const isCurrentMonth = activeMonth === currentYearMonth();

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white border-b border-slate-100 sticky top-0 z-40">
      {/* Left: hamburger (mobile) + month navigator */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveMonth(prevMonth(activeMonth))}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveMonth(currentYearMonth())}
            className={cn(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors',
              isCurrentMonth
                ? 'text-primary-700 bg-primary-50'
                : 'text-slate-700 hover:bg-slate-100',
            )}
          >
            {formatMonth(activeMonth)}
          </button>

          <button
            onClick={() => setActiveMonth(nextMonth(activeMonth))}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: quick-add */}
      <button
        onClick={() => openQuickAdd('expense')}
        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 active:scale-95 transition-all"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add</span>
      </button>
    </header>
  );
}
