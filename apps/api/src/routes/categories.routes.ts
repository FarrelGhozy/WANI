import { Router, Response, NextFunction } from 'express';
import { requireMerchant, AuthRequest } from '../middleware/auth.js';
import { listCategories } from '../services/index.js';

const router = Router();
router.use(requireMerchant);

// GET /api/categories
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await listCategories(req.merchant!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as categoriesRouter };
