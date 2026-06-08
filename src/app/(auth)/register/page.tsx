'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { registerWithEmail } from '@/features/auth/api';
import { registerSchema, type RegisterFormValues } from '@/features/auth/schema';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [done, setDone]       = useState(false);

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setApiError('');
    const res = await registerWithEmail(values);
    if (res.error) {
      setApiError(res.error);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
          <p className="text-sm text-slate-500 mb-6">
            We sent a confirmation link to your email. Click it to activate your account.
          </p>
          <Link href="/login" className="text-primary-600 font-medium hover:underline text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center mb-3">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Start tracking your finances for free</p>
        </div>

        <div className="card p-6">
          {apiError && (
            <div className="bg-danger-50 border border-danger-200 rounded-md px-3 py-2.5 mb-4">
              <p className="text-sm text-danger-700">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: 'name'  as const, label: 'Full name',       type: 'text',     placeholder: 'Alex Johnson',       autoComplete: 'name' },
              { name: 'email' as const, label: 'Email',           type: 'email',    placeholder: 'you@example.com',    autoComplete: 'email' },
            ].map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                <input
                  {...register(f.name)}
                  type={f.type}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  className={cn(
                    'w-full px-3 py-2.5 text-sm border rounded-md outline-none transition-colors',
                    errors[f.name]
                      ? 'border-danger-400 focus:border-danger-500'
                      : 'border-slate-200 focus:border-primary-500',
                  )}
                />
                {errors[f.name] && <p className="text-xs text-danger-500 mt-1">{errors[f.name]!.message}</p>}
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
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

            {/* Confirm */}
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
              className="w-full py-2.5 rounded-md bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
