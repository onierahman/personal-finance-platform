'use client';

import Link from 'next/link';
import { MousePointerClick, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { DemoDashboard } from '@/components/demo/DemoDashboard';
import { QuickAddAnimation } from './QuickAddAnimation';
import { INITIAL_DEMO_TXNS } from '@/components/demo/demoData';

/** Browser-window chrome around a live-rendered view of the real dashboard. */
function BrowserFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/60">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 dark:bg-slate-900">
          financeos-sepia.vercel.app/dashboard
        </span>
      </div>
      <div className="bg-background p-4 dark:bg-slate-950 sm:p-6">{children}</div>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <section id="see-it" className="scroll-mt-20 border-y border-slate-200/70 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">See it in action</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            This is the actual app
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-600">
            Not a polished marketing mockup — the real dashboard, rendered live. Add an expense and
            everything updates at once.
          </p>
        </Reveal>

        {/* Live dashboard in a browser frame */}
        <Reveal delay={0.1} className="mt-14">
          <BrowserFrame>
            <DemoDashboard txns={INITIAL_DEMO_TXNS} />
          </BrowserFrame>
        </Reveal>

        {/* QuickAdd loop + explainer */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              Sub-5-second entry
            </p>
            <h3 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900">
              Log a purchase before the receipt hits your pocket
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
              Type the amount, tap a category, done. Your budgets, charts, and net worth update the
              instant you hit add — no saving, no syncing, no spreadsheet.
            </p>
            <Link
              href="/demo"
              className="group mt-6 inline-flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-primary-700 hover:shadow-card-hover active:scale-[0.98]"
            >
              <MousePointerClick size={17} />
              Try the live demo
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-3 text-[13px] text-slate-400">No account or sign-up required</p>
          </Reveal>

          <Reveal delay={0.1}>
            <QuickAddAnimation />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
