import { Sidebar }           from '@/components/layout/Sidebar';
import { SidebarAwareMain }  from '@/components/layout/SidebarAwareMain';
import { TopBar }            from '@/components/layout/TopBar';
import { MobileNav }         from '@/components/layout/MobileNav';
import { MobileSidebar }     from '@/components/layout/MobileSidebar';
import { ThemeApplier }      from '@/components/layout/ThemeApplier';
import { QuickAdd }          from '@/components/transactions/QuickAdd';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background dark:bg-slate-950">
      <ThemeApplier />
      <Sidebar />
      <MobileSidebar />

      <SidebarAwareMain>
        <TopBar />
        <main className="flex-1 pb-20 lg:pb-8">
          <div className="page-container">
            {children}
          </div>
        </main>
      </SidebarAwareMain>

      <MobileNav />
      <QuickAdd />
    </div>
  );
}
