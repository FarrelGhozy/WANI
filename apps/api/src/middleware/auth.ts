import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthRequest extends Request {
  merchant?: { id: string; businessName: string; phone: string };
  customer?: { id: string; merchantId: string; phone: string };
}

export function requireMerchant(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as {
      type: 'merchant';
      id: string;
      businessName: string;
      phone: string;
    };
    req.merchant = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

// Simple token for customers (short-lived, for webhook verification)
export function generateMerchantToken(payload: { id: string; businessName: string; phone: string }) {
  return jwt.sign({ ...payload, type: 'merchant' }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}
