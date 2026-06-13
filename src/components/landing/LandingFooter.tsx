'use client';

import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { Reveal } from './Reveal';

export function FinalCTA() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-lg bg-slate-950 px-6 py-16 text-center sm:px-16 sm:py-20">
            {/* Accent glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-64 w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/30 blur-3xl"
            />
            <h2 className="relative text-balance text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Know exactly where your money goes
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-balance text-lg leading-relaxed text-slate-400">
              Set up your account, scan your first receipt, and see your full financial picture —
              all in the next five minutes.
            </p>
            <div className="relative mt-9">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-md bg-white px-7 py-3.5 text-[15px] font-semibold text-slate-900 shadow-card transition-all hover:bg-slate-100 hover:shadow-card-hover active:scale-[0.98]"
              >
                Get started free
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
            <p className="relative mt-4 text-[13px] text-slate-500">
              No credit card required · Export or delete your data anytime
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Link href="/" className="flex items-center gap-2" aria-label="FinanceOS home">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-600 text-white">
                <Wallet size={18} />
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">FinanceOS</span>
            </Link>
            <p className="max-w-xs text-center text-sm leading-relaxed text-slate-500 sm:text-left">
              Track expenses, budgets, savings goals, investments, and net worth — in one place.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Product
              </p>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-slate-600 transition-colors hover:text-slate-900">Features</a></li>
                <li><a href="#ai" className="text-slate-600 transition-colors hover:text-slate-900">AI Import</a></li>
                <li><a href="#security" className="text-slate-600 transition-colors hover:text-slate-900">Security</a></li>
                <li><Link href="/changelog" className="text-slate-600 transition-colors hover:text-slate-900">Changelog</Link></li>
                <li><a href="#faq" className="text-slate-600 transition-colors hover:text-slate-900">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Account
              </p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-slate-600 transition-colors hover:text-slate-900">Log in</Link></li>
                <li><Link href="/register" className="text-slate-600 transition-colors hover:text-slate-900">Sign up</Link></li>
                <li><Link href="/forgot-password" className="text-slate-600 transition-colors hover:text-slate-900">Reset password</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-[13px] text-slate-400">
            © {new Date().getFullYear()} FinanceOS. All rights reserved.
          </p>
          <div className="flex gap-5 text-[13px]">
            <Link href="/privacy" className="text-slate-400 transition-colors hover:text-slate-600">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-400 transition-colors hover:text-slate-600">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
