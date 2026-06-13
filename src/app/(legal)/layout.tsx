import Link from 'next/link';
import { Wallet } from 'lucide-react';

// Minimal shared chrome for the legal pages — no app shell, no auth.
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200/70 bg-white">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="FinanceOS home">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
              <Wallet size={18} />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">FinanceOS</span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            ← Back to home
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">{children}</main>
      <footer className="mx-auto max-w-3xl border-t border-slate-100 px-4 py-8 sm:px-6">
        <p className="text-[13px] text-slate-400">
          © {new Date().getFullYear()} FinanceOS. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
