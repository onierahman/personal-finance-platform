// ============================================================
// formatters.ts
// Pure formatting utilities — no side effects, no imports
// ============================================================

// ── Currency ─────────────────────────────────────────────────

/**
 * Format a decimal amount as a localized currency string.
 * e.g. formatCurrency(1234.5, 'USD') → '$1,234.50'
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Compact format for large numbers in summary cards.
 * e.g. formatCurrencyCompact(12500, 'USD') → '$12.5K'
 */
export function formatCurrencyCompact(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  if (Math.abs(amount) < 1000) return formatCurrency(amount, currency, locale);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

/** Strip currency symbol for input fields */
export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

// ── Dates ────────────────────────────────────────────────────

/**
 * Format ISO date string to display format.
 * e.g. formatDate('2026-06-07') → 'Jun 7, 2026'
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
  locale = 'en-US',
): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Short date format.
 * e.g. formatDateShort('2026-06-07') → 'Jun 7'
 */
export function formatDateShort(date: string | Date, locale = 'en-US'): string {
  return formatDate(date, { month: 'short', day: 'numeric' }, locale);
}

/**
 * Month + year.
 * e.g. formatMonth('2026-06') → 'June 2026'
 */
export function formatMonth(yearMonth: string, locale = 'en-US'): string {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1));
}

/**
 * Relative time — "2 days ago", "in 3 days", "today"
 */
export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = d.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0)  return 'today';
  if (diffDays === 1)  return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 0 && diffDays <= 30) return `in ${diffDays} days`;
  if (diffDays < 0 && diffDays >= -30) return `${Math.abs(diffDays)} days ago`;

  return formatDate(d);
}

/**
 * Format a Date as a YYYY-MM-DD string using the LOCAL calendar date.
 * Unlike toISOString() (which converts to UTC and can roll the date
 * forward/back across midnight), this preserves the date the user
 * actually sees on their wall clock.
 */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO date string for today (local time): YYYY-MM-DD */
export function todayIso(): string {
  return toLocalIsoDate(new Date());
}

/** YYYY-MM for current month (local time) */
export function currentYearMonth(): string {
  return todayIso().slice(0, 7);
}

/** First day of month as ISO date */
export function monthStart(yearMonth: string): string {
  return `${yearMonth}-01`;
}

/** Last day of month as ISO date */
export function monthEnd(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  // Day 0 of the next month = last day of this month, in local time.
  return toLocalIsoDate(new Date(y, m, 0));
}

// ── Numbers ──────────────────────────────────────────────────

/**
 * Format percentage: 0.75 → '75%' | 1.05 → '105%'
 */
export function formatPercent(ratio: number, decimals = 0): string {
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/**
 * Format a plain number with thousands separators.
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

// ── Strings ──────────────────────────────────────────────────

/** Truncate long strings with ellipsis */
export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '…';
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Snake/kebab to Title Case */
export function toTitleCase(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(w => capitalize(w))
    .join(' ');
}
