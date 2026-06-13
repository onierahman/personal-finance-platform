'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, ScanLine, FileText, Table2, Check } from 'lucide-react';
import { Reveal } from './Reveal';

/* ── Receipt → extracted transaction animation ──────────────────────── */

const EXTRACTED_FIELDS = [
  { label: 'Merchant', value: 'Maple Leaf Grocers' },
  { label: 'Amount', value: '$67.84', mono: true },
  { label: 'Date', value: 'Jun 8, 2026' },
  { label: 'Category', value: '🛒 Groceries' },
];

function ReceiptDemo() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  // 0 = idle, 1 = scanning, 2 = extracted
  const [phase, setPhase] = useState(reduceMotion ? 2 : 0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView, reduceMotion]);

  return (
    <div ref={ref} className="grid items-center gap-6 sm:grid-cols-2">
      {/* Receipt */}
      <div className="relative mx-auto w-full max-w-[220px]">
        <div className="relative overflow-hidden rounded-md bg-white p-4 shadow-dropdown [clip-path:polygon(0_0,100%_0,100%_96%,95%_100%,90%_96%,85%_100%,80%_96%,75%_100%,70%_96%,65%_100%,60%_96%,55%_100%,50%_96%,45%_100%,40%_96%,35%_100%,30%_96%,25%_100%,20%_96%,15%_100%,10%_96%,5%_100%,0_96%)]">
          <p className="text-center text-[11px] font-bold tracking-wide text-slate-800">
            MAPLE LEAF GROCERS
          </p>
          <p className="text-center text-[8px] text-slate-400">Toronto, ON · Jun 8 2026</p>
          <div className="my-2 border-t border-dashed border-slate-200" />
          <div className="space-y-1.5 text-[9px] text-slate-600">
            {[
              ['Organic bananas', '3.49'],
              ['Whole-grain bread', '4.99'],
              ['Free-range eggs ×2', '11.98'],
              ['Chicken breast 1kg', '14.50'],
              ['Olive oil 750ml', '12.99'],
              ['Greek yogurt', '6.49'],
              ['Coffee beans 340g', '13.40'],
            ].map(([item, price]) => (
              <div key={item} className="flex justify-between">
                <span>{item}</span>
                <span className="amount">{price}</span>
              </div>
            ))}
          </div>
          <div className="my-2 border-t border-dashed border-slate-200" />
          <div className="flex justify-between text-[10px] font-bold text-slate-800">
            <span>TOTAL</span>
            <span className="amount">$67.84</span>
          </div>

          {/* Scan beam */}
          {phase === 1 && (
            <motion.div
              aria-hidden
              className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-primary-500/25 to-transparent"
              initial={{ top: '-20%' }}
              animate={{ top: '110%' }}
              transition={{ duration: 1.6, ease: 'easeInOut' }}
            />
          )}
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400">
          <ScanLine size={13} />
          {phase < 2 ? 'Reading receipt…' : 'Receipt scanned'}
        </p>
      </div>

      {/* Extracted transaction */}
      <div className="card border-slate-700/60 bg-slate-800/80 p-5 backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600/20 text-primary-400">
            <Sparkles size={14} />
          </span>
          <p className="text-sm font-semibold text-white">Extracted by AI</p>
        </div>
        <div className="space-y-3">
          {EXTRACTED_FIELDS.map((f, i) => (
            <div key={f.label} className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-slate-400">{f.label}</span>
              {phase === 2 ? (
                <motion.span
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.15 }}
                  className={`text-sm font-semibold text-white ${f.mono ? 'amount' : ''}`}
                >
                  {f.value}
                </motion.span>
              ) : (
                <span className="h-3.5 w-24 animate-pulse rounded-full bg-slate-700" />
              )}
            </div>
          ))}
        </div>
        {phase === 2 && (
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.65 }}
            className="mt-5 flex items-center justify-center gap-1.5 rounded-md bg-success-500/15 py-2 text-xs font-semibold text-success-500"
          >
            <Check size={14} /> Saved to Transactions
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Section ────────────────────────────────────────────────────────── */

const IMPORT_METHODS = [
  {
    icon: ScanLine,
    title: 'Receipt scanning',
    body: 'Snap a photo — AI reads the merchant, total, date, and picks the right category.',
  },
  {
    icon: FileText,
    title: 'Bank statements',
    body: 'Upload a PDF or CSV statement. Presets for 7 major banks map the columns for you.',
  },
  {
    icon: Table2,
    title: 'CSV import',
    body: 'Bring history from any app with flexible column mapping and a full preview before anything saves.',
  },
];

export function AIShowcase() {
  return (
    <section id="ai" className="scroll-mt-20 bg-slate-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-primary-400">
            <Sparkles size={15} /> AI-powered import
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
            The end of manual data entry
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-400">
            Most finance apps die the week you stop typing in transactions. FinanceOS reads your
            receipts and statements so the numbers keep flowing.
          </p>
        </Reveal>

        <Reveal className="mx-auto mt-16 max-w-3xl" delay={0.1}>
          <ReceiptDemo />
        </Reveal>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {IMPORT_METHODS.map((m, i) => (
            <Reveal key={m.title} delay={i * 0.08}>
              <div className="h-full rounded-lg border border-slate-800 bg-slate-900/60 p-5">
                <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-800 text-primary-400">
                  <m.icon size={17} />
                </span>
                <h3 className="text-[15px] font-semibold text-white">{m.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{m.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
