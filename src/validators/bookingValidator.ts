import { z } from 'zod';

export const bookingCreateSchema = z.object({
  session_id: z.number().int().positive(),
});
