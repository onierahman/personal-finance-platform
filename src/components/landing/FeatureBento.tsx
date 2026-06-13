'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Zap,
  PieChart,
  Target,
  CalendarClock,
  LineChart,
  BarChart3,
} from 'lucide-react';
import { Reveal } from './Reveal';

/* ── Micro-visuals: small, real-feeling UI fragments per tile ───────── */

function VisualQuickAdd() {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="card mx-auto w-full max-w-[240px] space-y-2 p-3"
      initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <p className="amount text-center text-2xl font-semibold text-slate-900">$14.50</p>
      <div className="flex justify-center gap-1.5">
        {['🍜 Dining', '🛒 Groceries', '🚇 Transport'].map((c, i) => (
          <span
            key={c}
            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
              i === 0 ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="rounded-md bg-primary-600 py-1.5 text-center text-[11px] font-semibold text-white">
        Add expense
      </div>
    </motion.div>
  );
}

function VisualBudgets() {
  const reduceMotion = useReducedMotion();
  const rows = [
    { label: 'Groceries', pct: 58, tone: 'bg-success-500' },
    { label: 'Dining out', pct: 86, tone: 'bg-warning-500' },
    { label: 'Shopping', pct: 104, tone: 'bg-danger-500' },
  ];
  return (
    <div className="mx-auto w-full max-w-[240px] space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="mb-1 flex justify-between text-[10px] font-medium">
            <span className="text-slate-600">{r.label}</span>
            <span className={`amount ${r.pct > 100 ? 'text-danger-600' : 'text-slate-400'}`}>
              {r.pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={`h-full rounded-full ${r.tone}`}
              initial={{ width: reduceMotion ? `${Math.min(r.pct, 100)}%` : '0%' }}
              whileInView={{ width: `${Math.min(r.pct, 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VisualGoalRing() {
  const reduceMotion = useReducedMotion();
  const R = 40;
  const C = 2 * Math.PI * R;
  const pct = 0.72;
  return (
    <div className="relative mx-auto h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-slate-100" />
        <motion.circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-primary-600"
          strokeDasharray={C}
          initial={{ strokeDashoffset: reduceMotion ? C * (1 - pct) : C }}
          whileInView={{ strokeDashoffset: C * (1 - pct) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg">🏝️</span>
        <span className="amount text-xs font-semibold text-slate-900">72%</span>
      </div>
    </div>
  );
}

function VisualBills() {
  const bills = [
    { name: 'Rent', amount: '$1,850', due: 'Due in 3 days', tone: 'bg-warning-50 text-warning-600' },
    { name: 'Internet', amount: '$79.99', due: 'Due in 9 days', tone: 'bg-slate-100 text-slate-500' },
  ];
  return (
    <div className="mx-auto w-full max-w-[240px] space-y-2">
      {bills.map((b, i) => (
        <motion.div
          key={b.name}
          className="card flex items-center justify-between p-2.5"
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.2 + i * 0.12 }}
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-800">{b.name}</p>
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${b.tone}`}>
              {b.due}
            </span>
          </div>
          <span className="amount text-xs font-semibold text-slate-700">{b.amount}</span>
        </motion.div>
      ))}
    </div>
  );
}

function VisualSparkline() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="mx-auto w-full max-w-[240px]">
      <p className="text-[10px] font-medium text-slate-500">Net worth</p>
      <p className="amount text-xl font-semibold text-slate-900">$86,412</p>
      <svg viewBox="0 0 200 56" className="mt-1 w-full" fill="none" aria-hidden>
        <motion.path
          d="M0 48 C 24 44, 36 36, 56 38 S 92 24, 116 22 S 156 14, 200 6"
          className="stroke-success-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: reduceMotion ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 0.2, ease: 'easeOut' }}
        />
        <path
          d="M0 48 C 24 44, 36 36, 56 38 S 92 24, 116 22 S 156 14, 200 6 V 56 H 0 Z"
          fill="url(#sparkfill)"
        />
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function VisualAnalytics() {
  const reduceMotion = useReducedMotion();
  const bars = [34, 52, 44, 68, 58, 82];
  return (
    <div className="mx-auto w-full max-w-[240px]">
      <div className="flex h-20 items-end justify-between gap-2">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            className="w-full rounded-t-sm bg-primary-600/80"
            style={{ opacity: 0.45 + (i / bars.length) * 0.55 }}
            initial={{ height: reduceMotion ? `${h}%` : '6%' }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[8px] font-medium text-slate-400">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => (
          <span key={m} className="w-full text-center">{m}</span>
        ))}
      </div>
    </div>
  );
}

/* ── Tiles ──────────────────────────────────────────────────────────── */

const TILES = [
  {
    icon: Zap,
    title: 'Effortless tracking',
    body: 'Log a purchase in under five seconds with QuickAdd — then search, filter, swipe to delete, and edit inline.',
    visual: <VisualQuickAdd />,
    span: 'lg:col-span-2',
  },
  {
    icon: PieChart,
    title: 'Budgets that talk back',
    body: 'Monthly and annual caps per category, with live status colors from safe to over — updated the moment you spend.',
    visual: <VisualBudgets />,
    span: '',
  },
  {
    icon: Target,
    title: 'Goals you actually hit',
    body: 'Emergency fund, vacation, house — set a deadline and get a suggested monthly contribution. One tap to add money.',
    visual: <VisualGoalRing />,
    span: '',
  },
  {
    icon: CalendarClock,
    title: 'Never miss a bill',
    body: 'Recurring bills, subscriptions, and income with next-due tracking, urgency badges, and your committed outflow at a glance.',
    visual: <VisualBills />,
    span: '',
  },
  {
    icon: LineChart,
    title: 'Net worth & investments',
    body: 'Accounts, cards, and loans alongside your holdings — cost basis, P&L, allocation, and your full financial position.',
    visual: <VisualSparkline />,
    span: '',
  },
  {
    icon: BarChart3,
    title: 'Analytics that explain',
    body: 'Spending trends, income, savings rate, budget performance, and top merchants across 3, 6, or 12 months — exportable to PDF and CSV.',
    visual: <VisualAnalytics />,
    span: 'lg:col-span-2',
  },
];

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Everything in one place
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Built for how money actually works
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-600">
            Six tightly connected tools — add a transaction once and watch your budgets, goals,
            and net worth update everywhere.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((tile, i) => (
            <Reveal key={tile.title} delay={i * 0.06} className={tile.span}>
              <div className="hover-lift card flex h-full flex-col justify-between gap-6 p-6">
                <div>
                  <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                    <tile.icon size={19} />
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                    {tile.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{tile.body}</p>
                </div>
                <div className="flex min-h-[120px] items-center">{tile.visual}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
