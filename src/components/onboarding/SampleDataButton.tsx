'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Trash2 } from 'lucide-react';
import { useHasSampleData, useSeedSampleData, useWipeSampleData } from '@/features/sampleData/api';
import { useToast } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

/**
 * Loads or clears the explorable demo dataset. Used on the empty dashboard
 * (load) and in Settings (clear). `variant` controls the visual weight.
 */
export function SampleDataButton({ variant = 'primary' }: { variant?: 'primary' | 'subtle' }) {
  const { data: hasSample } = useHasSampleData();
  const seed = useSeedSampleData();
  const wipe = useWipeSampleData();
  const toast = useToast();
  const [confirmWipe, setConfirmWipe] = useState(false);

  const loaded = hasSample?.data === true;
  const busy = seed.isPending || wipe.isPending;

  const handleSeed = () => {
    seed.mutate(undefined, {
      onSuccess: (res) => {
        if (res.error) toast.error(res.error);
        else toast.success('Sample data loaded — explore away!');
      },
      onError: () => toast.error('Could not load sample data.'),
    });
  };

  const handleWipe = () => {
    wipe.mutate(undefined, {
      onSuccess: (res) => {
        if (res.error) toast.error(res.error);
        else toast.success('Sample data cleared.');
        setConfirmWipe(false);
      },
      onError: () => { toast.error('Could not clear sample data.'); setConfirmWipe(false); },
    });
  };

  if (loaded) {
    return confirmWipe ? (
      <div className="flex items-center gap-2">
        <button
          onClick={handleWipe}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-danger-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-danger-700 disabled:opacity-50"
        >
          {wipe.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Clear sample data
        </button>
        <button
          onClick={() => setConfirmWipe(false)}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Keep it
        </button>
      </div>
    ) : (
      <button
        onClick={() => setConfirmWipe(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Trash2 size={13} /> Clear sample data
      </button>
    );
  }

  return (
    <button
      onClick={handleSeed}
      disabled={busy}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all active:scale-[0.98] disabled:opacity-60',
        variant === 'primary'
          ? 'bg-primary-600 px-5 py-2.5 text-[15px] text-white shadow-card hover:bg-primary-700 hover:shadow-card-hover'
          : 'border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
      )}
    >
      {seed.isPending ? (
        <Loader2 size={variant === 'primary' ? 17 : 13} className="animate-spin" />
      ) : (
        <Sparkles size={variant === 'primary' ? 17 : 13} />
      )}
      {seed.isPending ? 'Loading…' : 'Explore with sample data'}
    </button>
  );
}
