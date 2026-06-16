import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  getDashboardStats,
  getRecentOrders,
  getRecentActivity,
} from '../services/dashboard.service.js';

const router = Router();
router.use(requireMerchant);

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

// GET /api/dashboard/stats
router.get(
  '/stats',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getDashboardStats(req.merchant!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/dashboard/recent-orders
router.get(
  '/recent-orders',
  validate(listQuerySchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query as unknown as { limit: number };
      const result = await getRecentOrders(req.merchant!.id, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/dashboard/activity
router.get(
  '/activity',
  validate(listQuerySchema.extend({ limit: z.coerce.number().int().min(1).max(50).default(10) }), 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { limit } = req.query as unknown as { limit: number };
      const result = await getRecentActivity(req.merchant!.id, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export { router as dashboardRouter };
