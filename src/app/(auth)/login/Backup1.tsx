'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { loginWithEmail } from '@/features/auth/bak.api';
import { loginSchema, type LoginFormValues } from '@/features/auth/schema';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setApiError('');
    const res = await loginWithEmail(values);
    if (res.error) {
      setApiError(res.error);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="w-full">
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-red-700 font-medium">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={cn(
              'w-full px-3 py-2.5 text-sm border rounded-xl outline-none transition-all bg-slate-50 focus:bg-white dark:bg-zinc-800 dark:focus:bg-zinc-900 text-slate-900 dark:text-zinc-100',
              errors.email
                ? 'border-red-400 focus:border-red-500 ring-1 ring-red-100'
                : 'border-slate-200 focus:border-blue-600 dark:border-zinc-700 dark:focus:border-blue-500',
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'w-full px-3 py-2.5 pr-10 text-sm border rounded-xl outline-none transition-all bg-slate-50 focus:bg-white dark:bg-zinc-800 dark:focus:bg-zinc-900 text-slate-900 dark:text-zinc-100',
                errors.password
                  ? 'border-red-400 focus:border-red-500 ring-1 ring-red-100'
                  : 'border-slate-200 focus:border-blue-600 dark:border-zinc-700 dark:focus:border-blue-500',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 transition-colors"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-500/10"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Register Link */}
      <p className="text-center text-sm text-slate-500 dark:text-zinc-400 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline dark:text-blue-400">
          Create one
        </Link>
      </p>
    </div>
  );
}