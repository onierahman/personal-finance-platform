'use client';

import Link from 'next/link';
import { ArrowRight, UserPlus, Import, Bell } from 'lucide-react';
import { Reveal } from './Reveal';

const STEPS = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Create your account',
    body: 'Sign up with your email — no credit card, no commitment. Pick your currency and timezone and you’re in.',
  },
  {
    icon: Import,
    step: '02',
    title: 'Add your money',
    body: 'Add accounts, scan a few receipts, or import a bank statement. Your history lands organized and categorized.',
  },
  {
    icon: Bell,
    step: '03',
    title: 'Stay on top of it',
    body: 'Budgets color-code themselves, bills surface before they’re due, and a weekly digest lands in your inbox.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            From sign-up to insight in minutes
          </h2>
        </Reveal>

        <div className="relative mx-auto mt-14 grid max-w-5xl gap-10 sm:grid-cols-3 sm:gap-6">
          {/* Connecting line — desktop */}
          <div
            aria-hidden
            className="absolute left-[16.67%] right-[16.67%] top-7 hidden h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 sm:block"
          />
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={i * 0.12} className="relative text-center">
              <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary-100 bg-white text-primary-600 shadow-card">
                <s.icon size={22} />
              </div>
              <p className="amount mt-4 text-xs font-medium text-primary-600">{s.step}</p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">{s.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3} className="mt-14 text-center">
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-primary-700 hover:shadow-card-hover active:scale-[0.98]"
          >
            Start tracking now
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
