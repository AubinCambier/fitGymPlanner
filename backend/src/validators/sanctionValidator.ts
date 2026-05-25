import { z } from 'zod';

export const sanctionCreateSchema = z.object({
  user_id: z.number().int().positive(),
  sanction_type: z.enum(['WARNING', 'SUSPENSION', 'BAN']),
  reason: z.string().min(1),
  end_date: z.string().datetime({ offset: true }).optional(),
});

export const sanctionUpdateSchema = z.object({
  reason: z.string().min(1).optional(),
  end_date: z.string().datetime({ offset: true }).optional(),
  is_active: z.boolean().optional(),
});
