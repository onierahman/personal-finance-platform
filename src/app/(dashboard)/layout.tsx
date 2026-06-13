import { Sidebar }           from '@/components/layout/Sidebar';
import { SidebarAwareMain }  from '@/components/layout/SidebarAwareMain';
import { TopBar }            from '@/components/layout/TopBar';
import { MobileLargeTitle }  from '@/components/layout/MobileLargeTitle';
import { MobileNav }         from '@/components/layout/MobileNav';
import { MobileSidebar }     from '@/components/layout/MobileSidebar';
import { ThemeApplier }      from '@/components/layout/ThemeApplier';
import { PageTransition }    from '@/components/layout/PageTransition';
import { QuickAdd }          from '@/components/transactions/QuickAdd';
import { GoalCelebration }   from '@/components/goals/GoalCelebration';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <ThemeApplier />
      <Sidebar />
      <MobileSidebar />

      <SidebarAwareMain>
        <TopBar />
        <MobileLargeTitle />
        <main className="flex-1 pb-20 lg:pb-8 safe-area-bottom overflow-x-hidden">
          <div className="page-container">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </SidebarAwareMain>

      <MobileNav />
      <QuickAdd />
      <GoalCelebration />
    </div>
  );
}
