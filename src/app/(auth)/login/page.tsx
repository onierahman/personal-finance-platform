'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Eye, EyeOff } from 'lucide-react';
import { loginWithEmail } from '@/features/auth/bak.api';
import { loginSchema, type LoginFormValues } from '@/features/auth/schema';
import { needsMfaChallenge, solveMfaChallenge } from '@/features/security/mfa';
import { cn } from '@/lib/utils';

/**
 * Resolve the post-login destination from the ?next= param, defaulting to the
 * dashboard. Only same-origin absolute paths are allowed — anything else
 * (external URLs, protocol-relative "//evil.com") is rejected to prevent
 * open-redirect attacks.
 */
function safeNextPath(): string {
  if (typeof window === 'undefined') return '/dashboard';
  const next = new URLSearchParams(window.location.search).get('next');
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState('');

  // Two-factor challenge step (shown after a correct password when 2FA is on).
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setApiError('');
    const res = await loginWithEmail(values);
    if (res.error) {
      setApiError(res.error);
      return;
    }
    // Password accepted — does this account require a second factor?
    if (await needsMfaChallenge()) {
      setMfaStep(true);
      return;
    }
    router.push(safeNextPath());
    router.refresh();
  }

  async function onVerifyMfa() {
    if (mfaCode.trim().length < 6) return;
    setApiError('');
    setMfaBusy(true);
    const { error } = await solveMfaChallenge(mfaCode.trim());
    setMfaBusy(false);
    if (error) {
      setApiError(error);
      return;
    }
    router.push(safeNextPath());
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-3">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {mfaStep ? 'Two-factor verification' : 'Welcome back'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {mfaStep
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Sign in to your FinanceOS account'}
          </p>
        </div>

        <div className="card p-6">
          {apiError && (
            <div className="bg-danger-50 border border-danger-200 rounded-md px-3 py-2.5 mb-4">
              <p className="text-sm text-danger-700">{apiError}</p>
            </div>
          )}

          {mfaStep ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Authentication code
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && onVerifyMfa()}
                  placeholder="000000"
                  autoFocus
                  className="w-full px-3 py-2.5 text-center text-lg font-mono tracking-[0.3em] border border-slate-200 rounded-md outline-none transition-colors focus:border-primary-500"
                />
              </div>
              <button
                type="button"
                onClick={onVerifyMfa}
                disabled={mfaBusy || mfaCode.length < 6}
                className="w-full py-2.5 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mfaBusy ? 'Verifying…' : 'Verify & sign in'}
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn(
                  'w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-colors',
                  errors.email
                    ? 'border-danger-400 focus:border-danger-500'
                    : 'border-slate-200 focus:border-primary-500',
                )}
              />
              {errors.email && <p className="text-xs text-danger-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary-600 font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn(
                    'w-full px-3 py-2.5 pr-10 text-sm border rounded-md outline-none transition-colors',
                    errors.password
                      ? 'border-danger-400 focus:border-danger-500'
                      : 'border-slate-200 focus:border-primary-500',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary-600 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
