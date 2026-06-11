import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

const CATEGORY_NAMES = EXPENSE_CATEGORIES.map(c => c.name) as [string, ...string[]];

export const budgetSchema = z.object({
  category: z.enum(CATEGORY_NAMES, {
    errorMap: () => ({ message: 'Please select a valid expense category.' }),
  }),
  limit_amount: z.coerce
    .number()
    .positive('Budget limit must be greater than 0.')
    .safe(),
  period: z.enum(['monthly', 'annual'] as const, {
    required_error: 'Please select a valid budget period.',
  }),
  start_date: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format.',
  }),
});