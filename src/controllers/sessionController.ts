import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { sessionModel } from '../models/sessionModel.js';
import { AppError } from '../utils/AppError.js';

export const sessionController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query['type'] ? Number(req.query['type']) : undefined;
      const date = req.query['date'] as string | undefined;
      const coach_id = req.query['coach_id'] ? Number(req.query['coach_id']) : undefined;

      const sessions = await sessionModel.findAll({ type, date, coach_id });
      res.json({ status: 'success', data: sessions });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const session = await sessionModel.findById(id);
      if (!session) throw new AppError('Session introuvable', 404);

      res.json({ status: 'success', data: session });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const body = req.body;

      // COACH : son ID est forcé, il ne peut pas créer pour un autre coach
      const coach_id = user.role === 'COACH' ? user.id : (body.coach_id as number);
      if (!coach_id) throw new AppError('coach_id requis', 400);

      const session = await sessionModel.create({ ...body, coach_id });
      res.status(201).json({ status: 'success', data: session });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const id = Number(req.params['id']);

      const existing = await sessionModel.findById(id);
      if (!existing) throw new AppError('Session introuvable', 404);

      if (user.role === 'COACH' && existing.coach_id !== user.id) {
        throw new AppError('Accès refusé', 403);
      }

      const session = await sessionModel.update(id, req.body);
      res.json({ status: 'success', data: session });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const deleted = await sessionModel.delete(id);
      if (!deleted) throw new AppError('Session introuvable', 404);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  async getParticipants(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const id = Number(req.params['id']);

      const session = await sessionModel.findById(id);
      if (!session) throw new AppError('Session introuvable', 404);

      if (user.role === 'COACH' && session.coach_id !== user.id) {
        throw new AppError('Accès refusé', 403);
      }

      const participants = await sessionModel.findParticipants(id);
      res.json({ status: 'success', data: participants });
    } catch (err) {
      next(err);
    }
  },
};
