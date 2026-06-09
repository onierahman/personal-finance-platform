import { z } from 'zod';

export const recurringTransactionSchema = z.object({
  account_id: z.string().uuid('Please select a valid destination financial account.'),
  amount: z.coerce.number().positive('Value must be greater than 0.'),
  type: z.enum(['expense', 'income'] as const),
  category: z.string().min(1, 'Category is required.'),
  merchant: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] as const),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start date.' }),
  next_due: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid due date.' }),
  end_date: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});