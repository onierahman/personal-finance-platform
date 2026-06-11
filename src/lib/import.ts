import { parse, isValid } from 'date-fns';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './constants';
import type { InsertTransaction } from '@/types/database';

export type TransactionField = 'amount' | 'date' | 'merchant' | 'type' | 'category' | 'note' | 'skip';

export interface ColumnMapping {
  [csvHeader: string]: TransactionField;
}

export interface ParsedRow {
  raw: Record<string, string>;
  mapped: Partial<InsertTransaction>;
  errors: string[];
  isValid: boolean;
}

export interface ImportResult {
  rows: ParsedRow[];
  validCount: number;
  invalidCount: number;
}

export function normalizeAmount(raw: string): number | null {
  if (!raw) return null;
  // Handle parentheses as negative: (100.00) → -100
  const isNegative = /^\(.*\)$/.test(raw.trim());
  const cleaned = raw.replace(/[$£€A$,\s()]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return isNegative ? -num : num;
}

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'dd-MM-yyyy',
  'MM-dd-yyyy',
  'd/M/yyyy',
  'M/d/yyyy',
  'dd MMM yyyy',
  'MMM dd yyyy',
  'dd MMM yy',
  'yyyy/MM/dd',
];

export function normalizeDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const refDate = new Date();
  for (const fmt of DATE_FORMATS) {
    try {
      const parsed = parse(trimmed, fmt, refDate);
      if (isValid(parsed)) {
        const yyyy = parsed.getFullYear();
        const mm   = String(parsed.getMonth() + 1).padStart(2, '0');
        const dd   = String(parsed.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch {
      // try next format
    }
  }
  return null;
}

export function detectTransactionType(raw: string): 'expense' | 'income' | null {
  const s = raw.toLowerCase().trim();
  const expenseWords = ['debit', 'dr', 'expense', 'withdrawal', 'purchase', 'payment', 'debit amount'];
  const incomeWords  = ['credit', 'cr', 'income', 'deposit', 'transfer in', 'credit amount'];
  if (expenseWords.some(w => s.includes(w))) return 'expense';
  if (incomeWords.some(w => s.includes(w)))  return 'income';
  return null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Housing:        ['rent', 'mortgage', 'housing', 'property', 'landlord', 'lease'],
  Utilities:      ['electric', 'gas', 'water', 'internet', 'phone', 'utility', 'utilities', 'telstra', 'optus'],
  Groceries:      ['woolworths', 'coles', 'aldi', 'supermarket', 'grocery', 'groceries', 'safeway', 'trader joe'],
  Dining:         ['restaurant', 'cafe', 'coffee', 'mcdonald', 'kfc', 'subway', 'pizza', 'dining', 'food'],
  Transportation: ['uber', 'lyft', 'taxi', 'bus', 'train', 'fuel', 'petrol', 'parking', 'transport', 'opal'],
  Shopping:       ['amazon', 'ebay', 'target', 'kmart', 'big w', 'shopping', 'shop'],
  Health:         ['pharmacy', 'doctor', 'hospital', 'medical', 'chemist', 'health', 'dental', 'priceline'],
  Entertainment:  ['cinema', 'movie', 'netflix', 'spotify', 'gaming', 'steam', 'entertainment', 'disney'],
  Subscriptions:  ['subscription', 'monthly plan', 'annual plan', 'adobe', 'microsoft', 'apple'],
  Travel:         ['airline', 'hotel', 'airbnb', 'booking.com', 'flight', 'travel', 'qantas', 'jetstar'],
  Fitness:        ['gym', 'fitness', 'yoga', 'swim', 'sport', 'anytime fitness', 'f45'],
  Education:      ['school', 'university', 'course', 'tuition', 'education', 'textbook', 'udemy'],
  Insurance:      ['insurance', 'bupa', 'medibank', 'nrma', 'allianz'],
  Taxes:          ['tax', 'ato', 'irs', 'hmrc', 'gst'],
  Investments:    ['investment', 'stocks', 'shares', 'etf', 'vanguard', 'commsec', 'broker'],
  Gifts:          ['gift', 'present', 'flower', 'card'],
  Salary:         ['salary', 'payroll', 'wage', 'pay'],
  Freelance:      ['freelance', 'invoice', 'client payment'],
  Business:       ['business income', 'sales'],
  Rental:         ['rental income', 'rent received'],
  Dividends:      ['dividend'],
  Interest:       ['interest', 'savings interest'],
  Bonus:          ['bonus', 'commission'],
  'Side Income':  ['side income', 'gig', 'etsy'],
};

export function suggestCategory(merchant: string, type: 'expense' | 'income'): string {
  const s = merchant.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const catIsIncome = INCOME_CATEGORIES.some(c => c.name === cat);
    const catIsExpense = EXPENSE_CATEGORIES.some(c => c.name === cat);
    if (type === 'income'  && !catIsIncome)  continue;
    if (type === 'expense' && !catIsExpense) continue;
    if (keywords.some(k => s.includes(k))) return cat;
  }
  return type === 'income' ? 'Other Income' : 'Other';
}

const FIELD_SYNONYMS: Record<TransactionField, string[]> = {
  amount:   ['amount', 'sum', 'value', 'transaction amount', 'debit', 'credit', 'debit amount', 'credit amount'],
  date:     ['date', 'transaction date', 'value date', 'posted date', 'datetime', 'trans date'],
  merchant: ['description', 'merchant', 'payee', 'memo', 'narrative', 'details', 'narration', 'particulars'],
  type:     ['type', 'transaction type', 'dr/cr', 'debit/credit', 'dr cr'],
  category: ['category', 'tag', 'label', 'group'],
  note:     ['note', 'notes', 'reference', 'ref', 'remarks', 'comment'],
  skip:     [],
};

export function autoDetectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedFields = new Set<TransactionField>();

  for (const header of headers) {
    const lower = header.toLowerCase().trim();
    let bestField: TransactionField = 'skip';

    for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS) as [TransactionField, string[]][]) {
      if (field === 'skip') continue;
      if (usedFields.has(field)) continue;
      if (synonyms.some(s => lower === s || lower.includes(s))) {
        bestField = field;
        break;
      }
    }

    if (bestField !== 'skip') usedFields.add(bestField);
    mapping[header] = bestField;
  }

  return mapping;
}

export function parseAndMapRows(
  data: Record<string, string>[],
  mapping: ColumnMapping,
  accountId: string,
): ImportResult {
  const rows: ParsedRow[] = data.map((raw) => {
    const errors: string[] = [];
    const mapped: Partial<InsertTransaction> = { account_id: accountId };

    // Detect if there are separate debit/credit columns
    const debitHeader  = Object.entries(mapping).find(([h, f]) => h.toLowerCase().includes('debit')  && f === 'amount')?.[0];
    const creditHeader = Object.entries(mapping).find(([h, f]) => h.toLowerCase().includes('credit') && f === 'amount')?.[0];
    const amountHeader = Object.entries(mapping).find(([h, f]) => !h.toLowerCase().includes('debit') && !h.toLowerCase().includes('credit') && f === 'amount')?.[0];

    if (debitHeader && creditHeader) {
      // Separate debit/credit columns
      const debitRaw  = raw[debitHeader] ?? '';
      const creditRaw = raw[creditHeader] ?? '';
      const debit  = normalizeAmount(debitRaw);
      const credit = normalizeAmount(creditRaw);

      if (debit && debit > 0) {
        mapped.amount = debit;
        mapped.type = 'expense';
      } else if (credit && credit > 0) {
        mapped.amount = credit;
        mapped.type = 'income';
      }
    } else if (amountHeader) {
      const rawAmt = raw[amountHeader] ?? '';
      const amt = normalizeAmount(rawAmt);
      if (amt === null) {
        errors.push('Invalid amount');
      } else {
        mapped.amount = Math.abs(amt);
        if (!mapped.type) {
          mapped.type = amt < 0 ? 'expense' : 'income';
        }
      }
    }

    // Map other fields
    for (const [header, field] of Object.entries(mapping)) {
      if (field === 'skip' || field === 'amount') continue;
      const value = raw[header]?.trim() ?? '';

      switch (field) {
        case 'date': {
          const d = normalizeDate(value);
          if (!d) errors.push(`Invalid date: "${value}"`);
          else mapped.date = d;
          break;
        }
        case 'merchant':
          if (value) mapped.merchant = value.slice(0, 100);
          break;
        case 'type': {
          const t = detectTransactionType(value);
          if (t) mapped.type = t;
          break;
        }
        case 'category':
          if (value) mapped.category = value;
          break;
        case 'note':
          if (value) mapped.note = value.slice(0, 500);
          break;
      }
    }

    // Defaults
    if (!mapped.type) mapped.type = 'expense';
    if (!mapped.category) {
      mapped.category = suggestCategory(mapped.merchant ?? '', mapped.type as 'expense' | 'income');
    }
    if (!mapped.date) errors.push('Missing date');
    if (!mapped.amount || mapped.amount <= 0) errors.push('Missing or invalid amount');

    return {
      raw,
      mapped: mapped as Partial<InsertTransaction>,
      errors,
      isValid: errors.length === 0 && !!mapped.amount && !!mapped.date,
    };
  });

  return {
    rows,
    validCount:   rows.filter(r => r.isValid).length,
    invalidCount: rows.filter(r => !r.isValid).length,
  };
}
