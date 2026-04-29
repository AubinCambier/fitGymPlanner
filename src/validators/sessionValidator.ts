import { z } from 'zod';

export const sessionCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  session_type_id: z.number().int().positive(),
  coach_id: z.number().int().positive().optional(),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
  capacity: z.number().int().positive(),
  intensity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

export const sessionUpdateSchema = sessionCreateSchema.partial();
