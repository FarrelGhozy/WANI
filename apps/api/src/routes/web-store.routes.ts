import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  getWebStore,
  updateWebStore,
  publishWebStore,
  unpublishWebStore,
  getWebStoreBySlug,
  listTemplates,
  getTemplate,
} from '../services/web-store.service.js';

const router = Router();

const updateSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
  template: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDesc: z.string().max(160).optional(),
  heroImage: z.string().url().optional(),
  heroText: z.string().max(200).optional(),
  customDomain: z.string().optional(),
  theme: z.object({
    colors: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    }).optional(),
    fonts: z.object({
      heading: z.string().optional(),
      body: z.string().optional(),
    }).optional(),
    layout: z.object({
      style: z.enum(['modern', 'minimal', 'classic']).optional(),
      rounded: z.boolean().optional(),
      shadows: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

// GET /api/web-store/:merchantId
router.get(
  '/web-store/:merchantId',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getWebStore(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/web-store/:merchantId
router.put(
  '/web-store/:merchantId',
  requireMerchant,
  validate(updateSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await updateWebStore(req.params.merchantId as string, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/web-store/:merchantId/publish
router.post(
  '/web-store/:merchantId/publish',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await publishWebStore(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/web-store/:merchantId/unpublish
router.post(
  '/web-store/:merchantId/unpublish',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await unpublishWebStore(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/web-store/public/:slug (no auth)
router.get(
  '/web-store/public/:slug',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getWebStoreBySlug(req.params.slug as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/templates
router.get(
  '/templates',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await listTemplates();
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/templates/:name
router.get(
  '/templates/:name',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getTemplate(req.params.name as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export { router as webStoreRouter };
