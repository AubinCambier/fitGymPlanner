import { z } from 'zod';

export const pricingCreateSchema = z.object({
  label: z.string().min(1).max(100),
  payment_mode: z.enum(['MONTHLY', 'PAY_PER_SESSION']),
  price: z.number().nonnegative(),
  currency: z.string().length(3).optional(),
});

export const pricingUpdateSchema = pricingCreateSchema.partial();
