import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../services/product.service.js';

const router = Router();
router.use(requireMerchant);

const createSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(200),
  price: z.number().positive('Harga harus lebih dari 0'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  isAvailable: z.boolean().default(true),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  price: z.number().positive().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  stock: z.number().int().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// GET /api/products
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await listProducts(req.merchant!.id, { page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/products
router.post(
  '/',
  validate(createSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await createProduct({ ...req.body, merchantId: req.merchant!.id });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/products/:id
router.put(
  '/:id',
  validate(updateSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await updateProduct(req.params.id as string, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/products/:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await deleteProduct(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as productsRouter };
