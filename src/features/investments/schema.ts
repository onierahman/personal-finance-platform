import { z } from 'zod';

export const investmentSchema = z.object({
  asset_type: z.enum([
    'stock', 'etf', 'crypto', 'mutual_fund', 'bond',
    'real_estate', 'retirement', 'other',
  ]),
  symbol:         z.string().max(20).nullable().optional(),
  name:           z.string().min(1, 'Name is required').max(100),
  quantity:       z.coerce.number().positive('Quantity must be positive'),
  purchase_price: z.coerce.number().min(0, 'Purchase price must be 0 or more'),
  current_price:  z.coerce.number().min(0, 'Current price must be 0 or more'),
  purchase_date:  z.string().min(1, 'Purchase date is required'),
  notes:          z.string().max(500).nullable().optional(),
});

export type InvestmentSchema = z.infer<typeof investmentSchema>;
