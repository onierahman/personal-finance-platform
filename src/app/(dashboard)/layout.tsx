//import "./globals.css"; // 👈 Make sure this line exists!
import { Inter } from "next/font/google";
import { Sidebar }           from '@/components/layout/Sidebar';
import { SidebarAwareMain }  from '@/components/layout/SidebarAwareMain';
import { TopBar }            from '@/components/layout/TopBar';
import { MobileNav }         from '@/components/layout/MobileNav';
import { QuickAdd }          from '@/components/transactions/QuickAdd';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

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
