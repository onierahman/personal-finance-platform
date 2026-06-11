//
// ─── SWITCH OCR BACKEND HERE ──────────────────────────────────────────────────
// 'tesseract'  free, runs in the browser, no API key needed
// 'api'        Anthropic Claude Haiku Vision — more accurate, needs ANTHROPIC_API_KEY in .env.local
// eslint-disable-next-line @typescript-eslint/no-inferrable-types
export const OCR_BACKEND = 'tesseract' as 'tesseract' | 'api';
// ─────────────────────────────────────────────────────────────────────────────

import { normalizeDate, suggestCategory } from './import';

export interface OcrReceiptResult {
  amount?: number;
  merchant?: string;
  date?: string;
  type?: 'expense' | 'income';
  category?: string;
  note?: string;
  confidence?: number;
}

// ── Tesseract path ────────────────────────────────────────────────────────────

function parseAmountFromText(text: string): number | null {
  // Priority 1: "TOTAL" / "Grand Total" / "Amount Due" followed by a number
  const totalMatch = text.match(
    /(?:grand\s+)?(?:total|amount\s+due|amount\s+payable|balance\s+due)[^\d$]*\$?\s*([\d,]+\.?\d*)/i,
  );
  if (totalMatch) {
    const n = parseFloat(totalMatch[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }

  // Priority 2: collect all dollar amounts and return the largest (likely the total)
  const allAmounts: number[] = [];
  for (const m of text.matchAll(/\$\s*([\d,]+\.\d{2})/g)) {
    const n = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) allAmounts.push(n);
  }
  if (allAmounts.length) return Math.max(...allAmounts);

  // Priority 3: any XX.XX number near the end of the text
  const lines = text.split('\n').filter(l => l.trim());
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 6); i--) {
    const m = lines[i].match(/([\d,]+\.\d{2})/);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > 0) return n;
    }
  }

  return null;
}

function parseMerchantFromText(text: string): string | null {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 2);

  // Skip lines that look like dates, phone numbers, pure numbers, or web addresses
  const skipPattern = /^\d+$|^[\d\s\-\+\(\)]+$|https?:\/\/|www\.|^\d{1,2}[\/\-]\d{1,2}/i;

  for (const line of lines.slice(0, 5)) {
    if (!skipPattern.test(line) && line.length >= 3 && line.length <= 60) {
      return line.replace(/[*#|]/g, '').trim();
    }
  }
  return null;
}

function parseDateFromText(text: string): string | null {
  // Try common receipt date patterns
  const patterns = [
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/,
    /\b(\d{4}[\/\-]\d{2}[\/\-]\d{2})\b/,
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i,
  ];

  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const normalized = normalizeDate(m[1]);
      if (normalized) return normalized;
    }
  }
  return null;
}

async function extractReceiptViaTesseract(imageFile: File): Promise<OcrReceiptResult> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');

  try {
    const { data: { text, confidence } } = await worker.recognize(imageFile);

    const amount   = parseAmountFromText(text) ?? undefined;
    const merchant = parseMerchantFromText(text) ?? undefined;
    const date     = parseDateFromText(text) ?? undefined;

    return {
      amount,
      merchant,
      date,
      type:       'expense',
      category:   merchant ? suggestCategory(merchant, 'expense') : 'Other',
      confidence: confidence / 100, // Tesseract returns 0-100
    };
  } finally {
    await worker.terminate();
  }
}

// ── API path (Anthropic Claude Vision) ───────────────────────────────────────

async function extractReceiptViaApi(imageFile: File): Promise<OcrReceiptResult> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('mode', 'receipt');

  const res  = await fetch('/api/ai/ocr', { method: 'POST', body: formData });
  const json = await res.json();

  if (!res.ok || json.error) throw new Error(json.error ?? 'OCR API error');
  return json.data as OcrReceiptResult;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function extractReceiptData(imageFile: File): Promise<OcrReceiptResult> {
  return OCR_BACKEND === 'api'
    ? extractReceiptViaApi(imageFile)
    : extractReceiptViaTesseract(imageFile);
}

export const PDF_SUPPORTED: boolean = OCR_BACKEND === 'api';
