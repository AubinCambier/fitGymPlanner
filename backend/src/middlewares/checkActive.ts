import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './authenticate.js';
import { AppError } from '../utils/AppError.js';
import { sanctionModel } from '../models/sanctionModel.js';
import pool from '../config/db.js';

export async function checkActive(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    // Auto-lift expired suspensions and reactivate the account if no other hard sanction remains
    const expiredResult = await pool.query(
      `UPDATE sanctions SET is_active = FALSE
       WHERE user_id = $1 AND is_active = TRUE AND sanction_type = 'SUSPENSION'
         AND end_date IS NOT NULL AND end_date < NOW()
       RETURNING id`,
      [userId]
    );

    if ((expiredResult.rowCount ?? 0) > 0) {
      const stillBlocked = await sanctionModel.hasActiveHardSanction(userId);
      if (!stillBlocked) {
        await pool.query('UPDATE users SET is_active = TRUE WHERE id = $1', [userId]);
      }
    }

    const blocked = await sanctionModel.hasActiveHardSanction(userId);
    if (blocked) throw new AppError('Account suspended or banned', 403);

    next();
  } catch (err) {
    next(err);
  }
}
