'use client';

import { Sparkles, Flame, CalendarDays, BellRing } from 'lucide-react';
import { Reveal } from './Reveal';

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: 'Monthly review',
    body: 'A plain-language recap of your income, spending, and savings rate — with the standout numbers called out for you.',
  },
  {
    icon: Flame,
    title: 'Tracking streaks',
    body: 'Stay consistent with a logging streak, and get a little celebration the moment you complete a savings goal.',
  },
  {
    icon: CalendarDays,
    title: 'Spending heatmap',
    body: 'A calendar view of your daily spending makes your heaviest days obvious at a glance.',
  },
  {
    icon: BellRing,
    title: 'Timely reminders',
    body: 'Push and email alerts for upcoming bills and budgets you’re about to blow — so nothing sneaks up on you.',
  },
];

export function IntelligenceBand() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            More than a ledger
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            It notices things, so you don’t have to
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-600">
            FinanceOS turns your numbers into a clear story and keeps you on track between paydays.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.07}>
              <div className="hover-lift card h-full p-6">
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                  <h.icon size={19} />
                </span>
                <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{h.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{h.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
