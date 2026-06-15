import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { listCustomers, getCustomerById } from '../services/customer.service.js';

const router = Router();
router.use(requireMerchant);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/customers
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await listCustomers(req.merchant!.id, { page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/customers/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getCustomerById(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as customersRouter };
