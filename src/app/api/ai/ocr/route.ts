import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rateLimit';

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

const RECEIPT_PROMPT = `Extract transaction details from this receipt image. Return ONLY valid JSON with these exact keys:
{
  "amount": <number, positive, no currency symbols>,
  "merchant": <string or null>,
  "date": <"YYYY-MM-DD" or null>,
  "type": <"expense" or "income">,
  "category": <one of: Housing, Utilities, Groceries, Dining, Transportation, Shopping, Health, Insurance, Education, Entertainment, Travel, Subscriptions, Personal Care, Fitness, Taxes, Investments, Gifts, Other, Salary, Freelance, Business, Rental, Dividends, Interest, Bonus, Side Income, Other Income>,
  "note": <string or null>,
  "confidence": <0.0 to 1.0>
}
If you cannot extract a receipt, return {"error": "reason"}.`;

const BANK_STATEMENT_PROMPT = `Extract all transactions from this bank statement page. Return ONLY a valid JSON array:
[{
  "date": "YYYY-MM-DD",
  "amount": <number, positive>,
  "type": <"expense" or "income">,
  "merchant": <string>
}]
Return [] if no transactions are found.`;

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Per-user rate limit — each call is a paid model request; cap abuse/cost.
    const limit = rateLimit(`ocr:${user.id}`, 20, 60 * 1000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.retryAfterMs / 1000)) } },
      );
    }

    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const mode  = formData.get('mode') as 'receipt' | 'bank-statement-pdf' | null;

    if (!image || !mode) {
      return NextResponse.json({ error: 'Missing image or mode' }, { status: 400 });
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 413 });
    }

    const mediaType = (image.type || 'image/jpeg') as AllowedMediaType;
    if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 415 });
    }

    const buffer  = await image.arrayBuffer();
    const base64  = Buffer.from(buffer).toString('base64');

    const client = new Anthropic();
    const message = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role:    'user',
          content: [
            {
              type:  'image',
              source: {
                type:       'base64',
                media_type: mediaType,
                data:       base64,
              },
            },
            {
              type: 'text',
              text: mode === 'receipt' ? RECEIPT_PROMPT : BANK_STATEMENT_PROMPT,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from the response (Claude may wrap it in markdown code blocks)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    const jsonStr   = jsonMatch ? jsonMatch[1] ?? jsonMatch[0] : text.trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: 'Could not parse receipt — try a clearer photo' }, { status: 422 });
    }

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'error' in parsed) {
      return NextResponse.json({ error: (parsed as { error: string }).error }, { status: 422 });
    }

    return NextResponse.json({ data: parsed });
  } catch (err) {
    console.error('[OCR] error:', err);
    return NextResponse.json({ error: 'OCR service unavailable' }, { status: 500 });
  }
}
