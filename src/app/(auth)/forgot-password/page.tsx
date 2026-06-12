'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { requestPasswordReset } from '@/features/auth/bak.api';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/features/auth/schema';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [apiError, setApiError] = useState('');
  const [sent, setSent]         = useState(false);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setApiError('');
    const res = await requestPasswordReset(values.email);
    if (res.error) {
      setApiError(res.error);
    } else {
      // Always show success — don't reveal whether an account exists.
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-3">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Reset your password</h1>
          <p className="text-sm text-slate-500 mt-1">
            We&apos;ll email you a link to set a new password
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="flex flex-col items-center text-center py-2">
              <CheckCircle2 className="w-10 h-10 text-success-500 mb-3" />
              <p className="text-sm font-medium text-slate-800">Check your inbox</p>
              <p className="text-sm text-slate-500 mt-1">
                If an account exists for that email, a password reset link is on its way.
              </p>
            </div>
          ) : (
            <>
              {apiError && (
                <div className="bg-danger-50 border border-danger-200 rounded-md px-3 py-2.5 mb-4">
                  <p className="text-sm text-danger-700">{apiError}</p>
                </div>
              )}

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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/login" className="inline-flex items-center gap-1 text-primary-600 font-medium hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
