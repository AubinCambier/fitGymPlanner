import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { sessionModel } from '../models/sessionModel.js';
import { AppError } from '../utils/AppError.js';

export const coachController = {
  async getMySessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessions = await sessionModel.findAll({ coach_id: req.user!.id });
      res.json({ status: 'success', data: sessions });
    } catch (err) {
      next(err);
    }
  },

  async getMySessionParticipants(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const session = await sessionModel.findById(id);

      if (!session) throw new AppError('Session introuvable', 404);
      if (session.coach_id !== req.user!.id) throw new AppError('Accès refusé', 403);

      const participants = await sessionModel.findParticipants(id);
      res.json({ status: 'success', data: participants });
    } catch (err) {
      next(err);
    }
  },
};
