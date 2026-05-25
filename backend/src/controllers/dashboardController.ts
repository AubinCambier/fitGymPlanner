import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '../middlewares/authenticate.js'
import { dashboardModel } from '../models/dashboardModel.js'

export const dashboardController = {
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardModel.getStats()
      res.json({ status: 'success', data: stats })
    } catch (err) {
      next(err)
    }
  },
}
