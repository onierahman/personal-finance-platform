import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function randomColor(): string {
  const palette = [
    '#6366F1','#8B5CF6','#EC4899','#EF4444','#F97316',
    '#F59E0B','#22C55E','#10B981','#06B6D4','#3B82F6',
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function shallowEqual<T extends Record<string, unknown>>(a: T, b: T): boolean {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every(k => a[k] === b[k]);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

export function sumBy<T>(arr: T[], key: (item: T) => number): number {
  return arr.reduce((acc, item) => acc + key(item), 0);
}

export function toYearMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

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

export function budgetHealthStatus(
  spent: number,
  limit: number,
): { ratio: number; status: 'safe' | 'warning' | 'danger' | 'over' } {
  const ratio = limit > 0 ? spent / limit : 0;
  let status: 'safe' | 'warning' | 'danger' | 'over';
  if (ratio < 0.7)       status = 'safe';
  else if (ratio < 0.9)  status = 'warning';
  else if (ratio < 1.0)  status = 'danger';
  else                   status = 'over';
  return { ratio, status };
}

/**
 * Returns urgency level and days remaining for a goal deadline.
 * Used to drive colour coding and deadline badges on goal cards.
 */
export function goalDeadlineUrgency(
  deadlineIso: string | null,
): { daysLeft: number | null; urgency: 'none' | 'low' | 'medium' | 'high' | 'overdue' } {
  if (!deadlineIso) return { daysLeft: null, urgency: 'none' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineIso);
  deadline.setHours(0, 0, 0, 0);

  const daysLeft = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let urgency: 'none' | 'low' | 'medium' | 'high' | 'overdue';
  if (daysLeft < 0)        urgency = 'overdue';
  else if (daysLeft <= 7)  urgency = 'high';
  else if (daysLeft <= 30) urgency = 'medium';
  else if (daysLeft <= 90) urgency = 'low';
  else                     urgency = 'none';

  return { daysLeft, urgency };
}