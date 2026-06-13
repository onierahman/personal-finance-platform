'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type AnyClient = any;

interface StreakData {
  current: number;
  longest: number;
  daysTracked: number;
}

function toKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Compute the consecutive-day logging streak from transaction dates. */
function computeStreak(dates: string[]): StreakData {
  const days = new Set(dates);
  if (days.size === 0) return { current: 0, longest: 0, daysTracked: 0 };

  // Current streak: walk back from today (allowing today to be empty as long
  // as yesterday is present, so a streak isn't "lost" before the day ends).
  const today = new Date();
  const cursor = new Date(today);
  if (!days.has(toKey(today))) cursor.setDate(cursor.getDate() - 1);
  let current = 0;
  while (days.has(toKey(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak across the known window.
  const sorted = [...days].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);
    run = diff === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  return { current, longest: Math.max(longest, current), daysTracked: days.size };
}

async function fetchStreak(): Promise<StreakData> {
  const supabase = getSupabaseBrowserClient() as AnyClient;
  // Last ~120 days of activity is plenty to derive the current streak.
  const since = new Date();
  since.setDate(since.getDate() - 120);
  const { data } = await supabase
    .from('transactions')
    .select('date')
    .eq('is_deleted', false)
    .gte('date', toKey(since))
    .order('date', { ascending: false });
  const dates = ((data ?? []) as { date: string }[]).map((r) => r.date);
  return computeStreak(dates);
}

export function StreakCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['streak'],
    queryFn: fetchStreak,
    staleTime: 60_000,
  });

  const current = data?.current ?? 0;
  const active = current > 0;

  return (
    <div className="card flex h-full flex-col justify-between p-5">
      <div className="flex items-center gap-2">
        <motion.span
          initial={false}
          animate={active ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.5 }}
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            active
              ? 'bg-warning-50 text-warning-500 dark:bg-warning-500/15'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          }`}
        >
          <Flame size={17} />
        </motion.span>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Tracking streak</p>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        ) : (
          <p className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {current}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {current === 1 ? 'day' : 'days'}
            </span>
          </p>
        )}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {active
            ? current >= (data?.longest ?? 0) && current > 1
              ? 'Your best streak yet — keep it going!'
              : 'Log something today to keep it alive.'
            : 'Log a transaction to start a streak.'}
        </p>
      </div>

      {data && data.longest > 0 && (
        <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
          Longest: <span className="font-semibold text-slate-600 dark:text-slate-300">{data.longest} days</span>
          <span className="mx-1.5">·</span>
          {data.daysTracked} days tracked
        </p>
      )}
    </div>
  );
}
