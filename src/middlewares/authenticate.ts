import type { Request, Response, NextFunction } from 'express';
import { JwtManager, type JwtPayload } from '../utils/JwtManager.js';
import { AppError } from '../utils/AppError.js';
import { userModel } from '../models/userModel.js';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError('Token manquant', 401);

    const token = header.split(' ')[1] ?? '';
    const payload = JwtManager.decodeJWT(token);

    const user = await userModel.findById(payload.id);
    if (!user) throw new AppError('Utilisateur introuvable', 401);
    if (!user.is_active) throw new AppError('Compte désactivé', 403);
    if (user.password_hash.slice(-8) !== payload.fp) throw new AppError('Token invalide', 401);

    req.user = payload;
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError('Token invalide', 401));
  }
}
