import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { validate } from '../middleware/validator.js';
import { AuthRequest, generateMerchantToken } from '../middleware/auth.js';
import {
  createMerchant,
  getMerchantByPhone,
} from '../services/merchant.service.js';
import { success } from '../utils/helpers.js';
import { registerSchema, loginSchema } from '../lib/validation.js';

const router = Router();

function setTokenCookie(res: Response, token: string) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const existing = await getMerchantByPhone(req.body.phone);
      if (existing.success && existing.data) {
        return res.status(409).json({ success: false, error: 'Nomor WA sudah terdaftar' });
      }

      const passwordHash = await bcrypt.hash(req.body.password, 12);
      const result = await createMerchant({
        businessName: req.body.businessName,
        phone: req.body.phone,
        passwordHash,
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      const full = result.data as { id: string; businessName: string; phone: string; passwordHash?: string };
      const merchant = { id: full.id, businessName: full.businessName, phone: full.phone };
      const token = generateMerchantToken(merchant);

      setTokenCookie(res, token);
      res.status(201).json(success({ merchant, token }));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema, 'body'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await getMerchantByPhone(req.body.phone);
      if (!result.success || !result.data) {
        return res.status(401).json({ success: false, error: 'Nomor WA atau kata sandi salah' });
      }

      const merchant = result.data as { id: string; businessName: string; phone: string; passwordHash: string | null };

      if (!merchant.passwordHash) {
        return res.status(401).json({ success: false, error: 'Akun ini belum memiliki kata sandi' });
      }

      const valid = await bcrypt.compare(req.body.password, merchant.passwordHash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Nomor WA atau kata sandi salah' });
      }

      const token = generateMerchantToken({
        id: merchant.id,
        businessName: merchant.businessName,
        phone: merchant.phone,
      });

      setTokenCookie(res, token);
      res.json(success({ merchant: { id: merchant.id, businessName: merchant.businessName, phone: merchant.phone }, token }));
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/auth/logout
router.post('/logout', (_req: AuthRequest, res: Response) => {
  res.clearCookie('token', { path: '/' });
  res.json(success({ message: 'Logged out' }));
});

export { router as authRouter };
