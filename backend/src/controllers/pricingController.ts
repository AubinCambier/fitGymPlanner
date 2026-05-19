import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { pricingModel } from '../models/pricingModel.js';
import { AppError } from '../utils/AppError.js';

export const pricingController = {
  async getPublic(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pricing = await pricingModel.findAllActive();
      res.json({ status: 'success', data: pricing });
    } catch (err) {
      next(err);
    }
  },

  async getAll(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pricing = await pricingModel.findAll();
      res.json({ status: 'success', data: pricing });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { label, payment_mode, price, currency } = req.body;
      const pricing = await pricingModel.create({ label, payment_mode, price, currency });
      res.status(201).json({ status: 'success', data: pricing });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const existing = await pricingModel.findById(id);
      if (!existing) throw new AppError('Tarif introuvable', 404);

      const pricing = await pricingModel.update(id, req.body);
      res.json({ status: 'success', data: pricing });
    } catch (err) {
      next(err);
    }
  },

  async setStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { is_active } = req.body as { is_active: boolean };

      if (typeof is_active !== 'boolean') throw new AppError('is_active must be a boolean', 400);

      const pricing = await pricingModel.setStatus(id, is_active);
      if (!pricing) throw new AppError('Tarif introuvable', 404);

      res.json({ status: 'success', data: pricing });
    } catch (err) {
      next(err);
    }
  },
};
