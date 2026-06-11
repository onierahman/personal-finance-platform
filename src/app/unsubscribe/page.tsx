'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  success: {
    icon:    CheckCircle,
    color:   'text-success-600',
    bgColor: 'bg-success-50',
    title:   'Unsubscribed successfully',
    body:    'Your Gmail connection has been removed. You will no longer receive email notifications from Personal Tracker.',
  },
  expired: {
    icon:    Clock,
    color:   'text-warning-600',
    bgColor: 'bg-warning-50',
    title:   'Link expired',
    body:    'This unsubscribe link has expired (links are valid for 30 days). Please sign in and disconnect Gmail from Settings.',
  },
  invalid: {
    icon:    AlertTriangle,
    color:   'text-danger-600',
    bgColor: 'bg-danger-50',
    title:   'Invalid link',
    body:    'This unsubscribe link is not valid. Please sign in and manage your notification preferences from Settings.',
  },
} as const;

type Status = keyof typeof STATUS_CONFIG;

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status       = (searchParams.get('status') ?? 'invalid') as Status;
  const config       = STATUS_CONFIG[status] ?? STATUS_CONFIG.invalid;
  const Icon         = config.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
        <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mx-auto`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-slate-900">{config.title}</h1>
          <p className="text-sm text-slate-500 leading-relaxed">{config.body}</p>
        </div>

        <div className="pt-2 space-y-2">
          <Link
            href="/settings?tab=notifications"
            className="block w-full px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            Manage notification settings
          </Link>
          <Link
            href="/dashboard"
            className="block w-full px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
