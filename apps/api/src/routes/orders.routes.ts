import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  listOrders,
  getOrderById,
  transitionOrderStatus,
} from '../services/order.service.js';
import { OrderStatus } from '@prisma/client';

const router = Router();
router.use(requireMerchant);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  customerId: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

// GET /api/orders
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const status = req.query.status as OrderStatus | undefined;
      const customerId = req.query.customerId as string | undefined;
      const result = await listOrders(
        req.merchant!.id,
        { page, limit },
        { status, customerId },
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/orders/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getOrderById(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/orders/:id/status
router.put(
  '/:id/status',
  validate(updateStatusSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await transitionOrderStatus(
        req.params.id as string,
        { status: req.body.status },
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export { router as ordersRouter };
