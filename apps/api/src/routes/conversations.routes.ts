import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  listConversations,
  getConversationById,
  getMessages,
} from '../services/conversation.service.js';

const router = Router();
router.use(requireMerchant);

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
});

const messagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// GET /api/conversations
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await listConversations(req.merchant!.id, { page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/conversations/:id
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getConversationById(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id/messages
router.get(
  '/:id/messages',
  validate(messagesQuerySchema, 'query'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const result = await getMessages(req.params.id as string, { page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export { router as conversationsRouter };
