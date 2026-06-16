import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

// GET /health — lightweight DB connectivity check
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let db = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'error';
    }

    res.json({
      status: 'ok',
      db,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export { router as healthRouter };
