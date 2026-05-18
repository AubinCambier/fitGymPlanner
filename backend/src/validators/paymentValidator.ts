import { z } from 'zod';

export const paymentCreateSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
});
