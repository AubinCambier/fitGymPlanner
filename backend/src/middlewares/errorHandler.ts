import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';

interface PgError extends Error {
  code?: string;
  detail?: string;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      code: err.statusCode,
      message: err.message,
    });
    return;
  }

  const pgErr = err as PgError;

  if (pgErr.code === '23505') {
    res.status(409).json({
      status: 'error',
      code: 409,
      message: 'Conflict: resource already exists',
    });
    return;
  }

  if (pgErr.code === '23503') {
    res.status(404).json({
      status: 'error',
      code: 404,
      message: 'Referenced resource not found',
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
