import type { ColumnMapping, TransactionField } from './import';

export interface BankPreset {
  id: string;
  name: string;
  country: string;
  columnMapping: ColumnMapping;
  amountSign: 'normal' | 'inverted';
  dateFormat?: string;
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: 'commonwealth-bank',
    name: 'Commonwealth Bank',
    country: 'AU',
    columnMapping: {
      'Date':        'date',
      'Amount':      'amount',
      'Description': 'merchant',
      'Balance':     'skip',
    },
    amountSign: 'normal',
    dateFormat: 'dd/MM/yyyy',
  },
  {
    id: 'nab',
    name: 'NAB',
    country: 'AU',
    columnMapping: {
      'Date':           'date',
      'Amount':         'amount',
      'Narrative':      'merchant',
      'Memo':           'note',
      'Balance':        'skip',
      'Account Number': 'skip',
      'Bsb':            'skip',
    },
    amountSign: 'normal',
    dateFormat: 'dd-MM-yyyy',
  },
  {
    id: 'westpac',
    name: 'Westpac',
    country: 'AU',
    columnMapping: {
      'BSB':                 'skip',
      'Account Number':      'skip',
      'Transaction Date':    'date',
      'Narration':           'merchant',
      'Cheque Number':       'skip',
      'Debit Amount':        'amount',
      'Credit Amount':       'amount',
      'Balance':             'skip',
    },
    amountSign: 'normal',
    dateFormat: 'dd/MM/yyyy',
  },
  {
    id: 'anz',
    name: 'ANZ',
    country: 'AU',
    columnMapping: {
      'Date':        'date',
      'Amount':      'amount',
      'Description': 'merchant',
      'Type':        'type',
      'Balance':     'skip',
    },
    amountSign: 'normal',
    dateFormat: 'dd/MM/yyyy',
  },
  {
    id: 'chase',
    name: 'Chase',
    country: 'US',
    columnMapping: {
      'Transaction Date': 'date',
      'Post Date':        'skip',
      'Description':      'merchant',
      'Category':         'category',
      'Type':             'type',
      'Amount':           'amount',
      'Memo':             'note',
    },
    amountSign: 'normal',
    dateFormat: 'MM/dd/yyyy',
  },
  {
    id: 'bank-of-america',
    name: 'Bank of America',
    country: 'US',
    columnMapping: {
      'Date':        'date',
      'Description': 'merchant',
      'Amount':      'amount',
      'Running Bal.': 'skip',
    },
    amountSign: 'normal',
    dateFormat: 'MM/dd/yyyy',
  },
  {
    id: 'barclays',
    name: 'Barclays',
    country: 'UK',
    columnMapping: {
      'Date':                   'date',
      'Merchant/Description':   'merchant',
      'Debit Amount':           'amount',
      'Credit Amount':          'amount',
      'Balance':                'skip',
    },
    amountSign: 'normal',
    dateFormat: 'dd/MM/yyyy',
  },
];

export function detectBank(headers: string[]): BankPreset | null {
  const normalizedHeaders = headers.map(h => h.trim());
  let bestPreset: BankPreset | null = null;
  let bestScore = 0;

  for (const preset of BANK_PRESETS) {
    const presetHeaders = Object.keys(preset.columnMapping);
    const score = presetHeaders.filter(ph =>
      normalizedHeaders.some(h => h.toLowerCase() === ph.toLowerCase())
    ).length;

    const ratio = score / presetHeaders.length;
    if (ratio > bestScore && ratio >= 0.5) {
      bestScore  = ratio;
      bestPreset = preset;
    }
  }

  return bestPreset;
}
