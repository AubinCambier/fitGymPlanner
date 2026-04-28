import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './authenticate.js';
import { AppError } from '../utils/AppError.js';

export function authorize(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Accès refusé', 403));
    }
    next();
  };
}
