import { z } from 'zod';

export const recurringSchema = z.object({
  merchant: z.string().min(2, 'Merchant name must be at least 2 characters.'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  frequency: z.enum(['weekly', 'monthly', 'annual']),
  type: z.enum(['expense', 'income']),
  start_date: z.string().min(1, 'Start date is required.'),
  next_due: z.string().min(1, 'Next due date is required.'),
  category: z.string().min(1, 'Please allocate a category.'),
  account_id: z.string().min(1, 'Please select an account for this schedule.'),
});