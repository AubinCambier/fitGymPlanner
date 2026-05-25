import { z } from 'zod';

export const adminUserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  role: z.enum(['ADMIN', 'COACH', 'MEMBER']).optional(),
});

export const adminUserUpdateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'COACH', 'MEMBER']).optional(),
});
