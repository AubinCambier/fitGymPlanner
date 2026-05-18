import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { reviewModel } from '../models/reviewModel.js';
import { bookingModel } from '../models/bookingModel.js';
import { sessionModel } from '../models/sessionModel.js';
import { AppError } from '../utils/AppError.js';

export const reviewController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.user!.id;
      const { booking_id, rating, comment, is_anonymous } = req.body as {
        booking_id: number;
        rating: number;
        comment?: string;
        is_anonymous?: boolean;
      };

      const booking = await bookingModel.findById(booking_id);
      if (!booking) throw new AppError('Booking not found', 404);
      if (booking.member_id !== memberId) throw new AppError('Access denied', 403);
      if (booking.status !== 'CONFIRMED') throw new AppError('Booking is not confirmed', 403);

      const session = await sessionModel.findById(booking.session_id);
      if (!session) throw new AppError('Session not found', 404);
      if (new Date(session.end_time) > new Date()) {
        throw new AppError('Session has not ended yet', 403);
      }

      try {
        const createData: Parameters<typeof reviewModel.create>[0] = {
          booking_id,
          member_id: memberId,
          coach_id: session.coach_id,
          rating,
        };
        if (comment !== undefined) createData.comment = comment;
        if (is_anonymous !== undefined) createData.is_anonymous = is_anonymous;
        const review = await reviewModel.create(createData);
        res.status(201).json({ status: 'success', data: review });
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code === '23505') throw new AppError('Review already exists for this booking', 409);
        throw err;
      }
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.user!.id;
      const id = parseInt(req.params['id'] as string, 10);
      const { rating, comment, is_anonymous } = req.body as {
        rating?: number;
        comment?: string | null;
        is_anonymous?: boolean;
      };

      const review = await reviewModel.findById(id);
      if (!review) throw new AppError('Review not found', 404);
      if (review.member_id !== memberId) throw new AppError('Access denied', 403);

      const data: { rating?: number; comment?: string | null; is_anonymous?: boolean } = {};
      if (rating !== undefined) data.rating = rating;
      if (comment !== undefined) data.comment = comment;
      if (is_anonymous !== undefined) data.is_anonymous = is_anonymous;

      const updated = await reviewModel.update(id, data);
      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },

  async getByCoach(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const coachId = parseInt(req.params['coachId'] as string, 10);
      const data = await reviewModel.findByCoach(coachId);
      res.json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },

  async getMine(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.user!.id;
      const reviews = await reviewModel.findByMember(memberId);
      res.json({ status: 'success', data: reviews });
    } catch (err) {
      next(err);
    }
  },
};
