'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  animate,
} from 'framer-motion';
import { ArrowRight, TrendingUp, TrendingDown, Target } from 'lucide-react';

/* ── Animated currency figure (mirrors the in-app CountUp) ──────────── */
function CountUpAmount({ value, prefix = '$' }: { value: number; prefix?: string }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span className="amount">
      {prefix}
      {display.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

/* ── Recreated dashboard inside an iPhone-style frame ───────────────── */
const CHART_BARS = [42, 28, 56, 38, 70, 48, 88];
const BUDGETS = [
  { name: 'Groceries', emoji: '🛒', pct: 62, tone: 'bg-success-500' },
  { name: 'Dining out', emoji: '🍜', pct: 84, tone: 'bg-warning-500' },
  { name: 'Transport', emoji: '🚇', pct: 31, tone: 'bg-success-500' },
];

function PhoneMockup() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-[300px] sm:w-[320px]">
      {/* Frame */}
      <div className="relative rounded-[44px] border border-slate-200 bg-slate-900 p-[10px] shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="overflow-hidden rounded-[34px] bg-slate-50">
          {/* Notch */}
          <div className="relative flex justify-center bg-slate-50 pt-2.5">
            <div className="h-[22px] w-[110px] rounded-full bg-slate-900" />
          </div>

          <div className="space-y-3 px-4 pb-6 pt-3">
            {/* Greeting */}
            <div>
              <p className="text-[11px] font-medium text-slate-400">June 2026</p>
              <p className="text-[15px] font-bold tracking-tight text-slate-900">Dashboard</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="card p-3">
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <TrendingUp size={11} className="text-success-500" /> Income
                </div>
                <p className="mt-0.5 text-[15px] font-semibold text-slate-900">
                  <CountUpAmount value={6240} />
                </p>
              </div>
              <div className="card p-3">
                <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <TrendingDown size={11} className="text-danger-500" /> Expenses
                </div>
                <p className="mt-0.5 text-[15px] font-semibold text-slate-900">
                  <CountUpAmount value={3918} />
                </p>
              </div>
            </div>

            {/* Spending chart */}
            <div className="card p-3">
              <p className="mb-2 text-[10px] font-medium text-slate-500">Spending this week</p>
              <div className="flex h-16 items-end justify-between gap-1.5">
                {CHART_BARS.map((h, i) => (
                  <motion.div
                    key={i}
                    className={`w-full rounded-t-sm ${i === CHART_BARS.length - 1 ? 'bg-primary-600' : 'bg-primary-100'}`}
                    initial={{ height: reduceMotion ? `${h}%` : '4%' }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-[8px] font-medium text-slate-400">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className="w-full text-center">{d}</span>
                ))}
              </div>
            </div>

            {/* Budget health */}
            <div className="card space-y-2.5 p-3">
              <p className="text-[10px] font-medium text-slate-500">Budget health</p>
              {BUDGETS.map((b, i) => (
                <div key={b.name}>
                  <div className="mb-1 flex items-center justify-between text-[10px]">
                    <span className="font-medium text-slate-700">
                      {b.emoji} {b.name}
                    </span>
                    <span className="amount text-slate-500">{b.pct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      className={`h-full rounded-full ${b.tone}`}
                      initial={{ width: reduceMotion ? `${b.pct}%` : '0%' }}
                      animate={{ width: `${b.pct}%` }}
                      transition={{ duration: 0.9, delay: 0.9 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Goal card */}
            <div className="card flex items-center gap-2.5 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                <Target size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-medium text-slate-700">Emergency fund</span>
                  <span className="amount text-slate-500">$8,400 / $10,000</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-primary-600"
                    initial={{ width: reduceMotion ? '84%' : '0%' }}
                    animate={{ width: '84%' }}
                    transition={{ duration: 1, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soft glow behind the phone */}
      <div
        aria-hidden
        className="absolute -inset-x-16 top-1/4 -z-10 h-72 rounded-full bg-primary-500/15 blur-3xl"
      />
    </div>
  );
}

/* ── Hero section ────────────────────────────────────────────────────── */
export function Hero() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const phoneY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : -40]);

  const entrance = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.65, delay, ease: [0.21, 0.47, 0.32, 0.98] as const },
  });

  return (
    <section className="relative overflow-hidden pt-32 sm:pt-40">
      {/* Background wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(37,99,235,0.08),transparent)]"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            {...entrance(0)}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-card"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
            Free to use — set up in under a minute
          </motion.p>

          <motion.h1
            {...entrance(0.08)}
            className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
          >
            All your money.
            <br />
            <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
              One clear picture.
            </span>
          </motion.h1>

          <motion.p
            {...entrance(0.16)}
            className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-slate-600"
          >
            Track spending, budgets, savings goals, investments, and net worth in one beautiful
            app — with AI that turns receipts and bank statements into organized transactions.
          </motion.p>

          <motion.div
            {...entrance(0.24)}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-md bg-primary-600 px-6 py-3 text-[15px] font-semibold text-white shadow-card transition-all hover:bg-primary-700 hover:shadow-card-hover active:scale-[0.98]"
            >
              Get started free
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-6 py-3 text-[15px] font-semibold text-slate-700 shadow-card transition-all hover:bg-slate-50 active:scale-[0.98]"
            >
              Try the live demo
            </Link>
          </motion.div>

          <motion.p {...entrance(0.32)} className="mt-4 text-[13px] text-slate-400">
            No credit card required · Works on any device
          </motion.p>
        </div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
          style={{ y: phoneY }}
          className="relative mt-16 sm:mt-20"
        >
          <PhoneMockup />
          {/* Fade the bottom of the phone into the next section */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
