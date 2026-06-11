'use client';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export function SidebarAwareMain({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUiStore();
  return (
    <div className={cn(
      'flex flex-col min-h-screen transition-all duration-200',
      sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60',
    )}>
      {children}
    </div>
  );
}
