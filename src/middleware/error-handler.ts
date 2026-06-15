import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ err }, 'Unhandled error');

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}
