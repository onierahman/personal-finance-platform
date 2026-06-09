// Strict contract: Zod validation schemas matching database constraints
import { z } from 'zod';

export const budgetSchema = z.object({
  category: z.string().min(1, 'Category selection is required.'),
  limit_amount: z.coerce
    .number()
    .positive('Budget limit must be greater than 0.')
    .safe(),
  period: z.enum(['monthly', 'annual'] as const, {
    required_error: 'Please select a valid budget period.',
  }),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid start date format.',
  }),
});