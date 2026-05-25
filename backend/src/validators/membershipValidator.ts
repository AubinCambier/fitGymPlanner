import { z } from 'zod';

export const membershipCreateSchema = z.object({
  pricing_id: z.number().int().positive(),
  payment_mode: z.enum(['MONTHLY', 'PAY_PER_SESSION']),
});
