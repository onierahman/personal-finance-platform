'use client';

import { ShieldCheck, Lock, Download, EyeOff } from 'lucide-react';
import { Reveal } from './Reveal';

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Your data is isolated',
    body: 'Row-level security in Postgres means your records are only ever readable by you — enforced at the database itself, not just the app.',
  },
  {
    icon: Lock,
    title: 'Encrypted, with optional 2FA',
    body: 'Connected-account tokens are encrypted at rest with AES-256-GCM, sessions use signed expiring tokens, and you can switch on two-factor authentication anytime.',
  },
  {
    icon: Download,
    title: 'Leave with everything',
    body: 'Export your transactions and reports to CSV or PDF at any time. Your financial history belongs to you, not to us.',
  },
  {
    icon: EyeOff,
    title: 'No ads. No data sales.',
    body: 'FinanceOS is a product, not an ad network. We never sell your financial data or show you ads based on what you buy.',
  },
];

export function TrustSection() {
  return (
    <section id="security" className="scroll-mt-20 border-y border-slate-200/70 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Security & privacy
          </p>
          <h2 className="mt-3 text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Built like your money depends on it
          </h2>
          <p className="mt-4 text-balance text-lg leading-relaxed text-slate-600">
            Financial data deserves more than a privacy policy. These protections are engineered
            into the platform.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2">
          {TRUST_POINTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.07}>
              <div className="flex h-full gap-4 rounded-lg border border-slate-100 bg-slate-50/60 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-primary-600 shadow-card">
                  <p.icon size={19} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
