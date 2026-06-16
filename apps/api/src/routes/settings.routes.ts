import { Router, Response, NextFunction } from 'express';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { getSettings, updateSettings } from '../services/settings.service.js';

const router = Router();
router.use(requireMerchant);

// GET /api/settings
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await getSettings(req.merchant!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await updateSettings(req.merchant!.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as settingsRouter };
