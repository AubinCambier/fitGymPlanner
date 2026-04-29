import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { bookingModel } from '../models/bookingModel.js';
import { AppError } from '../utils/AppError.js';

function isPgError(err: unknown): err is { message: string; code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export const bookingController = {
  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await bookingModel.findByMember(req.user!.id);
      res.json({ status: 'success', data: bookings });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id } = req.body as { session_id: number };
      const booking = await bookingModel.create(req.user!.id, session_id);
      res.status(201).json({ status: 'success', data: booking });
    } catch (err) {
      if (isPgError(err)) {
        // Trigger capacité dépassée (P0001)
        if (err.code === 'P0001' && err.message.includes('Session complète')) {
          return next(new AppError('Session complète', 409));
        }
        // Doublon : membre déjà inscrit (uq_booking)
        if (err.code === '23505') {
          return next(new AppError('Vous êtes déjà inscrit à cette session', 409));
        }
        // Session inexistante (FK)
        if (err.code === '23503') {
          return next(new AppError('Session introuvable', 404));
        }
      }
      next(err);
    }
  },

  async cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const booking = await bookingModel.findById(id);

      if (!booking) throw new AppError('Réservation introuvable', 404);
      if (booking.member_id !== req.user!.id) throw new AppError('Accès refusé', 403);
      if (booking.status === 'CANCELLED') throw new AppError('Réservation déjà annulée', 409);

      const updated = await bookingModel.cancel(id);
      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },
};
