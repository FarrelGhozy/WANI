import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  getAIAgentByMerchant,
  createAIAgent,
  updateAIAgent,
  toggleAIAgent,
  createAIAgentSchema,
  updateAIAgentSchema,
} from '../services/ai-agent.service.js';

const router = Router();
router.use(requireMerchant);

// GET /api/ai-agent/me
router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getAIAgentByMerchant(req.merchant!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/ai-agent/me (create or update)
router.put(
  '/me',
  validate(updateAIAgentSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const existing = await getAIAgentByMerchant(req.merchant!.id);
      if (existing.success && existing.data) {
        const agent = existing.data as { id: string };
        const result = await updateAIAgent(agent.id, req.body);
        res.json(result);
      } else {
        const result = await createAIAgent({
          merchantId: req.merchant!.id,
          systemPrompt: req.body.systemPrompt || '',
          model: req.body.model,
          greetingMessage: req.body.greetingMessage,
          knowledgeBase: req.body.knowledgeBase,
          maxTokens: req.body.maxTokens,
          temperature: req.body.temperature,
        });
        res.status(201).json(result);
      }
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/ai-agent/me/toggle
router.post('/me/toggle', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const existing = await getAIAgentByMerchant(req.merchant!.id);
    if (!existing.success || !existing.data) {
      return res.status(404).json({ success: false, error: 'AI Agent not found' });
    }
    const agent = existing.data as { id: string };
    const result = await toggleAIAgent(agent.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as aiAgentRouter };
