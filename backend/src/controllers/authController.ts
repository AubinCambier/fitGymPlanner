import type { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { userModel } from '../models/userModel.js';
import { JwtManager } from '../utils/JwtManager.js';
import { AppError } from '../utils/AppError.js';
import type { AuthRequest } from '../middlewares/authenticate.js';

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, first_name, last_name } = req.body;

      const existing = await userModel.findByEmail(email);
      if (existing) throw new AppError('Email already in use', 409);

      const password_hash = await bcrypt.hash(password, 12);
      const user = await userModel.create({ email, password_hash, first_name, last_name });

      res.status(201).json({
        status: 'success',
        data: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await userModel.findByEmail(email);
      if (!user) throw new AppError('Invalid credentials', 401);
      if (!user.is_active) throw new AppError('Account disabled', 403);

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) throw new AppError('Invalid credentials', 401);

      const token = JwtManager.createJWT(user.id, user.role, user.email, user.password_hash);

      res.json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_active: user.is_active,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userModel.findById(req.user!.id);
      if (!user) throw new AppError('User not found', 404);

      res.json({
        status: 'success',
        data: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active,
          created_at: user.created_at,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, first_name, last_name } = req.body;

      if (email) {
        const existing = await userModel.findByEmail(email);
        if (existing && existing.id !== req.user!.id) throw new AppError('Email already in use', 409);
      }

      const updateData: Parameters<typeof userModel.update>[1] = {};
      if (email !== undefined) updateData.email = email;
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (password) updateData.password_hash = await bcrypt.hash(password, 12);

      const user = await userModel.update(req.user!.id, updateData);

      res.json({
        status: 'success',
        data: {
          id: user!.id,
          email: user!.email,
          first_name: user!.first_name,
          last_name: user!.last_name,
          role: user!.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
