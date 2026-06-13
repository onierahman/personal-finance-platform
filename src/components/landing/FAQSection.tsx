'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Reveal } from './Reveal';

const FAQS = [
  {
    q: 'Is FinanceOS free?',
    a: 'Yes — creating an account and tracking your finances is free, with no credit card required. Premium capabilities like higher AI-import volumes may become paid plans in the future, and existing users will always be told clearly before anything changes.',
  },
  {
    q: 'Does it connect directly to my bank?',
    a: 'Not yet — automatic bank sync is on the roadmap. Today you import in seconds instead: scan receipts with your camera, upload PDF or CSV bank statements (with presets for 7 major banks), or import a CSV from any other app. Recurring bills and income generate themselves automatically once set up.',
  },
  {
    q: 'Is my financial data safe?',
    a: 'Your data lives in a Postgres database with row-level security, so it is only ever readable by your account. You can add two-factor authentication (TOTP) for an extra layer on top of your password. Sensitive tokens are encrypted at rest with AES-256-GCM, sessions use signed expiring tokens, and we never sell data or show ads. You can export or delete everything at any time.',
  },
  {
    q: 'Does it work on my phone?',
    a: 'FinanceOS is built mobile-first and works in any modern browser. You can install it to your home screen as an app (PWA) on iPhone and Android — complete with native-feeling gestures, haptics, and a bottom tab bar — and turn on push notifications for bills and budget alerts.',
  },
  {
    q: 'Can I get my data out?',
    a: 'Always. Transactions and analytics reports export to CSV and PDF from inside the app, and you can delete your account — and every record attached to it — from Settings.',
  },
  {
    q: 'Which currencies are supported?',
    a: 'You can set your display currency (USD, CAD, EUR, GBP, and more) and timezone in Settings, and all amounts across the app are formatted accordingly.',
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${index}`;

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <span className="text-[15px] font-semibold tracking-tight text-slate-900">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
        >
          <Plus size={15} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">FAQ</p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Questions, answered
          </h2>
        </Reveal>

        <div className="mx-auto mt-12 max-w-2xl space-y-3">
          {FAQS.map((f, i) => (
            <Reveal key={f.q} delay={i * 0.05}>
              <FAQItem q={f.q} a={f.a} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
