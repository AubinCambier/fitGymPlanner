import type { Request, Response, NextFunction } from 'express';
import { sessionTypeModel } from '../models/sessionTypeModel.js';
import { AppError } from '../utils/AppError.js';

export const sessionTypeController = {
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await sessionTypeModel.findAll();
      res.json({ status: 'success', data: types });
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      const type = await sessionTypeModel.create({ name, description });
      res.status(201).json({ status: 'success', data: type });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { name, description } = req.body;

      const type = await sessionTypeModel.update(id, { name, description });
      if (!type) throw new AppError('Type de session introuvable', 404);

      res.json({ status: 'success', data: type });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const deleted = await sessionTypeModel.delete(id);
      if (!deleted) throw new AppError('Type de session introuvable', 404);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
