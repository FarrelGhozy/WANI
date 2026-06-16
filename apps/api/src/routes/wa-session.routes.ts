import { Router, Response, NextFunction } from 'express';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import {
  getSessionStatus,
  initiateConnection,
  getQRCode,
  disconnectSession,
  getSessionHistory,
} from '../services/wa-session.service.js';

const router = Router();

// GET /api/wa-session/:merchantId/status
router.get(
  '/wa-session/:merchantId/status',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getSessionStatus(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/wa-session/:merchantId/connect
router.post(
  '/wa-session/:merchantId/connect',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await initiateConnection(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/wa-session/:merchantId/qr
router.get(
  '/wa-session/:merchantId/qr',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getQRCode(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/wa-session/:merchantId/disconnect
router.post(
  '/wa-session/:merchantId/disconnect',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await disconnectSession(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/wa-session/:merchantId/history
router.get(
  '/wa-session/:merchantId/history',
  requireMerchant,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getSessionHistory(req.params.merchantId as string);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

export { router as waSessionRouter };
