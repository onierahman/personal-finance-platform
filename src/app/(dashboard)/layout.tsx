import "./globals.css"; // 👈 Make sure this line exists!
import { Inter } from "next/font/google";
import { Sidebar }   from '@/components/layout/Sidebar';
import { TopBar }    from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { QuickAdd }  from '@/components/transactions/QuickAdd';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main area — offset by sidebar on desktop */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pb-20 lg:pb-8">
          <div className="page-container">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
      <QuickAdd />
    </div>
  );
}
