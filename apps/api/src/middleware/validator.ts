import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AuthRequest } from './auth.js';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req[source] = result.data;
    next();
  };
}
