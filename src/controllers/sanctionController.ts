import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { sanctionModel } from '../models/sanctionModel.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';

const HARD_SANCTIONS = ['BAN', 'SUSPENSION'];

export const sanctionController = {
  async getAll(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sanctions = await sanctionModel.findAll();
      res.json({ status: 'success', data: sanctions });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const sanction = await sanctionModel.findById(id);
      if (!sanction) throw new AppError('Sanction introuvable', 404);

      res.json({ status: 'success', data: sanction });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user_id, sanction_type, reason, end_date } = req.body;

      const user = await userModel.findById(user_id);
      if (!user) throw new AppError('Utilisateur introuvable', 404);

      const sanction = await sanctionModel.create({
        user_id,
        issued_by: req.user!.id,
        sanction_type,
        reason,
        end_date,
      });

      if (HARD_SANCTIONS.includes(sanction_type)) {
        await userModel.setStatus(user_id, false);
      }

      res.status(201).json({ status: 'success', data: sanction });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { reason, end_date, is_active } = req.body;

      const existing = await sanctionModel.findById(id);
      if (!existing) throw new AppError('Sanction introuvable', 404);

      const updated = await sanctionModel.update(id, { reason, end_date, is_active });

      // Réactivation automatique : sanction levée + plus aucun BAN/SUSPENSION actif
      if (is_active === false && HARD_SANCTIONS.includes(existing.sanction_type)) {
        const stillSanctioned = await sanctionModel.hasActiveHardSanction(existing.user_id);
        if (!stillSanctioned) {
          await userModel.setStatus(existing.user_id, true);
        }
      }

      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },
};
