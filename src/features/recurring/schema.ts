import { z } from 'zod';

export const recurringSchema = z.object({
  merchant:   z.string().min(2, 'Merchant name must be at least 2 characters.'),
  amount:     z.coerce.number().positive('Amount must be a positive number.'),
  // All 6 frequencies matching RecurringFrequency type and database enum
  frequency:  z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  type:       z.enum(['expense', 'income']),
  category:   z.string().min(1, 'Please select a category.'),
  account_id: z.string().min(1, 'Please select an account.'),
  start_date: z.string().min(1, 'Start date is required.'),
  next_due:   z.string().min(1, 'Next due date is required.'),
  note:       z.string().optional().nullable(),
  end_date:   z.string().optional().nullable(),
});