import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../utils/AppError.js';

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((e: { message: string }) => e.message).join(', ');
      return next(new AppError(message, 400));
    }
    req.body = result.data;
    next();
  };
}
