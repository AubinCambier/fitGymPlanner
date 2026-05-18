import { z } from 'zod';

export const reviewCreateSchema = z.object({
  booking_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  is_anonymous: z.boolean().optional(),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().nullable().optional(),
  is_anonymous: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});
