// Strict contract: Sync validation rules with engine constraints
import { z } from 'zod';

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal designation title is required.').max(150),
  description: z.string().optional().nullable(),
  target_amount: z.coerce
    .number()
    .positive('Target baseline must be greater than 0.'),
  deadline: z.string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid deadline sequence.' })
    .nullable()
    .optional(),
  priority: z.enum(['low', 'medium', 'high'] as const).default('medium'),
  icon: z.string().default('🎯'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Malformed hexadecimal color code.').default('#2563EB'),
});