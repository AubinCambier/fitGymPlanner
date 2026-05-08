import type { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import type { AuthRequest } from '../middlewares/authenticate.js';
import { userModel } from '../models/userModel.js';
import { AppError } from '../utils/AppError.js';

function safeUser(user: Awaited<ReturnType<typeof userModel.findById>>) {
  if (!user) return null;
  const { password_hash: _, ...safe } = user;
  return safe;
}

export const adminUserController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query['role'] as string | undefined;
      const activeParam = req.query['active'] as string | undefined;
      const active = activeParam === undefined ? undefined : activeParam === 'true';

      const filters: { role?: string; active?: boolean } = {};
      if (role !== undefined) filters.role = role;
      if (active !== undefined) filters.active = active;
      const users = await userModel.findAll(filters);
      res.json({ status: 'success', data: users });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const user = await userModel.findById(id);
      if (!user) throw new AppError('Utilisateur introuvable', 404);

      res.json({ status: 'success', data: safeUser(user) });
    } catch (err) {
      next(err);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, first_name, last_name, role } = req.body;

      const existing = await userModel.findByEmail(email);
      if (existing) throw new AppError('Email déjà utilisé', 409);

      const password_hash = await bcrypt.hash(password, 12);
      const user = await userModel.create({ email, password_hash, first_name, last_name, role });

      res.status(201).json({ status: 'success', data: safeUser(user) });
    } catch (err) {
      next(err);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { email, password, first_name, last_name, role } = req.body;

      const existing = await userModel.findById(id);
      if (!existing) throw new AppError('Utilisateur introuvable', 404);

      if (email) {
        const byEmail = await userModel.findByEmail(email);
        if (byEmail && byEmail.id !== id) throw new AppError('Email déjà utilisé', 409);
      }

      const updateData: Parameters<typeof userModel.update>[1] = {};
      if (email !== undefined) updateData.email = email;
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (role !== undefined) updateData.role = role;
      if (password) updateData.password_hash = await bcrypt.hash(password, 12);

      const user = await userModel.update(id, updateData);
      res.json({ status: 'success', data: safeUser(user) });
    } catch (err) {
      next(err);
    }
  },

  async setStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const { is_active } = req.body as { is_active: boolean };

      if (typeof is_active !== 'boolean') throw new AppError('is_active doit être un booléen', 400);

      const user = await userModel.setStatus(id, is_active);
      if (!user) throw new AppError('Utilisateur introuvable', 404);

      res.json({ status: 'success', data: user });
    } catch (err) {
      next(err);
    }
  },
};
