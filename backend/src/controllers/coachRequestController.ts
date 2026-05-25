import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { coachRequestModel } from '../models/coachRequestModel.js';
import { sessionModel } from '../models/sessionModel.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';
import { sendMail } from '../utils/mailer.js';

function isPgError(err: unknown): err is { message: string; code: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

export const coachRequestController = {
  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await coachRequestModel.findByCoach(req.user!.id);
      res.json({ status: 'success', data: requests });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id, reason } = req.body as { session_id: number; reason: string };

      const request = await coachRequestModel.create({
        coach_id: req.user!.id,
        session_id,
        reason,
      });

      const [coach, admins] = await Promise.all([
        userModel.findById(req.user!.id),
        userModel.findAll({ role: 'ADMIN', active: true }),
      ]);

      for (const admin of admins) {
        sendMail(
          admin.email,
          'New session cancellation request',
          `<p>Hello ${admin.first_name},</p>
           <p>Coach <strong>${coach?.first_name ?? ''} ${coach?.last_name ?? ''}</strong> has submitted a cancellation request for session #${session_id}.</p>
           <p><strong>Reason:</strong> ${reason}</p>
           <p>Please review it in the admin panel.</p>`
        ).catch((err: unknown) => console.error('Mail error:', err));
      }

      res.status(201).json({ status: 'success', data: request });
    } catch (err) {
      if (isPgError(err)) {
        if (err.code === 'P0001') {
          return next(new AppError('You can only submit requests for your own sessions', 403));
        }
        if (err.code === '23505') {
          return next(new AppError('A request already exists for this session', 409));
        }
        if (err.code === '23503') {
          return next(new AppError('Session not found', 404));
        }
      }
      next(err);
    }
  },

  async getAllAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query['status'] as string | undefined;
      const filters: { status?: string } = {};
      if (status !== undefined) filters.status = status;
      const requests = await coachRequestModel.findAll(filters);
      res.json({ status: 'success', data: requests });
    } catch (err) {
      next(err);
    }
  },

  async decide(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { status, admin_comment } = req.body as { status: 'APPROVED' | 'REJECTED'; admin_comment?: string };

      const existing = await coachRequestModel.findById(id);
      if (!existing) throw new AppError('Request not found', 404);
      if (existing.status !== 'PENDING') throw new AppError('Request already processed', 409);

      const decideData: { status: 'APPROVED' | 'REJECTED'; admin_id: number; admin_comment?: string } = {
        status,
        admin_id: req.user!.id,
      };
      if (admin_comment !== undefined) decideData.admin_comment = admin_comment;
      const updated = await coachRequestModel.decide(id, decideData);

      const coach = await userModel.findById(existing.coach_id);

      if (status === 'APPROVED') {
        await sessionModel.update(existing.session_id, { status: 'CANCELLED' });

        if (coach) {
          sendMail(
            coach.email,
            'Your cancellation request has been approved',
            `<p>Hello ${coach.first_name},</p>
             <p>Your cancellation request for session #${existing.session_id} has been <strong>approved</strong>.</p>
             ${admin_comment ? `<p>Admin comment: ${admin_comment}</p>` : ''}
             <p>The session has been cancelled.</p>`
          ).catch((err: unknown) => console.error('Mail error:', err));
        }
      } else {
        if (coach) {
          sendMail(
            coach.email,
            'Your cancellation request has been rejected',
            `<p>Hello ${coach.first_name},</p>
             <p>Your cancellation request for session #${existing.session_id} has been <strong>rejected</strong>.</p>
             ${admin_comment ? `<p>Admin comment: ${admin_comment}</p>` : ''}`
          ).catch((err: unknown) => console.error('Mail error:', err));
        }
      }

      res.json({ status: 'success', data: updated });
    } catch (err) {
      next(err);
    }
  },
};
