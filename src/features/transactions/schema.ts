import { z } from 'zod';

export const transactionSchema = z.object({
  account_id: z.string().uuid('Select an account'),
  amount: z
    .number({ invalid_type_error: 'Enter a valid amount' })
    .positive('Amount must be greater than 0')
    .max(999_999_999.99, 'Amount too large'),
  type: z.enum(['expense', 'income', 'transfer']),
  category: z.string().min(1, 'Select a category'),
  subcategory: z.string().optional(),
  merchant: z.string().max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  note: z.string().max(500).optional(),
  receipt_url: z.string().url().optional().or(z.literal('')),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const updateTransactionSchema = transactionSchema.partial().extend({
  id: z.string().uuid(),
});

export const deleteTransactionSchema = z.object({
  id: z.string().uuid(),
});
