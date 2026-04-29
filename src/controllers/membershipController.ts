import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { membershipModel } from '../models/membershipModel.js';
import { pricingModel } from '../models/pricingModel.js';
import { AppError } from '../utils/AppError.js';

export const membershipController = {
  async getMyMembership(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const membership = await membershipModel.findActiveByMember(req.user!.id);
      res.json({ status: 'success', data: membership });
    } catch (err) {
      next(err);
    }
  },

  async subscribe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pricing_id, payment_mode } = req.body as { pricing_id: number; payment_mode: string };

      const pricing = await pricingModel.findById(pricing_id);
      if (!pricing) throw new AppError('Tarif introuvable', 404);
      if (!pricing.is_active) throw new AppError('Ce tarif n\'est plus disponible', 400);

      const existing = await membershipModel.findActiveByMember(req.user!.id);
      if (existing) throw new AppError('Vous avez déjà un abonnement actif', 409);

      const membership = await membershipModel.create({
        member_id: req.user!.id,
        pricing_id,
        payment_mode,
      });

      res.status(201).json({ status: 'success', data: membership });
    } catch (err) {
      next(err);
    }
  },

  async cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const membership = await membershipModel.cancel(req.user!.id);
      if (!membership) throw new AppError('Aucun abonnement actif à annuler', 404);

      res.json({ status: 'success', data: membership });
    } catch (err) {
      next(err);
    }
  },
};
