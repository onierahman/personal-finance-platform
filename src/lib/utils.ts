import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn/ui class merger */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a random hex color */
export function randomColor(): string {
  const palette = [
    '#6366F1','#8B5CF6','#EC4899','#EF4444','#F97316',
    '#F59E0B','#22C55E','#10B981','#06B6D4','#3B82F6',
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Deep equal for simple objects (avoids re-renders) */
export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every(k => a[k] === b[k]);
}

/** Sleep for n milliseconds */
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Group array by key */
export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/** Sum an array by key */
export function sumBy<T>(arr: T[], key: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + key(item), 0);
}

/** Get YYYY-MM from a date string */
export function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** Suggested monthly contribution to reach a goal */
export function suggestedMonthlyContribution(
  target: number,
  current: number,
  deadlineIso: string | null,
): number | null {
  if (!deadlineIso) return null;
  const remaining = target - current;
  if (remaining <= 0) return 0;
  const months =
    (new Date(deadlineIso).getFullYear() - new Date().getFullYear()) * 12 +
    (new Date(deadlineIso).getMonth() - new Date().getMonth());
  if (months <= 0) return remaining;
  return Math.ceil((remaining / months) * 100) / 100;
}

/** Build budget health status from ratio */
export function budgetHealthStatus(
  spent: number,
  limit: number,
): { ratio: number; status: 'safe' | 'warning' | 'danger' | 'over' } {
  const ratio = limit > 0 ? spent / limit : 0;
  let status: 'safe' | 'warning' | 'danger' | 'over';
  if (ratio < 0.7)  status = 'safe';
  else if (ratio < 0.9) status = 'warning';
  else if (ratio < 1.0) status = 'danger';
  else status = 'over';
  return { ratio, status };
}
