import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { paymentModel } from '../models/paymentModel.js';

export const paymentController = {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { amount, description } = req.body as { amount: number; description: string };
      const payment = await paymentModel.create({
        user_id: req.user!.id,
        amount,
        description,
      });
      res.status(201).json({ status: 'success', data: payment });
    } catch (err) {
      next(err);
    }
  },

  async getMyPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await paymentModel.findByUser(req.user!.id);
      res.json({ status: 'success', data: payments });
    } catch (err) {
      next(err);
    }
  },
};
