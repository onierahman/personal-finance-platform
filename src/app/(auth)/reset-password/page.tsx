'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { updatePassword } from '@/features/auth/bak.api';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/features/auth/schema';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPw, setShowPw]     = useState(false);
  const [apiError, setApiError] = useState('');
  const [done, setDone]         = useState(false);
  // Whether a recovery session was established from the email link.
  const [hasRecovery, setHasRecovery] = useState<boolean | null>(null);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  // Supabase establishes a recovery session from the link's token. Confirm it
  // exists so we can warn the user early if the link is invalid or expired.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let resolved = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        resolved = true;
        setHasRecovery(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        resolved = true;
        setHasRecovery(true);
      }
    });

    // Give the URL-token detection a moment before declaring the link invalid.
    const t = setTimeout(() => { if (!resolved) setHasRecovery(false); }, 2500);

    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function onSubmit(values: ResetPasswordFormValues) {
    setApiError('');
    const res = await updatePassword(values.password);
    if (res.error) {
      setApiError(res.error);
    } else {
      setDone(true);
      setTimeout(() => { router.push('/login'); router.refresh(); }, 1800);
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
          <h1 className="text-2xl font-semibold text-slate-900">Set a new password</h1>
          <p className="text-sm text-slate-500 mt-1">Choose a password you haven&apos;t used before</p>
        </div>

        <div className="card p-6">
          {done ? (
            <div className="flex flex-col items-center text-center py-2">
              <CheckCircle2 className="w-10 h-10 text-success-500 mb-3" />
              <p className="text-sm font-medium text-slate-800">Password updated</p>
              <p className="text-sm text-slate-500 mt-1">Redirecting you to sign in…</p>
            </div>
          ) : (
            <>
              {hasRecovery === false && (
                <div className="bg-warning-50 border border-warning-200 rounded-md px-3 py-2.5 mb-4">
                  <p className="text-sm text-warning-700">
                    This reset link looks invalid or expired.{' '}
                    <Link href="/forgot-password" className="font-medium underline">
                      Request a new one
                    </Link>.
                  </p>
                </div>
              )}

              {apiError && (
                <div className="bg-danger-50 border border-danger-200 rounded-md px-3 py-2.5 mb-4">
                  <p className="text-sm text-danger-700">{apiError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm password</label>
                  <input
                    {...register('confirmPassword')}
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={cn(
                      'w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-colors',
                      errors.confirmPassword
                        ? 'border-danger-400 focus:border-danger-500'
                        : 'border-slate-200 focus:border-primary-500',
                    )}
                  />
                  {errors.confirmPassword && <p className="text-xs text-danger-500 mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
