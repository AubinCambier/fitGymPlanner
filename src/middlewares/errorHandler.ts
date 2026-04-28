import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      code: err.statusCode,
      message: err.message,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: 'error',
    code: 500,
    message: 'Erreur interne du serveur',
  });
}
