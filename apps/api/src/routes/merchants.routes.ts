import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  getMerchantById,
  updateMerchant,
  getMerchantStats,
} from '../services/merchant.service.js';

const router = Router();
router.use(requireMerchant);

const updateSchema = z.object({
  businessName: z.string().min(1).max(100).optional(),
  address: z.string().optional(),
});

// GET /api/merchants/me
router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getMerchantById(req.merchant!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/merchants/me
router.put(
  '/me',
  validate(updateSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await updateMerchant(req.merchant!.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/merchants/me/stats
router.get('/me/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getMerchantStats(req.merchant!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as merchantsRouter };
