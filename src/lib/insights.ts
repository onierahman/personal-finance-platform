// ============================================================
// Monthly financial-insight engine.
// Computes a month's numbers and turns them into a short, specific
// written review. Works with zero external dependencies (rule-based
// writer); when ANTHROPIC_API_KEY is present the same numbers are
// handed to Claude for a more natural summary. The AI path is fully
// optional and can be switched on later just by setting the env var.
// ============================================================

export interface InsightStats {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
  savingsRate: number | null; // net / income, null when no income
  prevExpense: number;
  topCategories: { category: string; amount: number }[];
  transactionCount: number;
  largestExpense: { merchant: string | null; category: string; amount: number } | null;
}

export interface InsightPayload {
  headline: string;
  body: string[];
  stats: InsightStats;
  generatedBy: 'ai' | 'rules';
  generatedAt: string;
}

const pctChange = (curr: number, prev: number): number | null =>
  prev > 0 ? (curr - prev) / prev : null;

function fmtPct(n: number): string {
  return `${Math.abs(Math.round(n * 100))}%`;
}

/**
 * Deterministic, dependency-free writer. Produces a genuinely useful
 * review from the numbers alone — this is what ships until an AI key
 * is configured, and the fallback if a generation call fails.
 */
export function writeRuleBasedInsight(stats: InsightStats): InsightPayload {
  const body: string[] = [];
  const monthLabel = new Date(`${stats.month}-01T00:00:00`).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Headline keys off the savings rate — the single most telling number.
  let headline: string;
  if (stats.income === 0 && stats.expense === 0) {
    headline = `No activity recorded in ${monthLabel} yet`;
  } else if (stats.savingsRate === null) {
    headline = `You spent across ${stats.transactionCount} transactions in ${monthLabel}`;
  } else if (stats.savingsRate >= 0.2) {
    headline = `Strong month — you saved ${fmtPct(stats.savingsRate)} of your income`;
  } else if (stats.savingsRate > 0) {
    headline = `You saved ${fmtPct(stats.savingsRate)} of your income in ${monthLabel}`;
  } else {
    headline = `You spent more than you earned in ${monthLabel}`;
  }

  // Net position.
  if (stats.income > 0 || stats.expense > 0) {
    if (stats.net >= 0) {
      body.push(
        `You brought in ${money(stats.income)} and spent ${money(stats.expense)}, leaving ${money(
          stats.net,
        )} of breathing room.`,
      );
    } else {
      body.push(
        `You spent ${money(stats.expense)} against ${money(stats.income)} of income — ${money(
          Math.abs(stats.net),
        )} more than came in.`,
      );
    }
  }

  // Month-over-month spending trend.
  const change = pctChange(stats.expense, stats.prevExpense);
  if (change !== null && Math.abs(change) >= 0.05) {
    body.push(
      change > 0
        ? `Spending is up ${fmtPct(change)} from last month. Worth a glance at what changed.`
        : `Nicely done — spending is down ${fmtPct(change)} compared with last month.`,
    );
  } else if (change !== null) {
    body.push(`Your spending held steady versus last month.`);
  }

  // Where the money went.
  if (stats.topCategories.length > 0) {
    const top = stats.topCategories[0];
    const share = stats.expense > 0 ? top.amount / stats.expense : 0;
    body.push(
      `${top.category} was your biggest category at ${money(top.amount)}${
        share >= 0.25 ? ` — about ${fmtPct(share)} of everything you spent.` : '.'
      }`,
    );
  }

  // Largest single expense as a concrete anchor.
  if (stats.largestExpense && stats.largestExpense.amount > 0) {
    const le = stats.largestExpense;
    body.push(
      `Your largest single expense was ${money(le.amount)}${
        le.merchant ? ` at ${le.merchant}` : ` in ${le.category}`
      }.`,
    );
  }

  if (body.length === 0) {
    body.push('Add a few transactions and your monthly review will appear here.');
  }

  return {
    headline,
    body,
    stats,
    generatedBy: 'rules',
    generatedAt: new Date().toISOString(),
  };
}

function money(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/** Compact prompt describing the numbers for the optional AI writer. */
export function buildInsightPrompt(stats: InsightStats, currency: string): string {
  const monthLabel = new Date(`${stats.month}-01T00:00:00`).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  return `You are a concise, encouraging personal-finance assistant. Using ONLY the figures below, write a short monthly review for ${monthLabel}. Currency is ${currency}.

Figures:
- Income: ${stats.income}
- Expenses: ${stats.expense}
- Net: ${stats.net}
- Savings rate: ${stats.savingsRate === null ? 'n/a' : Math.round(stats.savingsRate * 100) + '%'}
- Previous month expenses: ${stats.prevExpense}
- Transaction count: ${stats.transactionCount}
- Top categories: ${stats.topCategories.map((c) => `${c.category} ${c.amount}`).join(', ') || 'none'}
- Largest expense: ${stats.largestExpense ? `${stats.largestExpense.amount} ${stats.largestExpense.merchant ?? stats.largestExpense.category}` : 'none'}

Return ONLY valid JSON: {"headline": "<max 8 words>", "body": ["<sentence>", "<sentence>", "<sentence>"]}.
Rules: 2-4 short sentences in body. Be specific with numbers. Never invent data not given. Friendly, never preachy. No markdown.`;
}
