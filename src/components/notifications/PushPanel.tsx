'use client';

import { BellRing, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/features/push/hooks';
import { cn } from '@/lib/utils';

/** Enable/disable browser push notifications. Hidden machinery degrades
 *  gracefully: shows an explanatory state when unsupported or not configured. */
export function PushPanel({ onSaved, onError }: { onSaved: (m: string) => void; onError: (m: string) => void }) {
  const push = usePushNotifications();

  const handleToggle = async () => {
    if (push.subscribed) {
      const res = await push.unsubscribe();
      if (res.ok) onSaved('Push notifications turned off.');
      else onError(res.error ?? 'Could not turn off push.');
    } else {
      const res = await push.subscribe();
      if (res.ok) onSaved('Push notifications enabled on this device.');
      else onError(res.error ?? 'Could not enable push.');
    }
  };

  const unavailable = !push.supported || !push.configured;
  const subtitle = !push.supported
    ? 'This browser doesn’t support push notifications.'
    : !push.configured
    ? 'Push isn’t set up on this server yet — coming soon.'
    : push.subscribed
    ? 'Enabled on this device. You’ll get alerts even when the app is closed.'
    : 'Get bill, budget, and digest alerts on this device — even when the app is closed.';

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-500/15 flex items-center justify-center flex-shrink-0">
          <BellRing className="w-4 h-4 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Push notifications</p>
            {push.subscribed && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                On
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={unavailable || push.loading}
          className={cn(
            'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            push.subscribed
              ? 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              : 'bg-primary-600 text-white hover:bg-primary-700',
          )}
        >
          {push.loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {push.subscribed ? 'Turn off' : 'Enable'}
        </button>
      </div>
    </div>
  );
}
